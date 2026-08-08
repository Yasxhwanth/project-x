import nodemailer from 'nodemailer';
import { getDbRow } from '../database/sqliteDb.js';

/**
 * Gmail / SMTP Email Service
 *
 * Priority chain:
 *   1. SMTP credentials in org settings (smtp_host, smtp_user, smtp_pass) → real send
 *   2. GMAIL_APP_PASSWORD env var → Gmail SMTP via app password
 *   3. No credentials → log to console only (dev mode, clearly labeled)
 */

function buildTransporter(org) {
  // Option A: Org-stored SMTP config (most flexible — works with SendGrid, Zoho, etc.)
  if (org?.smtp_host && org?.smtp_user && org?.smtp_pass) {
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

  // Option B: Google OAuth 2.0 Tokens (1-Click User Permission Grant)
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleRefreshToken = org?.google_refresh_token || process.env.GOOGLE_REFRESH_TOKEN;
  const gmailUser = org?.sender_email || process.env.GMAIL_USER;

  if (googleClientId && googleClientSecret && googleRefreshToken && gmailUser) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: gmailUser,
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        refreshToken: googleRefreshToken
      }
    });
  }

  // Option C: Gmail App Password from environment
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass }
    });
  }

  return null; // no credentials — dev mode
}

export async function sendCreatorEmail({ toEmail, creatorName, subject, body, organizationId }) {
  const org = await getDbRow('SELECT * FROM organizations WHERE id = ?', [organizationId || 'org_boat_01']);

  const senderEmail = org?.sender_email || process.env.GMAIL_USER || 'collabs@project-x.in';
  const senderName  = org?.sender_name  || 'Project X Marketing AI';

  const transporter = buildTransporter(org);

  if (!transporter) {
    // Dev mode — log clearly, never pretend email was sent
    console.log('\n📧 [Email Service — DEV MODE, not sent]');
    console.log(`   To:      ${creatorName} <${toEmail}>`);
    console.log(`   From:    ${senderName} <${senderEmail}>`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:\n${body.substring(0, 300)}...`);
    console.log('   ⚠️  Configure GMAIL_USER + GMAIL_APP_PASSWORD (or SMTP settings) to send real emails.\n');

    return {
      success:    false,
      devMode:    true,
      devNote:    'Email logged to console only. No credentials configured.',
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
      html:    `<div style="font-family:sans-serif;white-space:pre-wrap">${body.replace(/\n/g, '<br>')}</div>`
    });

    console.log(`✉️  [Email Service] Sent to ${toEmail} — Message-ID: ${info.messageId}`);

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

/**
 * Poll creator inbox — requires IMAP / Gmail API OAuth.
 * Returns honest status rather than always returning 0.
 */
export async function pollCreatorInbox(organizationId = 'org_boat_01') {
  const org = await getDbRow('SELECT * FROM organizations WHERE id = ?', [organizationId]);

  if (!org?.smtp_host && !process.env.GMAIL_APP_PASSWORD) {
    return {
      polled: false,
      devNote: 'Inbox polling requires IMAP credentials. Configure GMAIL_APP_PASSWORD or smtp_pass.',
      newMessagesCount: 0,
      timestamp: new Date().toISOString()
    };
  }

  // Real IMAP polling would go here (imap / imapflow library)
  return {
    polled: false,
    devNote: 'IMAP polling not yet implemented. Configure imapflow for real inbox reading.',
    newMessagesCount: 0,
    timestamp: new Date().toISOString()
  };
}
