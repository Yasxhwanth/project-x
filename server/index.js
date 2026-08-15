import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

import { queryDb, getDbRow, runDb } from './database/sqliteDb.js';
import { CreatorScraperSDK } from './sdk/creatorScraperSdk.js';
import { processCreatorEmailResponse } from './services/aiNegotiatorService.js';
import { analyzeVideoWithVideoDB } from './services/videoDbService.js';
import { startBackgroundCronSchedule, runAutomatedScraperJob, getAutoScraperStatus } from './jobs/automatedScraperJob.js';
import { generateCampaignStrategy } from './services/aiCampaignStrategyService.js';
import { getCampaignAnalyticsSummary } from './services/analyticsService.js';
import { loginUser, registerUserAndOrganization, getCurrentUserSession, getOrganizationMembers, sendLoginOtp, verifyLoginOtp, loginWithGoogle } from './services/authService.js';
import { processRealAiNegotiation } from './services/realAiNegotiator.js';
import { searchCreatorsWithNaturalLanguage } from './services/aiCreatorSearch.js';
import { sendCreatorEmail, pollCreatorInbox } from './services/gmailEmailService.js';
import { getCreatorMemoryProfile, recordCreatorMemory } from './services/creatorMemoryService.js';
import { getTanoPricingMatrix, generateLlmsTxt, generateAgentCardJson } from './services/tanoServicesEngine.js';

// v3: Autonomous Architecture Imports
import { startOrchestrator } from './engine/orchestrator.js';
import { startDispatcher } from './engine/outboxDispatcher.js';
import { runEvaluationSuite } from './tests/agentEvaluationSuite.js';
import { transitionDealState } from './engine/campaignStateMachine.js';
import { executePayment, proposePayment } from './agents/paymentAgent.js';
import { analyzeContent } from './agents/contentQaAgent.js';
import { evaluateCounterOffer } from './agents/negotiationAgent.js';
import { requireAuth, optionalAuth } from './middleware/authMiddleware.js';

// Attribution & Order Conversion Service
import { recordConversion, getCampaignAttribution, generateCreatorUtmLink } from './services/attributionService.js';

import { runAutonomousDirectorCycle } from './agents/directorAgent.js';
import { AGENT_TOOL_SCHEMAS, executeAgentTool } from './tools/agentToolsRegistry.js';
import { handleMcpRpcRequest } from './mcp/mcpServer.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Start Automated Background Scraper Job (Every 30 mins)
startBackgroundCronSchedule(30);

// Start Autonomous Campaign Director Agent (Every 5 mins)
setInterval(() => {
  runAutonomousDirectorCycle().catch(err => console.error('[Director Agent Cron Error]:', err));
}, 5 * 60 * 1000);

// v3: Start Event Bus Dispatcher and Agent Orchestrator
try {
  startDispatcher();
  startOrchestrator();
} catch (err) {
  console.error('[Server] Failed to start v3 engine components:', err.message);
}


// Instantiate CreatorScraperSDK
const scraperSdk = new CreatorScraperSDK({
  rapidApiKey: process.env.RAPIDAPI_KEY,
  youtubeApiKey: process.env.YOUTUBE_API_KEY
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// --- API Endpoints utilizing CreatorScraperSDK ---

// 0. User Authentication & Organization Endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const session = await loginUser(req.body);
    res.json(session);
  } catch (err) {
    res.status(401).json({ error: err.message || "Login failed" });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const session = await registerUserAndOrganization(req.body);
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message || "Registration failed" });
  }
});

app.get(['/api/auth/session', '/api/auth/me'], optionalAuth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.json({ user: null, organization: null });
    }
    const session = await getCurrentUserSession(req.user.id);
    res.json(session || { user: null, organization: null });
  } catch (err) {
    res.status(500).json({ error: "Failed to load session" });
  }
});

// 6-Digit Email / Mobile OTP Routes
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const result = await sendLoginOtp(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to send OTP" });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const session = await verifyLoginOtp(req.body);
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message || "Invalid OTP verification" });
  }
});

// Google OAuth / One-Tap Route
app.post('/api/auth/google', async (req, res) => {
  try {
    const session = await loginWithGoogle(req.body);
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message || "Google authentication failed" });
  }
});

app.get('/api/organizations/members', async (req, res) => {
  try {
    const members = await getOrganizationMembers(req.query.organizationId || 'org_boat_01');
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: "Failed to load team members" });
  }
});

// AI Agent Discovery Endpoints (Tano-style llms.txt & Agent Card)
app.get('/llms.txt', (req, res) => {
  res.type('text/plain').send(generateLlmsTxt());
});

app.get('/llms-full.txt', (req, res) => {
  res.type('text/plain').send(generateLlmsTxt());
});

app.get('/.well-known/agent-card.json', (req, res) => {
  res.json(generateAgentCardJson());
});

app.get('/api/tano/pricing-matrix', (req, res) => {
  const serviceType = req.query.service || 'cpa';
  res.json(getTanoPricingMatrix(serviceType));
});

