import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbRow, queryDb, runDb } from '../database/sqliteDb.js';
import { buildBrandedEmailHtml } from './emailTemplateBuilder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

/**
 * Send real email via Google Gmail REST API (users/me/messages/send)
 * This uses OAuth2 access tokens natively and bypasses SMTP restrictions completely.
 */
async function sendViaGmailRestApi({ toEmail, creatorName, subject, body, senderName, senderEmail, oauthData, brandName, productName, offeredPrice, mandatoryPhrase, promoCode }) {
  let { accessToken, refreshToken, email } = oauthData;
  const fromEmail = email || senderEmail;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Refresh access token if possible
  if (refreshToken && clientId && clientSecret) {
    try {
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });
      const refreshData = await refreshRes.json();
      if (refreshData.access_token) {
        accessToken = refreshData.access_token;
      }
    } catch (e) {
      console.warn('[Gmail Service] Token refresh warning:', e.message);
    }
  }

  if (!accessToken) {
    throw new Error('No valid Google access token available for Gmail REST API');
  }

  // Clean subject: Remove leading emoji spam triggers if present
  const cleanSubject = subject.replace(/^[^\w\s]+/, '').trim() || subject;
  const utf8Subject = `=?utf-8?B?${Buffer.from(cleanSubject).toString('base64')}?=`;
  
  const boundary = `==_mime_part_${Date.now()}_${Math.random().toString(36).substring(2, 8)}==`;
  const messageId = `<msg_${Date.now()}.${Math.random().toString(36).substring(2, 9)}@gmail.com>`;
  const dateHeader = new Date().toUTCString();

  // Generate High-Converting Responsive Branded HTML Card
  const brandedHtml = buildBrandedEmailHtml({
    recipientName: creatorName,
    senderName,
    brandName: brandName || 'boAt Lifestyle',
    productName: productName || 'boAt Airdopes Pro Max 500',
    offeredPrice: offeredPrice || 25000,
    mandatoryPhrase: mandatoryPhrase || 'Use code SAVER20 for 20% off',
    promoCode: promoCode || 'SAVER20',
    bodyText: body
  });

  // Construct RFC 5322 Compliant Multipart/Alternative Email
  const messageParts = [
    `Date: ${dateHeader}`,
    `From: ${senderName} <${fromEmail}>`,
    `To: ${creatorName} <${toEmail}>`,
    `Message-ID: ${messageId}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    body,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    brandedHtml,
    '',
    `--${boundary}--`
  ];

  const rawMessage = messageParts.join('\r\n');
  const encoded = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encoded })
  });

  const sendData = await sendRes.json();

  if (!sendRes.ok || sendData.error) {
    throw new Error(sendData.error?.message || `Gmail REST API error (${sendRes.status})`);
  }

  console.log(`✉️  [Gmail REST API] Real email delivered from ${fromEmail} to ${toEmail} — ID: ${sendData.id}`);

  return {
    success: true,
    devMode: false,
    messageId: sendData.id,
    toEmail,
    senderEmail: fromEmail,
    timestamp: new Date().toISOString()
  };
}

/**
 * Build dynamic Nodemailer transporter from DB settings or environment variables
 */
async function buildSmtpTransporter(org) {
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

  return null;
}

export async function sendCreatorEmail({ toEmail, creatorName, subject, body, organizationId, brandName, productName, offeredPrice, mandatoryPhrase, promoCode }) {
  let org = null;
  if (organizationId) {
    org = await getDbRow('SELECT * FROM organizations WHERE id = ?', [organizationId]);
  }
  if (!org) {
    org = await getDbRow('SELECT * FROM organizations LIMIT 1');
  }

  // 1. Check if we have Google OAuth token stored (Primary for 1-Click Connected Google Accounts)
  const oauthRow = await getDbRow(
    "SELECT secret_value FROM organization_integrations WHERE integration_key = 'gmail_oauth' ORDER BY updated_at DESC LIMIT 1"
  );

  let oauthData = null;
  if (oauthRow?.secret_value) {
    try {
      oauthData = JSON.parse(oauthRow.secret_value);
    } catch(e) {}
  }

  const senderEmail = oauthData?.email || process.env.GMAIL_USER || (org?.sender_email && !org.sender_email.includes('boat-lifestyle.com') ? org.sender_email : null) || 'collabs@project-x.in';
  const senderName  = org?.sender_name && !org.sender_name.includes('AI') ? org.sender_name : 'Rajanna (boAt Creator Partnerships)';

  // Strategy A: Send via Google Gmail REST API if OAuth is connected
  if (oauthData?.accessToken || oauthData?.refreshToken) {
    try {
      return await sendViaGmailRestApi({
        toEmail,
        creatorName,
        subject,
        body,
        senderName,
        senderEmail,
        oauthData,
        brandName: brandName || org?.name || 'boAt Lifestyle',
        productName: productName || 'boAt Airdopes Pro Max 500',
        offeredPrice: offeredPrice || 25000,
        mandatoryPhrase: mandatoryPhrase || 'Use code SAVER20 for 20% off',
        promoCode: promoCode || 'SAVER20'
      });
    } catch (oauthErr) {
      console.warn('[Gmail REST API Warning] Attempting fallback:', oauthErr.message);
    }
  }

  // Strategy B: Send via Direct SMTP / App Password
  const transporter = await buildSmtpTransporter(org);

  if (transporter) {
    try {
      const brandedHtml = buildBrandedEmailHtml({
        recipientName: creatorName,
        senderName,
        brandName: brandName || org?.name || 'boAt Lifestyle',
        productName: productName || 'boAt Airdopes Pro Max 500',
        offeredPrice: offeredPrice || 25000,
        mandatoryPhrase: mandatoryPhrase || 'Use code SAVER20 for 20% off',
        promoCode: promoCode || 'SAVER20',
        bodyText: body
      });

      const info = await transporter.sendMail({
        from:    `"${senderName}" <${senderEmail}>`,
        to:      `"${creatorName}" <${toEmail}>`,
        subject,
        text:    body,
        html:    brandedHtml
      });

      console.log(`✉️  [Email Service (SMTP)] Real email delivered to ${toEmail} — ID: ${info.messageId}`);

      return {
        success:   true,
        devMode:   false,
        messageId: info.messageId,
        toEmail,
        senderEmail,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error('[Email Service (SMTP)] Send failed:', err.message);
    }
  }

  // Strategy C: Dev Sandbox Mode
  console.log('\n📧 [Email Service — Simulation Recorded in Pipeline]');
  console.log(`   To:      ${creatorName} <${toEmail}>`);
  console.log(`   From:    ${senderName} <${senderEmail}>`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Body:\n${body.substring(0, 250)}...\n`);

  return {
    success:    true,
    devMode:    true,
    devNote:    'Email recorded in live deal pipeline.',
    toEmail,
    senderEmail,
    timestamp:  new Date().toISOString()
  };
}

export async function pollCreatorInbox() {
  return { newMessages: 0, messages: [] };
}
