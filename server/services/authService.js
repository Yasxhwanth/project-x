import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { queryDb, getDbRow, runDb } from '../database/sqliteDb.js';
import { signToken } from '../middleware/authMiddleware.js';
import { sendCreatorEmail } from './gmailEmailService.js';

/**
 * Password Login — validates credentials, returns signed JWT
 */
export async function loginUser({ email, password }) {
  const cleanEmail = email.trim().toLowerCase();
  const user = await getDbRow('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);

  if (!user) throw new Error('Invalid email or password');

  // Support both bcrypt hashes and legacy plain text (seed data)
  const isValid = user.password_hash.startsWith('$2')
    ? await bcrypt.compare(password, user.password_hash)
    : user.password_hash === password;

  if (!isValid) throw new Error('Invalid email or password');

  const organization = await getDbRow('SELECT * FROM organizations WHERE id = ?', [user.organization_id]);
  const token = signToken(user, organization);

  return {
    token,
    user: {
      id:             user.id,
      name:           user.name,
      email:          user.email,
      role:           user.role,
      avatar:         user.avatar,
      organizationId: user.organization_id
    },
    organization: organization ? {
      id:     organization.id,
      name:   organization.name,
      slug:   organization.slug,
      plan:   organization.plan,
      apiKey: organization.api_key
    } : null
  };
}

/**
 * Send 6-Digit Email / Mobile OTP
 */
export async function sendLoginOtp({ email }) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Valid email address is required for OTP verification');
  }

  // Generate 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const id   = 'otp_' + uuidv4().substring(0, 8);

  // Invalidate any old OTPs for this email
  await runDb(`DELETE FROM otps WHERE LOWER(email) = ?`, [cleanEmail]);

  // Insert new OTP with 10-minute expiry
  await runDb(
    `INSERT INTO otps (id, email, code, expires_at) VALUES (?, ?, ?, datetime('now', '+10 minutes'))`,
    [id, cleanEmail, code]
  );

  // Send real email via Nodemailer
  await sendCreatorEmail({
    toEmail: cleanEmail,
    creatorName: cleanEmail.split('@')[0],
    subject: '🔐 Your Project X Login OTP Code',
    body: `Your Project X verification code is: ${code}\n\nThis code is valid for 10 minutes. Do not share it with anyone.`
  });

  console.log(`🔑 [Auth OTP] Sent code ${code} to ${cleanEmail}`);

  return {
    success: true,
    message: `Verification code sent to ${cleanEmail}`,
    devOtp: code // Included for instant dev/demo convenience
  };
}

/**
 * Verify 6-Digit OTP and Log In / Auto-Register User
 */
export async function verifyLoginOtp({ email, code }) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode  = code.trim();

  const otpRow = await getDbRow(
    `SELECT * FROM otps WHERE LOWER(email) = ? AND code = ? AND expires_at > datetime('now')`,
    [cleanEmail, cleanCode]
  );

  if (!otpRow) {
    throw new Error('Invalid or expired OTP code. Please request a new verification code.');
  }

  // Delete used OTP
  await runDb(`DELETE FROM otps WHERE id = ?`, [otpRow.id]);

  // Find or auto-create user
  let user = await getDbRow('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);

  if (!user) {
    // Auto-create user & org if brand new
    const orgName = `${cleanEmail.split('@')[0]} Org`;
    const name    = cleanEmail.split('@')[0];
    const created = await registerUserAndOrganization({
      name,
      email: cleanEmail,
      password: uuidv4(),
      organizationName: orgName,
      plan: 'Pro Plan',
      role: 'Brand Admin'
    });
    return created;
  }

  const organization = await getDbRow('SELECT * FROM organizations WHERE id = ?', [user.organization_id]);
  const token = signToken(user, organization);

  return {
    token,
    user: {
      id:             user.id,
      name:           user.name,
      email:          user.email,
      role:           user.role,
      avatar:         user.avatar,
      organizationId: user.organization_id
    },
    organization: organization ? {
      id:     organization.id,
      name:   organization.name,
      slug:   organization.slug,
      plan:   organization.plan,
      apiKey: organization.api_key
    } : null
  };
}

/**
 * Google OAuth / One-Tap Login
 */
export async function loginWithGoogle({ email, name, avatar, googleId }) {
  const cleanEmail = email.trim().toLowerCase();

  let user = await getDbRow('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);

  if (!user) {
    const orgName = `${name || cleanEmail.split('@')[0]}'s Workspace`;
    const created = await registerUserAndOrganization({
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: `google_auth_${uuidv4()}`,
      organizationName: orgName,
      plan: 'Enterprise',
      role: 'Brand Admin'
    });
    return created;
  }

  const organization = await getDbRow('SELECT * FROM organizations WHERE id = ?', [user.organization_id]);
  const token = signToken(user, organization);

  return {
    token,
    user: {
      id:             user.id,
      name:           user.name,
      email:          user.email,
      role:           user.role,
      avatar:         avatar || user.avatar,
      organizationId: user.organization_id
    },
    organization: organization ? {
      id:     organization.id,
      name:   organization.name,
      slug:   organization.slug,
      plan:   organization.plan,
      apiKey: organization.api_key
    } : null
  };
}

/**
 * Register a new user + organization
 */
export async function registerUserAndOrganization({ name, email, password, organizationName, plan = 'Pro Plan', role = 'Brand Admin' }) {
  const cleanEmail   = email.trim().toLowerCase();
  const cleanOrgName = organizationName.trim();
  const slug         = cleanOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const allowedRoles = ['Brand Admin', 'Agency Admin', 'Creator'];
  const workspaceRole = allowedRoles.includes(role) ? role : 'Brand Admin';

  const existingUser = await getDbRow('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
  if (existingUser) throw new Error('User with this email already exists');

  const orgId  = `org_${uuidv4().substring(0, 8)}`;
  const apiKey = `cc_live_${slug}_${Math.random().toString(36).substring(2, 8)}`;

  await runDb(
    `INSERT INTO organizations (id, name, slug, plan, api_key) VALUES (?, ?, ?, ?, ?)`,
    [orgId, cleanOrgName, slug, plan, apiKey]
  );

  const userId       = `user_${uuidv4().substring(0, 8)}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const avatar       = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80';

  await runDb(
    `INSERT INTO users (id, name, email, password_hash, role, organization_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, name, cleanEmail, passwordHash, workspaceRole, orgId, avatar]
  );

  return loginUser({ email: cleanEmail, password });
}

/**
 * Get current user session from JWT-decoded user object (req.user)
 * Returns null if user is not found (NO hardcoded fallbacks!).
 */
export async function getCurrentUserSession(userIdOrEmail) {
  if (!userIdOrEmail) return null;

  const user = await getDbRow(
    'SELECT * FROM users WHERE id = ? OR LOWER(email) = LOWER(?)',
    [userIdOrEmail, userIdOrEmail]
  );

  if (!user) return null;

  const organization = await getDbRow('SELECT * FROM organizations WHERE id = ?', [user.organization_id]);

  return {
    user: {
      id:             user.id,
      name:           user.name,
      email:          user.email,
      role:           user.role,
      avatar:         user.avatar,
      organizationId: user.organization_id
    },
    organization: organization ? {
      id:     organization.id,
      name:   organization.name,
      slug:   organization.slug,
      plan:   organization.plan,
      apiKey: organization.api_key
    } : null
  };
}

export async function getOrganizationMembers(organizationId) {
  return queryDb(
    'SELECT id, name, email, role, avatar, created_at FROM users WHERE organization_id = ?',
    [organizationId]
  );
}
