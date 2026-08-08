import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

import { queryDb, getDbRow, runDb } from './database/sqliteDb.js';
import { CreatorScraperSDK } from './sdk/creatorScraperSdk.js';
import { processCreatorEmailResponse } from './services/aiNegotiatorService.js';
import { analyzeVideoWithVideoDB } from './services/videoDbService.js';
import { startBackgroundCronSchedule, runAutomatedScraperJob, getAutoScraperStatus } from './jobs/automatedScraperJob.js';
import { generateCampaignStrategy } from './services/aiCampaignStrategyService.js';
import { getCampaignAnalyticsSummary } from './services/analyticsService.js';
import { loginUser, registerUserAndOrganization, getCurrentUserSession, getOrganizationMembers, sendLoginOtp, verifyLoginOtp, loginWithGoogle } from './services/authService.js';
import { processRealAiNegotiation } from './services/realAiNegotiator.js';
import { sendCreatorEmail, pollCreatorInbox } from './services/gmailEmailService.js';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);






const app = express();
const PORT = process.env.PORT || 5001;

// Start Automated Background Scraper Job (Every 30 mins)
startBackgroundCronSchedule(30);

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

app.get('/api/auth/me', optionalAuth, async (req, res) => {
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
          smtp_host = ?, smtp_port = ?, smtp_user = ?, ai_tone = ?, auto_reply_enabled = ?
      WHERE slug = 'boat-lifestyle' OR id = 'org_boat_01'
    `, [senderName, senderEmail, geminiApiKey || '', geminiApiKey || '', smtpHost, smtpPort, smtpUser, aiTone, autoReplyEnabled ? 1 : 0]);

    if (geminiApiKey) {
      process.env.GEMINI_API_KEY = geminiApiKey;
    }

    res.json({ success: true });
  } catch (err) {
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
    const creators = await scraperSdk.searchCreators({
      query,
      platform,
      reachMax,
      budgetMax,
      niche
    });

    res.json({ total: creators.length, creators });
  } catch (err) {
    console.error("SDK search error:", err);
    res.status(500).json({ error: "Failed to fetch creators via SDK" });
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

// 3. Deals API & Outreach
app.get('/api/deals', async (req, res) => {
  try {
    const rows = await queryDb("SELECT * FROM deals ORDER BY created_at DESC");
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

app.post('/api/deals/outreach', async (req, res) => {
  const { creatorId, campaignId, offeredPrice } = req.body;

  try {
    const creator = await getDbRow("SELECT * FROM creators WHERE id = ?", [creatorId]);
    const campaign = await getDbRow("SELECT * FROM campaigns WHERE id = ?", [campaignId]) || await getDbRow("SELECT * FROM campaigns LIMIT 1");

    if (!creator) return res.status(404).json({ error: "Creator not found" });

    const initialPrice = offeredPrice || creator.price_per_post;
    const dealId = "deal_" + uuidv4().substring(0, 8);

    const initialEmail = {
      id: "msg_out_" + Date.now(),
      sender: "BRAND_AI",
      senderName: `${campaign.brand_name} Marketing AI`,
      recipientName: creator.name,
      body: `Namaste ${creator.name},\n\nWe love your content on ${creator.platform}! We'd like to invite you to collaborate on our upcoming campaign for ${campaign.product_name}.\n\n- Proposed Fee: ₹${initialPrice.toLocaleString('en-IN')}\n- Required Spoken Phrase: "${campaign.mandatory_phrases}"\n- Guidelines: ${campaign.guidelines || "Feature product clearly in your video."}\n\nPlease reply directly to let us know if you'd like to partner with us!\n\nBest regards,\n${campaign.brand_name} Marketing AI`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intent: "INITIAL_OUTREACH"
    };

    await runDb(`
      INSERT INTO deals (
        id, campaign_id, creator_id, creator_name, creator_email, creator_avatar,
        platform, offered_price, current_agreed_price, status, video_url, email_thread_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      dealId, campaign.id, creator.id, creator.name, creator.email, creator.avatar,
      creator.platform, initialPrice, initialPrice, 'INVITED', '', JSON.stringify([initialEmail])
    ]);

    const newDeal = {
      id: dealId,
      campaignId: campaign.id,
      creatorId: creator.id,
      creatorName: creator.name,
      creatorEmail: creator.email,
      creatorAvatar: creator.avatar,
      platform: creator.platform,
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

    // Step 4: Branch on QA outcome via State Machine
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

    // Save analysis JSON to deal record
    await runDb(
      `UPDATE deals SET video_url = ?, video_analysis_json = ? WHERE id = ?`,
      [targetVideoUrl, JSON.stringify(analysis), row.id]
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
    const ticket = await getDbRow("SELECT * FROM escalation_queue WHERE id = ?", [id]);
    if (!ticket) return res.status(404).json({ error: "Escalation ticket not found" });

    // Mark ticket approved
    await runDb("UPDATE escalation_queue SET status = 'APPROVED' WHERE id = ?", [id]);

    const deal = await getDbRow("SELECT * FROM deals WHERE id = ?", [ticket.deal_id]);

    // Handle Payment Authorization Ticket vs Negotiation Ticket
    if (ticket.actor_agent === 'Payment Agent' || ticket.reason?.includes('Payment authorization')) {
      // Transition to PAYMENT_APPROVED
      await transitionDealState({
        dealId: ticket.deal_id,
        triggerEvent: 'HUMAN_PAYMENT_AUTHORIZATION_GRANTED',
        actorAgent: 'Human Brand Admin',
        targetStage: 'PAYMENT_APPROVED',
        bypassGuardrails: true,
        payload: { humanApproved: true, rationale: `Human Admin authorized payment ₹${ticket.requested_rate?.toLocaleString('en-IN')}` }
      });
      res.json({ success: true, message: "Payment authorized! Deal is now PAYMENT_APPROVED and ready for payout execution." });
    } else {
      // Negotiation rate approval -> transition to AGREED
      await transitionDealState({
        dealId: ticket.deal_id,
        triggerEvent: 'HUMAN_APPROVAL_GRANTED',
        actorAgent: 'Human Brand Admin',
        targetStage: 'AGREED',
        bypassGuardrails: true,
        payload: { agreedPrice: ticket.requested_rate, humanApproved: true, rationale: `Human Admin approved rate of ₹${ticket.requested_rate?.toLocaleString('en-IN')}` }
      });
      res.json({ success: true, message: "Escalation approved! Rate locked and transitioned to AGREED." });
    }
  } catch (err) {
    console.error("Escalation approval error:", err);
    res.status(500).json({ error: "Failed to approve escalation: " + err.message });
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

// Serve static client build files in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Wildcard SPA route
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Project X Server running on port ${PORT}`);
});