// Organization Email & AI Settings API
app.get('/api/organization/email-settings', async (req, res) => {

  try {
    const org = await getDbRow("SELECT * FROM organizations LIMIT 1");
    res.json({
      senderName: org?.sender_name || 'boAt Marketing AI',
      senderEmail: org?.sender_email || 'collabs@boat-lifestyle.com',
      geminiConfigured: Boolean(org?.gmail_api_key),
      smtpHost: org?.smtp_host || 'smtp.gmail.com',
      smtpPort: org?.smtp_port || 587,
      smtpUser: org?.smtp_user || '',
      aiTone: org?.ai_tone || 'Hinglish Casual & Professional',
      autoReplyEnabled: org?.auto_reply_enabled === 1
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load email settings" });
  }
});

app.post('/api/organization/email-settings', async (req, res) => {
  try {
    const { senderName, senderEmail, geminiApiKey, smtpHost, smtpPort, smtpUser, smtpPass, aiTone, autoReplyEnabled } = req.body;
    await runDb(`
      UPDATE organizations
      SET sender_name = ?, sender_email = ?,
          gmail_api_key = CASE WHEN ? <> '' THEN ? ELSE gmail_api_key END,
          smtp_host = ?, smtp_port = ?, smtp_user = ?,
          smtp_pass = CASE WHEN ? <> '' THEN ? ELSE smtp_pass END,
          ai_tone = ?, auto_reply_enabled = ?
      WHERE slug = 'boat-lifestyle' OR id = 'org_boat_01'
    `, [
      senderName, senderEmail, 
      geminiApiKey || '', geminiApiKey || '', 
      smtpHost || 'smtp.gmail.com', smtpPort || 587, smtpUser || senderEmail, 
      smtpPass || '', smtpPass || '',
      aiTone, autoReplyEnabled ? 1 : 0
    ]);

    if (geminiApiKey) {
      process.env.GEMINI_API_KEY = geminiApiKey;
    }
    if (smtpPass) {
      process.env.GMAIL_APP_PASSWORD = smtpPass;
      process.env.GMAIL_USER = smtpUser || senderEmail;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save email settings", err);
    res.status(500).json({ error: "Failed to save email settings" });
  }
});

// Secrets are write-only: the browser receives connection state, never the API key itself.
const supportedIntegrationKeys = ['gemini', 'openai', 'videodb', 'rapidapi', 'youtube'];
app.get('/api/organization/integrations', async (req, res) => {
  try {
    const organizationId = req.query.organizationId || 'org_boat_01';
    const rows = await queryDb(
      'SELECT integration_key, updated_at FROM organization_integrations WHERE organization_id = ?',
      [organizationId]
    );
    const connected = Object.fromEntries(rows.map(row => [row.integration_key, { connected: true, updatedAt: row.updated_at }]));
    res.json({ connected });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load integration status' });
  }
});

app.post('/api/organization/integrations', async (req, res) => {
  try {
    const organizationId = req.body.organizationId || 'org_boat_01';
    const keys = req.body.keys || {};
    for (const key of supportedIntegrationKeys) {
      const secret = typeof keys[key] === 'string' ? keys[key].trim() : '';
      if (!secret) continue;
      await runDb(`
        INSERT INTO organization_integrations (organization_id, integration_key, secret_value, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(organization_id, integration_key)
        DO UPDATE SET secret_value = excluded.secret_value, updated_at = CURRENT_TIMESTAMP
      `, [organizationId, key, secret]);
      const envKey = { gemini: 'GEMINI_API_KEY', openai: 'OPENAI_API_KEY', videodb: 'VIDEODB_API_KEY', rapidapi: 'RAPIDAPI_KEY', youtube: 'YOUTUBE_API_KEY' }[key];
      process.env[envKey] = secret;
      if (key === 'rapidapi') scraperSdk.rapidApiKey = secret;
      if (key === 'youtube') scraperSdk.youtubeApiKey = secret;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Integration settings error:', err);
    res.status(500).json({ error: 'Failed to save integration settings' });
  }
});

// Gmail OAuth 2.0 Authentication Routes
app.get('/api/integrations/gmail/connect', optionalAuth, (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === 'your_google_oauth_client_id_here') {
    return res.status(400).send('GOOGLE_CLIENT_ID is not configured in server/.env. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
  }

  const host = req.get('host');
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const redirectUri = `${protocol}://${host}/api/integrations/gmail/callback`;
  const orgId = req.query.orgId || req.user?.organizationId || 'org_boat_01';

  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email'
  ].join(' ');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${orgId}`;

  res.redirect(authUrl);
});

app.get('/api/integrations/gmail/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const host = req.get('host') || 'localhost:5001';
  const clientBaseUrl = process.env.CLIENT_URL || '';

  if (error || !code) {
    return res.redirect(`${clientBaseUrl}/?gmail_error=${encodeURIComponent(error || 'No authorization code returned')}`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const redirectUri = `${protocol}://${host}/api/integrations/gmail/callback`;
    const orgId = state || 'org_boat_01';

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const { access_token, refresh_token } = tokenData;

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const userData = await userRes.json();
    const connectedEmail = userData.email;

    await runDb(`
      UPDATE organizations SET sender_email = ?, google_refresh_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [connectedEmail, refresh_token || '', orgId]).catch(() => {});

    await runDb(`
      INSERT INTO organization_integrations (organization_id, integration_key, secret_value, updated_at)
      VALUES (?, 'gmail_oauth', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(organization_id, integration_key)
      DO UPDATE SET secret_value = excluded.secret_value, updated_at = CURRENT_TIMESTAMP
    `, [orgId, JSON.stringify({ email: connectedEmail, refreshToken: refresh_token, accessToken: access_token })]);

    res.redirect(`${clientBaseUrl}/?gmail_status=connected&email=${encodeURIComponent(connectedEmail)}`);
  } catch (err) {
    console.error('[Gmail OAuth Callback Error]:', err);
    res.redirect(`${clientBaseUrl}/?gmail_error=${encodeURIComponent(err.message)}`);
  }
});

app.get('/api/integrations/gmail/status', optionalAuth, async (req, res) => {
  try {
    const orgId = req.user?.organizationId || 'org_boat_01';
    const org = await getDbRow('SELECT sender_email, google_refresh_token FROM organizations WHERE id = ?', [orgId]);
    const integration = await getDbRow('SELECT secret_value, updated_at FROM organization_integrations WHERE organization_id = ? AND integration_key = ?', [orgId, 'gmail_oauth']);

    let parsed = null;
    if (integration?.secret_value) {
      try { parsed = JSON.parse(integration.secret_value); } catch (e) {}
    }

    const isConnected = Boolean(org?.google_refresh_token || parsed?.refreshToken || process.env.GOOGLE_REFRESH_TOKEN);
    const email = parsed?.email || process.env.GMAIL_USER || (org?.sender_email && !org.sender_email.includes('boat-lifestyle.com') ? org.sender_email : null) || 'Not configured';

    res.json({
      connected: isConnected,
      email,
      updatedAt: integration?.updated_at || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/integrations/gmail/disconnect', optionalAuth, async (req, res) => {
  try {
    const orgId = req.user?.organizationId || 'org_boat_01';
    await runDb('UPDATE organizations SET google_refresh_token = NULL WHERE id = ?', [orgId]);
    await runDb('DELETE FROM organization_integrations WHERE organization_id = ? AND integration_key = ?', [orgId, 'gmail_oauth']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1c. Multi-Campaign Portfolio API Endpoints
app.get('/api/campaigns', optionalAuth, async (req, res) => {
  try {
    const orgId = req.user?.organizationId || 'org_boat_01';
    let campaigns = await queryDb('SELECT * FROM campaigns WHERE organization_id = ? OR organization_id IS NULL ORDER BY created_at DESC', [orgId]);
    if (!campaigns || campaigns.length === 0) {
      campaigns = [
        {
          id: 'camp_01',
          brand_name: 'boAt Lifestyle',
          product_name: 'boAt Airdopes Pro Max 500',
          max_budget_per_creator: 50000,
          target_reach_min: 100000,
          mandatory_phrases: 'Use code SAVER20 for 20% off',
          promo_code: 'SAVER20',
          status: 'ACTIVE'
        },
        {
          id: 'camp_02',
          brand_name: 'Mamaearth',
          product_name: 'Onion Hair Oil Natural Growth',
          max_budget_per_creator: 35000,
          target_reach_min: 75000,
          mandatory_phrases: 'Toxins-free natural hair care with code MAMAGROW15',
          promo_code: 'MAMAGROW15',
          status: 'ACTIVE'
        },
        {
          id: 'camp_03',
          brand_name: 'Cult.fit',
          product_name: 'Cultpass Elite Annual Pass',
          max_budget_per_creator: 75000,
          target_reach_min: 200000,
          mandatory_phrases: 'Transform your fitness with code CULTVIP25',
          promo_code: 'CULTVIP25',
          status: 'ACTIVE'
        }
      ];
    }

    const enriched = await Promise.all(campaigns.map(async (c) => {
      const dealRow = await getDbRow(
        'SELECT COUNT(*) as dealCount, SUM(current_agreed_price) as totalSpent FROM deals WHERE campaign_id = ?',
        [c.id]
      );
      return {
        id: c.id,
        brandName: c.brand_name || c.brandName,
        productName: c.product_name || c.productName,
        maxBudgetPerCreator: c.max_budget_per_creator || c.maxBudgetPerCreator || 50000,
        targetReachMin: c.target_reach_min || c.targetReachMin || 100000,
        mandatoryPhrases: c.mandatory_phrases || c.mandatoryPhrases || '',
        promoCode: c.promo_code || c.promoCode || 'PROMO10',
        status: c.status || 'ACTIVE',
        dealCount: dealRow?.dealCount || 1,
        totalSpent: dealRow?.totalSpent || (c.max_budget_per_creator || 50000) * 0.4
      };
    }));

    res.json({ success: true, campaigns: enriched });
  } catch (err) {
    console.error('[Get Campaigns Error]:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns: ' + err.message });
  }
});

app.post('/api/campaigns', optionalAuth, async (req, res) => {
  try {
    const { brandName, productName, maxBudgetPerCreator, targetReachMin, mandatoryPhrases, promoCode, guidelines } = req.body;
    if (!brandName || !productName) {
      return res.status(400).json({ error: 'brandName and productName are required' });
    }

    const orgId = req.user?.organizationId || 'org_boat_01';
    const campaignId = 'camp_' + uuidv4().substring(0, 8);

    await runDb(`
      INSERT INTO campaigns (id, brand_name, product_name, max_budget_per_creator, target_reach_min, mandatory_phrases, promo_code, guidelines, organization_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `, [
      campaignId,
      brandName,
      productName,
      maxBudgetPerCreator ? parseInt(maxBudgetPerCreator, 10) : 50000,
      targetReachMin ? parseInt(targetReachMin, 10) : 100000,
      mandatoryPhrases || `Use code ${promoCode || 'SAVE10'} for discount`,
      promoCode || 'SAVE10',
      guidelines || '',
      orgId
    ]);

    const newCampaign = {
      id: campaignId,
      brandName,
      productName,
      maxBudgetPerCreator: maxBudgetPerCreator ? parseInt(maxBudgetPerCreator, 10) : 50000,
      targetReachMin: targetReachMin ? parseInt(targetReachMin, 10) : 100000,
      mandatoryPhrases: mandatoryPhrases || `Use code ${promoCode || 'SAVE10'} for discount`,
      promoCode: promoCode || 'SAVE10',
      status: 'ACTIVE',
      dealCount: 0,
      totalSpent: 0
    };

    res.json({ success: true, campaign: newCampaign });
  } catch (err) {
    console.error('[Create Campaign Error]:', err);
    res.status(500).json({ error: 'Failed to create campaign: ' + err.message });
  }
});

// 1b. Real AI Email Negotiation Endpoint (Google Gemini Powered)
app.post('/api/deals/:id/negotiate', optionalAuth, async (req, res) => {
  try {
    const { creatorMessage, manualPriceOverride } = req.body;
    const dealId = req.params.id;

    let deal = await getDbRow('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (!deal) {
      deal = {
        id: dealId,
        campaign_id: 'camp_01',
        creator_name: 'Fit Tuber Hindi',
        creator_email: 'contact@fittuberhindi.in',
        offered_price: 12000,
        current_agreed_price: 12000,
        status: 'NEGOTIATING'
      };
    }

    let campaign = await getDbRow('SELECT * FROM campaigns WHERE id = ?', [deal.campaign_id || 'camp_01']);
    if (!campaign) {
      campaign = {
        id: 'camp_01',
        brand_name: 'boAt Lifestyle',
        product_name: 'boAt Airdopes Pro Max 500',
        max_budget_per_creator: 50000,
        mandatory_phrases: 'Use code SAVER20 for 20% off'
      };
    }

    const aiResult = await processRealAiNegotiation({
      campaign: {
        brandName: campaign.brand_name || campaign.brandName || 'boAt Lifestyle',
        productName: campaign.product_name || campaign.productName || 'boAt Airdopes Pro Max 500',
        maxBudgetPerCreator: campaign.max_budget_per_creator || campaign.maxBudgetPerCreator || 50000,
        mandatoryPhrases: campaign.mandatory_phrases || campaign.mandatoryPhrases || 'Use code SAVER20 for 20% off'
      },
      deal: {
        id: deal.id,
        creatorName: deal.creator_name || deal.creatorName || 'Fit Tuber Hindi',
        currentAgreedPrice: manualPriceOverride || deal.current_agreed_price || deal.currentAgreedPrice || 12000,
        offeredPrice: deal.offered_price || deal.offeredPrice || 12000,
        status: deal.status
      },
      creatorMessage,
      organization: req.user?.organizationId ? { id: req.user.organizationId } : { id: 'org_boat_01' }
    });

    const updatedDeal = {
      ...deal,
      id: deal.id,
      creatorName: deal.creator_name || deal.creatorName || 'Fit Tuber Hindi',
      creatorEmail: deal.creator_email || deal.creatorEmail || 'contact@fittuberhindi.in',
      currentAgreedPrice: manualPriceOverride || aiResult.newAgreedPrice || deal.current_agreed_price || 12000,
      status: aiResult.newStatus || 'NEGOTIATING',
      emailThread: [
        ...(deal.emailThread || [
          {
            id: 'msg_1',
            sender: 'BRAND_AI',
            senderName: 'boAt Marketing AI',
            recipientName: deal.creator_name || 'Fit Tuber Hindi',
            body: 'Namaste, We would love to collaborate for boAt Airdopes Pro Max 500. Offered Fee: ₹12,000.',
            timestamp: '10:15 AM'
          }
        ]),
        {
          id: 'msg_user_' + Date.now(),
          sender: 'CREATOR',
          senderName: deal.creator_name || 'Fit Tuber Hindi',
          recipientName: 'boAt Marketing AI',
          body: creatorMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        aiResult.replyMessage
      ]
    };

    await runDb(
      `UPDATE deals SET current_agreed_price = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [updatedDeal.currentAgreedPrice, updatedDeal.status, deal.id]
    ).catch(() => {});

    try {
      await transitionDealState(deal.id, 'CREATOR_RESPONDED', {
        creatorMessage,
        aiReply: aiResult.replyMessage?.body,
        newStatus: aiResult.newStatus,
        agreedPrice: updatedDeal.currentAgreedPrice
      });
    } catch (e) {
      console.log('[State Machine Notice]:', e.message);
    }

    res.json({ success: true, deal: updatedDeal, aiResult });
  } catch (err) {
    console.error('[Negotiation Endpoint Error]:', err);
    res.status(500).json({ error: 'Failed to process AI negotiation: ' + err.message });
  }
});

// 1a. Automated Scraper Status & Trigger Endpoints
app.get('/api/creators/auto-scraper-status', (req, res) => {

  res.json(getAutoScraperStatus());
});

app.post('/api/creators/trigger-auto-scraper', async (req, res) => {
  try {
    const result = await runAutomatedScraperJob();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Automated scraper job failed" });
  }
});

// 1b. GET /api/creators - Search & Scrape Creators via SDK
app.get('/api/creators', async (req, res) => {
  const { reachMin, reachMax, budgetMin, budgetMax, niche, platform, query } = req.query;
  try {
    const creators = await scraperSdk.searchCreators({ query, platform, reachMax, budgetMax, niche });
    res.json({ total: creators.length, creators });
  } catch (err) {
    console.error("SDK search error:", err);
    res.status(500).json({ error: "Failed to fetch creators via SDK" });
  }
});

// Fast FTS5 Creator Search Endpoint
app.get('/api/creators/search', async (req, res) => {
  try {
    const { 
      fts_query, niche, platform, 
      minFollowers, maxFollowers, 
      minAuthenticity, sortBy, sortOrder,
      limit: reqLimit, page: reqPage
    } = req.query;

    const limit = Math.min(Math.max(parseInt(reqLimit, 10) || 100, 10), 1000);
    const page = Math.max(parseInt(reqPage, 10) || 1, 1);
    const offset = (page - 1) * limit;

    let baseSql = `FROM creators c`;
    const params = [];
    const conditions = [];

    if (fts_query && fts_query.trim()) {
      const cleanTerm = fts_query.trim();
      const sanitized = cleanTerm.replace(/[^a-zA-Z0-9_\-@\.\s]/g, '');
      if (sanitized) {
        conditions.push(`(
          c.name LIKE ? OR 
          c.handle LIKE ? OR 
          c.bio LIKE ? OR 
          c.niche LIKE ? OR 
          c.email LIKE ? OR
          c.location LIKE ?
        )`);
        const likeStr = `%${sanitized}%`;
        params.push(likeStr, likeStr, likeStr, likeStr, likeStr, likeStr);
      }
    }

    if (niche && niche !== 'All') {
      conditions.push(`c.niche = ?`);
      params.push(niche);
    }
    if (platform && platform !== 'All') {
      conditions.push(`c.platform = ?`);
      params.push(platform);
    }
    if (minFollowers) {
      conditions.push(`c.followers_raw >= ?`);
      params.push(parseInt(minFollowers, 10));
    }
    if (maxFollowers) {
      conditions.push(`c.followers_raw <= ?`);
      params.push(parseInt(maxFollowers, 10));
    }
    if (minAuthenticity) {
      conditions.push(`c.authenticity_score >= ?`);
      params.push(parseInt(minAuthenticity, 10));
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total ${baseSql}${whereClause}`;

    const orderMap = {
      'followers': 'c.followers_raw',
      'rating': 'c.rating',
      'authenticity': 'c.authenticity_score',
      'price': 'c.price_per_post'
    };
    const orderCol = orderMap[sortBy] || 'c.followers_raw';
    const orderDir = (sortOrder === 'asc' || sortOrder === 'ASC') ? 'ASC' : 'DESC';

    const dataSql = `SELECT c.* ${baseSql}${whereClause} ORDER BY ${orderCol} ${orderDir} LIMIT ? OFFSET ?`;

    const start = Date.now();
    const [countRow] = await queryDb(countSql, params);
    const total = countRow?.total || 0;

    const dataParams = [...params, limit, offset];
    const rows = await queryDb(dataSql, dataParams);
    const latencyMs = Date.now() - start;

    res.json({ 
      total, 
      page, 
      limit, 
      totalPages: Math.ceil(total / limit),
      creators: rows, 
      latencyMs 
    });
  } catch (err) {
    console.error("FTS Search Error:", err);
    res.status(500).json({ error: "Failed to search creators" });
  }
});

// 1c. Natural-Language AI Creator Search Endpoint (Google Gemini Powered)
app.post('/api/creators/ai-search', optionalAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required for Natural-Language AI Creator Search' });
    }

    const orgId = req.user?.organizationId || 'org_boat_01';
    const result = await searchCreatorsWithNaturalLanguage({ prompt, organizationId: orgId });
    res.json(result);
  } catch (err) {
    console.error('[AI Creator Search Endpoint Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 1b. POST /api/creators/scrape-instagram - Scrape Instagram Profile via SDK
app.post('/api/creators/scrape-instagram', async (req, res) => {
  const { handle } = req.body;
  if (!handle) return res.status(400).json({ error: "Instagram handle is required" });

  try {
    const creator = await scraperSdk.scrapeInstagramProfile(handle);
    res.json({ success: true, creator });
  } catch (err) {
    console.error("SDK Instagram scrape error:", err);
    res.status(500).json({ error: "Failed to scrape Instagram profile" });
  }
});

// Creator Episodic Memory & Intelligence API
app.get('/api/creators/:id/memory', async (req, res) => {
  try {
    const memoryProfile = await getCreatorMemoryProfile(req.params.id);
    res.json(memoryProfile);
  } catch (err) {
    console.error("Fetch creator memory error:", err);
    res.status(500).json({ error: "Failed to fetch creator memory: " + err.message });
  }
});

app.post('/api/creators/:id/memory', async (req, res) => {
  try {
    const result = await recordCreatorMemory({
      creatorId: req.params.id,
      ...req.body
    });
    res.json(result);
  } catch (err) {
    console.error("Save creator memory error:", err);
    res.status(500).json({ error: "Failed to record creator memory: " + err.message });
  }
});

// 2. Campaigns & Strategy API
app.post('/api/campaigns/generate-strategy', async (req, res) => {
  try {
    const strategy = await generateCampaignStrategy(req.body);
    res.json(strategy);
  } catch (err) {
    console.error("Strategy generation error:", err);
    res.status(500).json({ error: "Failed to generate campaign strategy" });
  }
});

app.get('/api/analytics/summary', async (req, res) => {
  try {
    const summary = await getCampaignAnalyticsSummary();
    res.json(summary);
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics summary" });
  }
});

app.get('/api/campaigns', async (req, res) => {

  try {
    const rows = await queryDb("SELECT * FROM campaigns ORDER BY created_at DESC");
    const campaigns = rows.map(r => ({
      id: r.id,
      brandName: r.brand_name,
      productName: r.product_name,
      maxBudgetPerCreator: r.max_budget_per_creator,
      targetReachMin: r.target_reach_min,
      mandatoryPhrases: r.mandatory_phrases,
      promoCode: r.promo_code,
      guidelines: r.guidelines,
      status: r.status,
      createdAt: r.created_at
    }));
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

// Agency command centre: a compact, client-level view across active campaigns.
// This deliberately uses completed workflow data rather than estimated creator metrics.
app.get('/api/agency/portfolio', async (req, res) => {
  try {
    const clients = await queryDb(`
      SELECT
        c.id AS campaign_id,
        c.brand_name AS client_name,
        c.product_name AS campaign_name,
        c.status AS campaign_status,
        c.created_at,
        COUNT(d.id) AS creator_count,
        SUM(CASE WHEN d.status IN ('INVITED', 'NEGOTIATING', 'AGREED', 'VIDEO_SUBMITTED', 'VIDEO_ANALYSIS_PENDING') THEN 1 ELSE 0 END) AS active_deals,
        SUM(CASE WHEN d.status IN ('QA_PASSED', 'PAYMENT_APPROVED', 'PAID') THEN 1 ELSE 0 END) AS approved_deliverables,
        SUM(CASE WHEN d.status = 'PAID' THEN 1 ELSE 0 END) AS paid_creators,
        COALESCE(SUM(d.current_agreed_price), 0) AS creator_spend
      FROM campaigns c
      LEFT JOIN deals d ON d.campaign_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    const closeoutQueue = await queryDb(`
      SELECT d.id, d.creator_name, d.status, d.current_agreed_price, c.brand_name, c.product_name
      FROM deals d
      JOIN campaigns c ON c.id = d.campaign_id
      WHERE d.status IN ('QA_PASSED', 'PAYMENT_APPROVED', 'PAID')
      ORDER BY d.created_at DESC
      LIMIT 8
    `);

    res.json({ clients, closeoutQueue });
  } catch (err) {
    console.error('Agency portfolio error:', err);
    res.status(500).json({ error: 'Failed to load agency portfolio' });
  }
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const id = "camp_" + uuidv4().substring(0, 8);
    const { brandName, productName, maxBudgetPerCreator, mandatoryPhrases, promoCode, guidelines } = req.body;

    await runDb(`
      INSERT INTO campaigns (id, brand_name, product_name, max_budget_per_creator, mandatory_phrases, promo_code, guidelines)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, brandName, productName, maxBudgetPerCreator, mandatoryPhrases, promoCode, guidelines]);

    const newCamp = await getDbRow("SELECT * FROM campaigns WHERE id = ?", [id]);
    res.status(201).json(newCamp);
  } catch (err) {
    res.status(500).json({ error: "Failed to save campaign" });
  }
});

app.get('/api/campaigns', async (req, res) => {
  try {
    const rows = await queryDb("SELECT * FROM campaigns ORDER BY created_at DESC");
    const campaigns = rows.map(r => ({
      id: r.id,
      brandName: r.brand_name,
      productName: r.product_name,
      maxBudgetPerCreator: r.max_budget_per_creator,
      mandatoryPhrases: r.mandatory_phrases,
      promoCode: r.promo_code,
      guidelines: r.guidelines,
      createdAt: r.created_at
    }));
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const r = await getDbRow("SELECT * FROM campaigns WHERE id = ?", [req.params.id]);
    if (!r) return res.status(404).json({ error: "Campaign not found" });
    const camp = {
      id: r.id,
      brandName: r.brand_name,
      productName: r.product_name,
      maxBudgetPerCreator: r.max_budget_per_creator,
      mandatoryPhrases: r.mandatory_phrases,
      promoCode: r.promo_code,
      guidelines: r.guidelines,
      createdAt: r.created_at
    };
    res.json(camp);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch campaign" });
  }
});

// 3. Deals API & Outreach
app.get('/api/deals', async (req, res) => {
  try {
    const { campaignId } = req.query;
    let rows;
    if (campaignId) {
      rows = await queryDb("SELECT * FROM deals WHERE campaign_id = ? ORDER BY created_at DESC", [campaignId]);
    } else {
      rows = await queryDb("SELECT * FROM deals ORDER BY created_at DESC");
    }
    const deals = rows.map(r => ({
      id: r.id,
      campaignId: r.campaign_id,
      creatorId: r.creator_id,
      creatorName: r.creator_name,
      creatorEmail: r.creator_email,
      creatorAvatar: r.creator_avatar,
      platform: r.platform,
      offeredPrice: r.offered_price,
      currentAgreedPrice: r.current_agreed_price,
      status: r.status,
      videoUrl: r.video_url,
      emailThread: r.email_thread_json ? JSON.parse(r.email_thread_json) : [],
      videoAnalysis: r.video_analysis_json ? JSON.parse(r.video_analysis_json) : null,
      payout: r.payout_json ? JSON.parse(r.payout_json) : null,
      createdAt: r.created_at
    }));
    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch deals" });
  }
});

app.post(['/api/deals/outreach', '/api/deals'], async (req, res) => {
  const { creatorId, campaignId, offeredPrice, creatorName, creatorEmail, creatorAvatar, platform } = req.body;

  try {
    let creator = await getDbRow("SELECT * FROM creators WHERE id = ?", [creatorId]);
    if (!creator && creatorEmail) {
      creator = await getDbRow("SELECT * FROM creators WHERE email = ?", [creatorEmail]);
    }

    const targetEmail = (creatorEmail || '').trim() || creator?.email || 'collabs@project-x.in';
    const targetName = (creatorName || '').trim() || creator?.name || 'Creator';
    const targetPlatform = platform || creator?.platform || 'Instagram';
    const targetAvatar = creatorAvatar || creator?.avatar || '';

    // Permanently persist/update email in creators table if creator exists
    if (creator?.id && creatorEmail && creatorEmail.trim()) {
      await runDb('UPDATE creators SET email = ? WHERE id = ?', [targetEmail, creator.id]).catch(() => {});
      creator.email = targetEmail;
    }

    if (!creator) {
      creator = {
        id: creatorId || "creator_" + Date.now(),
        name: targetName,
        email: targetEmail,
        avatar: targetAvatar,
        platform: targetPlatform,
        price_per_post: offeredPrice || 25000
      };
      // Insert new creator into database
      await runDb(`
        INSERT OR IGNORE INTO creators (id, name, email, avatar, platform, price_per_post, followers_raw, reach_text, avg_views, engagement_rate, rating, location, authenticity_score)
        VALUES (?, ?, ?, ?, ?, ?, 250000, '250K', '80K', 4.5, 4.8, 'India', 92)
      `, [creator.id, targetName, targetEmail, targetAvatar, targetPlatform, offeredPrice || 25000]).catch(() => {});
    }

    const campaign = await getDbRow("SELECT * FROM campaigns WHERE id = ?", [campaignId]) || await getDbRow("SELECT * FROM campaigns LIMIT 1");

    const initialPrice = offeredPrice || creator.price_per_post;
    const dealId = "deal_" + uuidv4().substring(0, 8);

    const initialEmail = {
      id: "msg_out_" + Date.now(),
      sender: "BRAND_AI",
      senderName: `${campaign.brand_name} Marketing AI`,
      recipientName: targetName,
      body: `Namaste ${targetName},\n\nWe love your content on ${targetPlatform}! We'd like to invite you to collaborate on our upcoming campaign for ${campaign.product_name}.\n\n- Proposed Fee: ₹${initialPrice.toLocaleString('en-IN')}\n- Required Spoken Phrase: "${campaign.mandatory_phrases}"\n- Guidelines: ${campaign.guidelines || "Feature product clearly in your video."}\n\nPlease reply directly to let us know if you'd like to partner with us!\n\nBest regards,\n${campaign.brand_name} Marketing AI`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intent: "INITIAL_OUTREACH"
    };

    await runDb(`
      INSERT INTO deals (
        id, campaign_id, creator_id, creator_name, creator_email, creator_avatar,
        platform, offered_price, current_agreed_price, status, video_url, email_thread_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dealId, campaign.id, creator.id, targetName, targetEmail, targetAvatar,
      targetPlatform, initialPrice, initialPrice, 'INVITED', '', JSON.stringify([initialEmail])
    ]);

    // Dispatch real email via Gmail / Nodemailer engine (non-blocking background dispatch)
    sendCreatorEmail({
      toEmail: targetEmail,
      creatorName: targetName,
      subject: `Collaboration Proposal: ${campaign.brand_name} x ${campaign.product_name}`,
      body: initialEmail.body,
      organizationId: campaign.organization_id || 'org_boat_01'
    }).then(result => {
      console.log(`✉️  [Outreach API] Email dispatched to ${targetEmail}:`, result.messageId || 'SENT');
    }).catch(emailErr => {
      console.error('[Outreach API] Background email send error:', emailErr.message);
    });

    const newDeal = {
      id: dealId,
      campaignId: campaign.id,
      creatorId: creator.id,
      creatorName: targetName,
      creatorEmail: targetEmail,
      creatorAvatar: targetAvatar,
      platform: targetPlatform,
      offeredPrice: initialPrice,
      currentAgreedPrice: initialPrice,
      status: "INVITED",
      videoUrl: "",
      emailThread: [initialEmail],
      videoAnalysis: null,
      payout: null
    };

    res.status(201).json(newDeal);
  } catch (err) {
    console.error("Outreach error", err);
    res.status(500).json({ error: "Failed to launch outreach" });
  }
});

// Update Deal recipient email or commercial terms
app.patch('/api/deals/:id', async (req, res) => {
  try {
    const { creatorEmail, creatorName, currentAgreedPrice, status } = req.body;
    const dealId = req.params.id;

    const existingDeal = await getDbRow('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (!existingDeal) return res.status(404).json({ error: 'Deal not found' });

    const newEmail = (creatorEmail || '').trim() || existingDeal.creator_email;
    const newName = (creatorName || '').trim() || existingDeal.creator_name;
    const newPrice = currentAgreedPrice || existingDeal.current_agreed_price;
    const newStatus = status || existingDeal.status;

    await runDb(`
      UPDATE deals 
      SET creator_email = ?, creator_name = ?, current_agreed_price = ?, status = ?
      WHERE id = ?
    `, [newEmail, newName, newPrice, newStatus, dealId]);

    // Also update creator record if creator_id exists
    if (existingDeal.creator_id && newEmail) {
      await runDb('UPDATE creators SET email = ? WHERE id = ?', [newEmail, existingDeal.creator_id]).catch(() => {});
    }

    const updated = await getDbRow('SELECT * FROM deals WHERE id = ?', [dealId]);
    res.json({ success: true, deal: updated });
  } catch (err) {
    console.error('[Update Deal Error]:', err);
    res.status(500).json({ error: 'Failed to update deal: ' + err.message });
  }
});

// Update Creator Profile & Email permanently
app.patch('/api/creators/:id', async (req, res) => {
  try {
    const { email, name, price_per_post, phone, bio } = req.body;
    const creatorId = req.params.id;

    if (email) {
      await runDb('UPDATE creators SET email = ? WHERE id = ?', [email.trim(), creatorId]);
    }
    if (name) {
      await runDb('UPDATE creators SET name = ? WHERE id = ?', [name.trim(), creatorId]);
    }
    if (price_per_post) {
      await runDb('UPDATE creators SET price_per_post = ? WHERE id = ?', [price_per_post, creatorId]);
    }

    const updated = await getDbRow('SELECT * FROM creators WHERE id = ?', [creatorId]);
    res.json({ success: true, creator: updated });
  } catch (err) {
    console.error('[Update Creator Error]:', err);
    res.status(500).json({ error: 'Failed to update creator: ' + err.message });
  }
});

// 4. AI Back-and-Forth Email Negotiation Endpoint
app.post('/api/deals/:id/negotiate', async (req, res) => {
  try {
    const row = await getDbRow("SELECT * FROM deals WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: "Deal not found" });

    const deal = {
      id: row.id,
      campaignId: row.campaign_id,
      creatorId: row.creator_id,
      creatorName: row.creator_name,
      creatorEmail: row.creator_email,
      creatorAvatar: row.creator_avatar,
      platform: row.platform,
      offeredPrice: row.offered_price,
      currentAgreedPrice: row.current_agreed_price,
      status: row.status,
      videoUrl: row.video_url,
      emailThread: row.email_thread_json ? JSON.parse(row.email_thread_json) : [],
      videoAnalysis: row.video_analysis_json ? JSON.parse(row.video_analysis_json) : null,
      payout: row.payout_json ? JSON.parse(row.payout_json) : null
    };

    const campaignRow = await getDbRow("SELECT * FROM campaigns WHERE id = ?", [deal.campaignId]) || await getDbRow("SELECT * FROM campaigns LIMIT 1");
    const campaign = {
      brandName: campaignRow.brand_name,
      productName: campaignRow.product_name,
      maxBudgetPerCreator: campaignRow.max_budget_per_creator,
      mandatoryPhrases: campaignRow.mandatory_phrases,
      promoCode: campaignRow.promo_code,
      guidelines: campaignRow.guidelines
    };

    const { creatorMessage } = req.body;
    if (!creatorMessage) return res.status(400).json({ error: "creatorMessage is required" });

    const creatorMsgObj = {
      id: "msg_" + Date.now(),
      sender: "CREATOR",
      senderName: deal.creatorName,
      recipientName: `${campaign.brandName} AI Assistant`,
      body: creatorMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intent: "CREATOR_RESPONSE"
    };
    deal.emailThread.push(creatorMsgObj);

    // Real AI Negotiator Processing (Gemini API & OpenAI fallback)
    const org = await getDbRow("SELECT * FROM organizations WHERE id = ?", [deal.organizationId]) || await getDbRow("SELECT * FROM organizations LIMIT 1");
    
    const negotiationResult = await processRealAiNegotiation({ 
      campaign, 
      deal, 
      creatorMessage,
      organization: org
    });

    deal.emailThread.push(negotiationResult.replyMessage);
    deal.status = negotiationResult.newStatus;
    deal.currentAgreedPrice = negotiationResult.newAgreedPrice;

    // Dispatch email via Gmail/SMTP Email Integration Engine
    await sendCreatorEmail({
      toEmail: deal.creatorEmail,
      creatorName: deal.creatorName,
      subject: `Re: Collaboration for ${campaign.productName}`,
      body: negotiationResult.replyMessage.body,
      organizationId: org?.id
    });

    // Update SQLite DB
    await runDb(`
      UPDATE deals
      SET status = ?, current_agreed_price = ?, email_thread_json = ?
      WHERE id = ?
    `, [deal.status, deal.currentAgreedPrice, JSON.stringify(deal.emailThread), deal.id]);


    res.json({
      deal,
      aiReply: negotiationResult.replyMessage,
      dealStatus: deal.status,
      agreedPrice: deal.currentAgreedPrice
    });
  } catch (err) {
    console.error("Negotiation DB error", err);
    res.status(500).json({ error: "Failed to process negotiation" });
  }
});

// 5. VideoDB AI Compliance Verification & Auto-Payout (v3 Engine Bridged)
app.post('/api/deals/:id/verify-video', async (req, res) => {
  try {
    const row = await getDbRow("SELECT * FROM deals WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: "Deal not found" });

    const campaignRow = await getDbRow("SELECT * FROM campaigns WHERE id = ?", [row.campaign_id]) || await getDbRow("SELECT * FROM campaigns LIMIT 1");
    const campaign = {
      brandName: campaignRow?.brand_name,
      productName: campaignRow?.product_name,
      maxBudgetPerCreator: campaignRow?.max_budget_per_creator,
      mandatoryPhrases: campaignRow?.mandatory_phrases,
      promoCode: campaignRow?.promo_code,
      guidelines: campaignRow?.guidelines
    };

    const { videoUrl } = req.body;
    const targetVideoUrl = videoUrl || row.video_url || "https://youtube.com/watch?v=boat_airdopes_review";

    // Step 1: Transition state CONTENT_PENDING -> VIDEO_SUBMITTED -> VIDEO_ANALYSIS_PENDING
    try {
      await transitionDealState({
        dealId: row.id,
        triggerEvent: 'VIDEO_SUBMITTED_BY_CREATOR',
        actorAgent: 'Creator',
        targetStage: 'VIDEO_SUBMITTED',
        payload: { videoUrl: targetVideoUrl }
      });
      await transitionDealState({
        dealId: row.id,
        triggerEvent: 'QUEUED_FOR_VIDEODB_ANALYSIS',
        actorAgent: 'Content QA Agent',
        targetStage: 'VIDEO_ANALYSIS_PENDING',
        payload: { videoUrl: targetVideoUrl }
      });
    } catch (stErr) {
      console.warn('[verify-video] Topology notice:', stErr.message);
    }

    // Step 2: Run VideoDB analysis
    const analysis = await analyzeVideoWithVideoDB({
      videoUrl: targetVideoUrl,
      campaign,
      organizationId: row.organization_id,
      deal: {
        id: row.id,
        creatorEmail: row.creator_email,
        offeredPrice: row.offered_price,
        currentAgreedPrice: row.current_agreed_price
      }
    });

    // Step 3: Run Content QA agent evaluation
    const qaResult = await analyzeContent({
      dealId: row.id,
      campaignId: row.campaign_id,
      videoUrl: targetVideoUrl,
      complianceScore: analysis.complianceScore,
      hasPromoCode: analysis.auditChecklist?.find(c => c.criterion?.includes('Promo Code'))?.passed ?? true,
      hasSpokenPhrase: analysis.auditChecklist?.find(c => c.criterion?.includes('Spoken'))?.passed ?? true,
      hasVisualLogo: analysis.auditChecklist?.find(c => c.criterion?.includes('Visual'))?.passed ?? true,
      hasBrandSafetyViolation: false
    });

    // Step 4: Branch on QA outcome via State Machine & update deal status
    const targetStatus = qaResult.outcome === 'QA_PASSED' ? 'QA_PASSED' : 'QA_REVISION_REQUIRED';

    try {
      if (qaResult.outcome === 'QA_PASSED') {
        await transitionDealState({
          dealId: row.id,
          triggerEvent: 'VIDEODB_AUDIT_PASSED',
          actorAgent: 'Content QA Agent',
          targetStage: 'QA_PASSED',
          payload: { score: analysis.complianceScore, rationale: `VideoDB audit score ${analysis.complianceScore}%. All checks passed.` }
        });
      } else {
        await transitionDealState({
          dealId: row.id,
          triggerEvent: 'VIDEODB_AUDIT_FAILED',
          actorAgent: 'Content QA Agent',
          targetStage: 'QA_REVISION_REQUIRED',
          payload: { score: analysis.complianceScore, missing: qaResult.missing, rationale: `VideoDB audit score ${analysis.complianceScore}% below threshold.` }
        });
      }
    } catch (transErr) {
      console.log('[verify-video] State transition note:', transErr.message);
    }

    // Save analysis JSON & updated status to deal record
    await runDb(
      `UPDATE deals SET status = ?, video_url = ?, video_analysis_json = ? WHERE id = ?`,
      [targetStatus, targetVideoUrl, JSON.stringify(analysis), row.id]
    );

    const updatedDeal = await getDbRow("SELECT * FROM deals WHERE id = ?", [req.params.id]);
    res.json({ deal: updatedDeal, analysis, qaOutcome: qaResult.outcome });
  } catch (err) {
    console.error("Video verification error:", err);
    res.status(500).json({ error: "Failed to verify video: " + err.message });
  }
});

// 6. Manual Payout Execution (v3 Separation of Duties & Idempotency Enforced)
app.post('/api/deals/:id/payout', async (req, res) => {
  try {
    const row = await getDbRow("SELECT * FROM deals WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: "Deal not found" });

    // Enforce separation of duties: deal must be in PAYMENT_APPROVED state!
    if (row.status !== 'PAYMENT_APPROVED') {
      return res.status(400).json({
        error: "Separation of Duties Enforced",
        message: `Payment execution blocked: deal must be in PAYMENT_APPROVED state authorized by human. Current status: ${row.status}`,
        requiredStatus: 'PAYMENT_APPROVED'
      });
    }

    // Execute payment via paymentAgent (idempotency-guarded)
    const payoutResult = await executePayment({
      dealId: row.id,
      campaignId: row.campaign_id
    });

    // Transition state machine to PAID
    await transitionDealState({
      dealId: row.id,
      triggerEvent: 'PAYMENT_EXECUTED_BY_AGENT',
      actorAgent: 'Payment Agent',
      targetStage: 'PAID',
      bypassGuardrails: true,
      payload: { payoutRef: payoutResult.payoutRef, amount: payoutResult.amount }
    });

    // Store payout JSON
    await runDb(
      `UPDATE deals SET payout_json = ? WHERE id = ?`,
      [JSON.stringify(payoutResult), row.id]
    );

    const updatedRow = await getDbRow("SELECT * FROM deals WHERE id = ?", [req.params.id]);
    res.json({ success: true, deal: updatedRow, payout: payoutResult });
  } catch (err) {
    console.error("Payout execution error:", err);
    res.status(500).json({ error: "Failed to execute payout: " + err.message });
  }
});

// 7. State Machine Execution & Escalation Queue API
app.get('/api/agents/escalations', async (req, res) => {
  try {
    const rows = await queryDb("SELECT * FROM escalation_queue ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch escalation queue" });
  }
});

app.post('/api/agents/escalations/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { actorName } = req.body || {};
    const ticket = await getDbRow("SELECT * FROM escalation_queue WHERE id = ?", [id]);
    if (!ticket) return res.status(404).json({ error: "Escalation ticket not found" });

    // Mark ticket approved
    await runDb("UPDATE escalation_queue SET status = 'APPROVED' WHERE id = ?", [id]);

    const deal = await getDbRow("SELECT * FROM deals WHERE id = ?", [ticket.deal_id]);

    // Handle Payment Authorization Ticket vs Negotiation Ticket
    if (ticket.actor_agent === 'Payment Agent' || ticket.reason?.includes('Payment authorization')) {
      await transitionDealState({
        dealId: ticket.deal_id,
        triggerEvent: 'HUMAN_PAYMENT_AUTHORIZATION_GRANTED',
        actorAgent: actorName || 'Human Brand Admin',
        targetStage: 'PAYMENT_APPROVED',
        bypassGuardrails: true,
        payload: { humanApproved: true, rationale: `Human approved payment of Rs.${ticket.requested_rate?.toLocaleString('en-IN')}` }
      });
      res.json({ success: true, message: "Payment authorized. Deal is now PAYMENT_APPROVED and ready for payout.", type: 'payment' });
    } else {
      await transitionDealState({
        dealId: ticket.deal_id,
        triggerEvent: 'HUMAN_APPROVAL_GRANTED',
        actorAgent: actorName || 'Human Brand Admin',
        targetStage: 'AGREED',
        bypassGuardrails: true,
        payload: { agreedPrice: ticket.requested_rate, humanApproved: true, rationale: `Human approved rate of Rs.${ticket.requested_rate?.toLocaleString('en-IN')}` }
      });
      res.json({ success: true, message: "Approved. Rate locked and deal transitioned to AGREED.", type: 'negotiation' });
    }
  } catch (err) {
    console.error("Escalation approval error:", err);
    res.status(500).json({ error: "Failed to approve escalation: " + err.message });
  }
});

app.post('/api/agents/escalations/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, actorName } = req.body || {};
    const ticket = await getDbRow("SELECT * FROM escalation_queue WHERE id = ?", [id]);
    if (!ticket) return res.status(404).json({ error: "Escalation ticket not found" });

    await runDb("UPDATE escalation_queue SET status = 'REJECTED' WHERE id = ?", [id]);

    if (ticket.deal_id) {
      await transitionDealState({
        dealId: ticket.deal_id,
        triggerEvent: 'HUMAN_REJECTION',
        actorAgent: actorName || 'Human Brand Admin',
        targetStage: 'NEGOTIATION_FAILED',
        bypassGuardrails: true,
        payload: { humanRejected: true, rationale: reason || 'Human Admin rejected this request' }
      });
    }

    res.json({ success: true, message: "Rejected. Deal moved to NEGOTIATION_FAILED. Creator will not be contacted." });
  } catch (err) {
    console.error("Escalation rejection error:", err);
    res.status(500).json({ error: "Failed to reject escalation: " + err.message });
  }
});


app.get('/api/agents/audit-logs', async (req, res) => {
  try {
    const rows = await queryDb("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// ─── v3: Agent Runs ────────────────────────────────────────────────────────
app.get('/api/agents/runs', async (req, res) => {
  try {
    const { agent } = req.query;
    const sql = agent
      ? `SELECT * FROM agent_runs WHERE agent_name = ? ORDER BY created_at DESC LIMIT 50`
      : `SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT 50`;
    const rows = await queryDb(sql, agent ? [agent] : []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch agent runs' });
  }
});

// ─── v3: Outbox Events (observability) ────────────────────────────────────
app.get('/api/agents/outbox', async (req, res) => {
  try {
    const rows = await queryDb(`SELECT * FROM outbox_events ORDER BY created_at DESC LIMIT 30`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch outbox events' });
  }
});

// ─── v3: Dead Letter Queue ─────────────────────────────────────────────────
app.get('/api/agents/dead-letter', async (req, res) => {
  try {
    const rows = await queryDb(`SELECT * FROM dead_letter_queue ORDER BY created_at DESC LIMIT 30`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dead letter queue' });
  }
});

app.post('/api/agents/dead-letter/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await getDbRow(`SELECT * FROM dead_letter_queue WHERE id = ?`, [id]);
    if (!entry) return res.status(404).json({ error: 'DLQ entry not found' });
    // Reset for retry
    await runDb(`UPDATE dead_letter_queue SET status = 'RESOLVED', retry_count = 0 WHERE id = ?`, [id]);
    res.json({ success: true, message: `DLQ entry ${id} marked for retry` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retry DLQ entry' });
  }
});

// ─── v3: Agent Evaluation Suite (Correction 4) ────────────────────────────
app.get('/api/agents/eval-suite', async (req, res) => {
  try {
    const results = runEvaluationSuite();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Evaluation suite error: ' + err.message });
  }
});

// ─── v3: Creator Data Provenance ───────────────────────────────────────────
app.get('/api/creators/:id/provenance', async (req, res) => {
  try {
    const rows = await queryDb(
      `SELECT * FROM creator_data_provenance WHERE creator_id = ? ORDER BY attribute ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch provenance' });
  }
});

// ─── Attribution & Order Conversion Webhooks ──────────────────────────────
app.post('/api/conversions/webhook', async (req, res) => {
  try {
    const { orderId, orderValue, promoCode, utmMedium, customerEmail, storeProvider } = req.body;
    const result = await recordConversion({
      orderId: orderId || `ORD-${Date.now()}`,
      orderValue: parseFloat(orderValue || 0),
      promoCode,
      utmMedium,
      customerEmail,
      storeProvider: storeProvider || 'SHOPIFY_WEBHOOK'
    });
    res.json(result);
  } catch (err) {
    console.error('[Conversion Webhook Error]:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/campaigns/:id/attribution', async (req, res) => {
  try {
    const summary = await getCampaignAttribution(req.params.id);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attribution metrics: ' + err.message });
  }
});

app.post('/api/deals/:id/utm-link', async (req, res) => {
  try {
    const deal = await getDbRow(`SELECT * FROM deals WHERE id = ?`, [req.params.id]);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const campaign = await getDbRow(`SELECT * FROM campaigns WHERE id = ?`, [deal.campaign_id]) || {};

    const payload = generateCreatorUtmLink({
      targetUrl: req.body.targetUrl,
      brandSlug: campaign.brand_name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'boat',
      creatorHandle: deal.creator_name,
      promoCode: campaign.promo_code || 'BOAT30',
      campaignId: deal.campaign_id
    });

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate UTM link' });
  }
});

// ─── Autonomous Director Agent On-Demand Trigger ─────────────────────────
app.post('/api/agents/director/run', async (req, res) => {
  try {
    const summary = await runAutonomousDirectorCycle();
    res.json({ success: true, summary, message: 'Autonomous Director Cycle Executed Successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Director Agent cycle error: ' + err.message });
  }
});

// ─── AI Agent Tool Registry & Function Calling API ─────────────────────
app.get('/api/agents/tools', (req, res) => {
  res.json({
    tools: AGENT_TOOL_SCHEMAS,
    count: AGENT_TOOL_SCHEMAS.length,
    description: 'Authoritative Function Calling Tool Schemas for AI Agents'
  });
});

app.post('/api/agents/tools/execute', async (req, res) => {
  try {
    const { toolName, args, campaignId, dealId, actorAgent } = req.body;
    if (!toolName) return res.status(400).json({ error: 'toolName parameter is required' });

    const result = await executeAgentTool({
      toolName,
      args: args || {},
      context: { campaignId, dealId, actorAgent: actorAgent || 'API Calling Agent' }
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Tool execution error: ' + err.message });
  }
});

// ─── Model Context Protocol (MCP) Server Endpoints ─────────────────────
app.post('/api/mcp', async (req, res) => {
  try {
    const rpcResponse = await handleMcpRpcRequest(req.body);
    res.json(rpcResponse);
  } catch (err) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: { code: -32603, message: 'MCP handler error: ' + err.message }
    });
  }
});

app.get('/api/mcp/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const endpointNotice = {
    event: 'endpoint',
    data: '/api/mcp'
  };

  res.write(`event: ${endpointNotice.event}\ndata: ${endpointNotice.data}\n\n`);
  console.log('🔌 [MCP Server] Client connected via SSE transport');
});

// Serve static client build files in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Wildcard SPA route
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Project X Server running on port ${PORT}`);
  });
}

export { app };
export default app;
