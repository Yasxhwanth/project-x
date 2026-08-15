import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbRow, queryDb, runDb } from '../database/sqliteDb.js';
import { processRealAiNegotiation } from './realAiNegotiator.js';
import { sendCreatorEmail } from './gmailEmailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// Ensure tracking table exists for synced Gmail message IDs
async function initSyncTable() {
  await runDb(`
    CREATE TABLE IF NOT EXISTS synced_gmail_messages (
      message_id TEXT PRIMARY KEY,
      sender_email TEXT,
      deal_id TEXT,
      snippet TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
initSyncTable().catch(() => {});

function decodeBase64Url(str) {
  if (!str) return '';
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function extractEmailBody(payload) {
  if (!payload) return '';
  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts && payload.parts.length > 0) {
    // Try to find text/plain part first
    const plainPart = payload.parts.find(p => p.mimeType === 'text/plain');
    if (plainPart && plainPart.body && plainPart.body.data) {
      return decodeBase64Url(plainPart.body.data);
    }
    // Fallback to text/html
    const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
    if (htmlPart && htmlPart.body && htmlPart.body.data) {
      const html = decodeBase64Url(htmlPart.body.data);
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }
  return '';
}

function parseSenderEmail(fromHeader = '') {
  const match = fromHeader.match(/<([^>]+)>/);
  if (match) return match[1].toLowerCase().trim();
  return fromHeader.toLowerCase().trim();
}

/**
 * Poll Google Gmail REST API for new inbound creator replies
 * Matches messages to deals by sender email and triggers AI negotiation loop
 */
export async function syncInboundCreatorReplies({ autoReply = true } = {}) {
  await initSyncTable();

  // 1. Get OAuth credentials
  const oauthRow = await getDbRow(
    "SELECT secret_value FROM organization_integrations WHERE integration_key = 'gmail_oauth' ORDER BY updated_at DESC LIMIT 1"
  );

  let oauthData = null;
  if (oauthRow?.secret_value) {
    try {
      oauthData = JSON.parse(oauthRow.secret_value);
    } catch (e) {}
  }

  if (!oauthData?.accessToken && !oauthData?.refreshToken && !process.env.GOOGLE_REFRESH_TOKEN) {
    return { success: false, reason: 'NO_OAUTH_CONNECTED', newReplies: 0 };
  }

  let accessToken = oauthData?.accessToken;
  const refreshToken = oauthData?.refreshToken || process.env.GOOGLE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Refresh access token
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
      console.warn('[Inbox Sync] Token refresh warning:', e.message);
    }
  }

  if (!accessToken) {
    return { success: false, reason: 'TOKEN_REFRESH_FAILED', newReplies: 0 };
  }

  // 2. Fetch last 15 messages from Inbox
  try {
    const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:inbox&maxResults=15', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!listRes.ok) {
      const errText = await listRes.text();
      return { success: false, error: errText, newReplies: 0 };
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    let processedCount = 0;
    const processedReplies = [];

    for (const msgSummary of messages) {
      // Check if already processed
      const alreadySynced = await getDbRow('SELECT message_id FROM synced_gmail_messages WHERE message_id = ?', [msgSummary.id]);
      if (alreadySynced) continue;

      // Fetch full message details
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgSummary.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!msgRes.ok) continue;

      const fullMsg = await msgRes.json();
      const headers = fullMsg.payload?.headers || [];
      const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
      const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
      const senderEmail = parseSenderEmail(fromHeader);
      const rawBody = extractEmailBody(fullMsg.payload);

      // Clean up body (strip quoted reply text if present)
      const cleanBody = rawBody.split(/\r?\nOn .* wrote:|\r?\nFrom:.*|\r?\n---/)[0].trim() || fullMsg.snippet || '';

      // Skip self-sent emails from the connected account
      const selfEmail = (oauthData?.email || '').toLowerCase();
      if (senderEmail === selfEmail) {
        await runDb('INSERT OR IGNORE INTO synced_gmail_messages (message_id, sender_email, snippet) VALUES (?, ?, ?)', [msgSummary.id, senderEmail, 'SELF_SENT']);
        continue;
      }

      // 3. Find matching active deal for this sender
      const dealRow = await getDbRow(
        'SELECT * FROM deals WHERE LOWER(creator_email) = ? OR email_thread_json LIKE ? ORDER BY created_at DESC LIMIT 1',
        [senderEmail, `%${senderEmail}%`]
      );

      if (!dealRow) {
        // Record as synced but not matched
        await runDb('INSERT OR IGNORE INTO synced_gmail_messages (message_id, sender_email, snippet) VALUES (?, ?, ?)', [msgSummary.id, senderEmail, cleanBody.substring(0, 100)]);
        continue;
      }

      console.log(`📥 [Inbox Sync] Matched inbound email from ${senderEmail} to Deal ${dealRow.id} (${dealRow.creator_name})`);

      // 4. Ingest creator reply into deal's email thread
      let emailThread = [];
      try {
        emailThread = JSON.parse(dealRow.email_thread_json || '[]');
      } catch (e) {
        emailThread = [];
      }

      const creatorMsgObj = {
        id: `msg_inbound_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: 'CREATOR',
        senderName: dealRow.creator_name || 'Creator',
        recipientName: 'Brand Partnerships AI',
        body: cleanBody,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: 'CREATOR_REPLY',
        gmailMessageId: msgSummary.id
      };

      emailThread.push(creatorMsgObj);

      // 5. Run AI Negotiation Engine to generate counter-offer or terms lock
      const campaignRow = await getDbRow('SELECT * FROM campaigns WHERE id = ?', [dealRow.campaign_id]) || await getDbRow('SELECT * FROM campaigns LIMIT 1');
      const campaign = {
        brandName: campaignRow?.brand_name || 'boAt Lifestyle',
        productName: campaignRow?.product_name || 'boAt Airdopes Pro Max 500',
        maxBudgetPerCreator: campaignRow?.max_budget_per_creator || 50000,
        mandatoryPhrases: campaignRow?.mandatory_phrases || 'Use code SAVER20 for 20% off',
        promoCode: campaignRow?.promo_code || 'SAVER20',
        guidelines: campaignRow?.guidelines
      };

      const dealObj = {
        id: dealRow.id,
        creatorName: dealRow.creator_name,
        creatorEmail: dealRow.creator_email || senderEmail,
        offeredPrice: dealRow.offered_price,
        currentAgreedPrice: dealRow.current_agreed_price,
        status: dealRow.status,
        emailThread
      };

      const org = await getDbRow('SELECT * FROM organizations WHERE id = ?', [dealRow.organization_id]) || await getDbRow('SELECT * FROM organizations LIMIT 1');

      let aiReply = null;
      let newStatus = dealRow.status;
      let newAgreedPrice = dealRow.current_agreed_price;

      if (autoReply) {
        const negotiationResult = await processRealAiNegotiation({
          campaign,
          deal: dealObj,
          creatorMessage: cleanBody,
          organization: org
        });

        aiReply = negotiationResult.replyMessage;
        newStatus = negotiationResult.newStatus;
        newAgreedPrice = negotiationResult.newAgreedPrice;

        emailThread.push(aiReply);

        // Dispatch outbound AI reply with IBM Carbon Design System card template!
        await sendCreatorEmail({
          toEmail: dealObj.creatorEmail,
          creatorName: dealObj.creatorName,
          subject: `Re: ${subjectHeader || `Collaboration for ${campaign.productName}`}`,
          body: aiReply.body,
          organizationId: org?.id,
          brandName: campaign.brandName,
          productName: campaign.productName,
          offeredPrice: newAgreedPrice,
          mandatoryPhrase: campaign.mandatoryPhrases,
          promoCode: campaign.promoCode
        });
      }

      // Update SQLite DB
      await runDb(
        'UPDATE deals SET status = ?, current_agreed_price = ?, email_thread_json = ? WHERE id = ?',
        [newStatus, newAgreedPrice, JSON.stringify(emailThread), dealRow.id]
      );

      // Record message as processed
      await runDb(
        'INSERT OR IGNORE INTO synced_gmail_messages (message_id, sender_email, deal_id, snippet) VALUES (?, ?, ?, ?)',
        [msgSummary.id, senderEmail, dealRow.id, cleanBody.substring(0, 100)]
      );

      processedCount++;
      processedReplies.push({
        dealId: dealRow.id,
        creatorName: dealRow.creator_name,
        senderEmail,
        messageSnippet: cleanBody.substring(0, 80),
        newStatus,
        newAgreedPrice,
        aiReply: aiReply?.body
      });
    }

    return {
      success: true,
      newReplies: processedCount,
      replies: processedReplies
    };
  } catch (err) {
    console.error('[Inbox Sync Error]:', err);
    return { success: false, error: err.message, newReplies: 0 };
  }
}
