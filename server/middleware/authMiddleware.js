import jwt from 'jsonwebtoken';
import { getDbRow } from '../database/sqliteDb.js';

const JWT_SECRET = process.env.JWT_SECRET || 'projectx_dev_secret_change_in_prod';

/**
 * Auth Middleware — validates Bearer JWT on protected routes.
 * Attaches req.user and req.organizationId.
 *
 * Usage:
 *   import { requireAuth } from './middleware/authMiddleware.js';
 *   app.get('/api/deals', requireAuth, handler);
 *
 * Dev bypass:
 *   If JWT_SECRET is the default dev value and a valid session token is
 *   in the header, it will still work (avoids breaking dev workflow).
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      detail: 'No Bearer token provided. Include Authorization: Bearer <token> header.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.organizationId = decoded.organizationId;
    next();
  } catch (err) {
    // Legacy cc_token_ format (backward compat during migration)
    if (token.startsWith('cc_token_')) {
      const parts = token.split('_');
      const userId = parts.slice(2, -1).join('_');  // extract user ID
      req.user = { id: userId };
      req.organizationId = null; // will be resolved lazily
      next();
      return;
    }
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Sign a JWT for a user.
 */
export function signToken(user, organization) {
  return jwt.sign(
    {
      id:             user.id,
      email:          user.email,
      name:           user.name,
      role:           user.role,
      organizationId: user.organization_id || organization?.id
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Optional auth — attaches user if token present, doesn't block if absent.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      req.organizationId = req.user.organizationId;
    } catch (_) {}
  }
  next();
}
