import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbRow, queryDb } from '../database/sqliteDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

/**
 * Build dynamic Nodemailer transporter from DB settings or environment variables
 */
async function buildTransporter(org) {
  // Option 1: DB Org SMTP settings (Host + User + Pass)
  if (org?.smtp_host && org?.smtp_user && org?.smtp_pass) {
    const isGmail = org.smtp_host.includes('gmail.com');
    if (isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: org.smtp_user,
          pass: org.smtp_pass
        }
      });
    }

    return nodemailer.createTransport({
      host:   org.smtp_host,
      port:   parseInt(org.smtp_port || '587', 10),
      secure: (org.smtp_port || '587') === '465',
      auth: {
        user: org.smtp_user,
        pass: org.smtp_pass
      }
    });
  }

  // Option 2: DB Org Gmail App Password (sender_email + smtp_pass)
  if (org?.sender_email && org?.smtp_pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: org.sender_email,
        pass: org.smtp_pass
      }
    });
  }

  // Option 3: Environment Gmail App Password
  const envGmailUser = process.env.GMAIL_USER || (org?.sender_email && !org.sender_email.includes('boat-lifestyle.com') ? org.sender_email : null);
  const envGmailPass = process.env.GMAIL_APP_PASSWORD;
  if (envGmailUser && envGmailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: envGmailUser,
        pass: envGmailPass
      }
    });
  }

  // Option 4: Google OAuth 2.0 from Integrations DB or Environment
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  let googleRefreshToken = org?.google_refresh_token || process.env.GOOGLE_REFRESH_TOKEN;
  let oauthUser = envGmailUser;

  if (!googleRefreshToken) {
    const integration = await getDbRow(
      "SELECT secret_value FROM organization_integrations WHERE integration_key = 'gmail_oauth' ORDER BY updated_at DESC LIMIT 1"
    );
    if (integration?.secret_value) {
      try {
        const parsed = JSON.parse(integration.secret_value);
        if (parsed.refreshToken) {
          googleRefreshToken = parsed.refreshToken;
          oauthUser = parsed.email || oauthUser;
        }
      } catch (e) {}
    }
  }

  if (googleClientId && googleClientSecret && googleRefreshToken && oauthUser) {
    return nodemailer.createTransport({
      service: 'gmail',
      connectionTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        type: 'OAuth2',
        user: oauthUser,
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        refreshToken: googleRefreshToken
      }
    });
  }

  return null; // no credentials — dev mode
}

export async function sendCreatorEmail({ toEmail, creatorName, subject, body, organizationId }) {
  let org = null;
  if (organizationId) {
    org = await getDbRow('SELECT * FROM organizations WHERE id = ?', [organizationId]);
  }
  if (!org) {
    org = await getDbRow('SELECT * FROM organizations LIMIT 1');
  }

  const senderEmail = process.env.GMAIL_USER || (org?.sender_email && !org.sender_email.includes('boat-lifestyle.com') ? org.sender_email : null) || 'collabs@project-x.in';
  const senderName  = org?.sender_name  || 'Project X Marketing AI';

  const transporter = await buildTransporter(org);

  if (!transporter) {
    // Dev mode — log clearly, never pretend email was sent
    console.log('\n📧 [Email Service — DEV MODE, not sent]');
    console.log(`   To:      ${creatorName} <${toEmail}>`);
    console.log(`   From:    ${senderName} <${senderEmail}>`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:\n${body.substring(0, 300)}...`);
    console.log('   ⚠️  Configure SMTP settings / Gmail App Password in Settings to send real emails.\n');

    return {
      success:    false,
      devMode:    true,
      devNote:    'Email logged to server console (Dev Sandbox mode). Configure Gmail App Password or SMTP in Organization Settings for live inbox delivery.',
      toEmail,
      senderEmail,
      timestamp:  new Date().toISOString()
    };
  }

  try {
    const info = await transporter.sendMail({
      from:    `"${senderName}" <${senderEmail}>`,
      to:      `"${creatorName}" <${toEmail}>`,
      subject,
      text:    body,
      html:    `<div style="font-family:sans-serif;white-space:pre-wrap;line-height:1.6">${body.replace(/\n/g, '<br>')}</div>`
    });

    console.log(`✉️  [Email Service] Real email delivered to ${toEmail} — Message-ID: ${info.messageId}`);

    return {
      success:   true,
      devMode:   false,
      messageId: info.messageId,
      toEmail,
      senderEmail,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('[Email Service] Send failed:', err.message);
    return {
      success:    false,
      devMode:    false,
      error:      err.message,
      toEmail,
      senderEmail,
      timestamp:  new Date().toISOString()
    };
  }
}

export async function pollCreatorInbox(organizationId = 'org_boat_01') {
  const org = await getDbRow('SELECT * FROM organizations WHERE id = ?', [organizationId]);

  if (!org?.smtp_host && !process.env.GMAIL_APP_PASSWORD && !org?.smtp_pass) {
    return {
      polled: false,
      devNote: 'Inbox polling requires IMAP credentials. Configure GMAIL_APP_PASSWORD or smtp_pass.',
      newMessagesCount: 0,
      timestamp: new Date().toISOString()
    };
  }

  return {
    polled: false,
    devNote: 'IMAP polling not yet implemented. Configure imapflow for real inbox reading.',
    newMessagesCount: 0,
    timestamp: new Date().toISOString()
  };
}
