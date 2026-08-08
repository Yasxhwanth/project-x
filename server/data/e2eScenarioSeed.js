import { v4 as uuidv4 } from 'uuid';
import { runDb, getDbRow } from '../database/sqliteDb.js';

/**
 * E2E Scenario Seed — "boAt Protein Powder Bangalore Q3 Launch"
 *
 * Populates 4 deals that exercise every section of the Control Plane:
 *   Deal A — PAID:                Full loop complete (all 13 stages traversed)
 *   Deal B — ESCALATED:           Negotiation blocked at ₹35,000 → human pending
 *   Deal C — QA_REVISION:         Content failed QA (score 68%) → loop back
 *   Deal D — DEAD LETTER:         Video analysis timed out × 3 → DLQ entry
 */
export async function seedE2EScenario() {
  const campaignId = 'campaign_e2e_bangalore';
  const orgId = 'org_boat_01';

  // Check if already seeded
  const existing = await getDbRow(`SELECT id FROM campaigns WHERE id = ?`, [campaignId]);
  if (existing) {
    console.log('[E2E Seed] Scenario already seeded, skipping.');
    return;
  }

  // ─── Campaign ─────────────────────────────────────────────────────────────
  await runDb(`
    INSERT INTO campaigns (id, brand_name, product_name, max_budget_per_creator, target_reach_min,
      mandatory_phrases, promo_code, guidelines, organization_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [campaignId, 'boAt Lifestyle', 'boAt Protein Powder',
      25000, 50000,
      'Say "boAt protein gives me the power to go further"',
      'BOAT30', 'Show product clearly in the first 15 seconds. Tag @boat.nirvana.',
      orgId, 'ACTIVE']);

  console.log('[E2E Seed] Campaign created:', campaignId);

  // ─── Deal A: Full loop complete (PAID) ────────────────────────────────────
  const dealA = 'deal_e2e_A';
  await runDb(`
    INSERT INTO deals (id, campaign_id, creator_name, creator_email, platform, offered_price,
      current_agreed_price, status, organization_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [dealA, campaignId, 'FitWithPriya', 'priya@fit.in', 'Instagram', 18000, 18000, 'PAID', orgId]);

  // Seed full audit trail for Deal A
  const auditStagesA = [
    ['DISCOVERED',             'SHORTLISTED',             'CREATOR_DISCOVERED',          'Discovery Agent',     'Creator matched fitness + Bangalore + ₹18K criteria. Brand safety: 96%.'],
    ['SHORTLISTED',            'INVITED',                 'CAMPAIGN_PITCH_SENT',         'Outreach Agent',      'Personalized pitch email sent to FitWithPriya.'],
    ['INVITED',                'AGREED',                  'CREATOR_ACCEPTED_INVITE',     'Negotiation Agent',   '₹18,000 within automated authority (≤ ₹25,000). Auto-approved.'],
    ['AGREED',                 'CONTENT_PENDING',         'BRIEF_ISSUED',                'Onboarding Agent',    'Campaign brief auto-delivered by Onboarding Agent.'],
    ['CONTENT_PENDING',        'VIDEO_SUBMITTED',         'VIDEO_UPLOAD_RECEIVED',       'System',              'Creator uploaded video content.'],
    ['VIDEO_SUBMITTED',        'VIDEO_ANALYSIS_PENDING',  'VIDEODB_ANALYSIS_QUEUED',     'Content QA Agent',    'VideoDB multimodal analysis queued.'],
    ['VIDEO_ANALYSIS_PENDING', 'QA_PASSED',               'VIDEODB_AUDIT_PASSED',        'Content QA Agent',    'Score 96%. Promo code BOAT30 at 00:17, spoken phrase at 00:42, logo at 00:08.'],
    ['QA_PASSED',              'PAYMENT_ELIGIBLE',        'PAYMENT_PROPOSED',            'Payment Agent',       'Content QA passed. Payment ₹18,000 proposed for authorization.'],
    ['PAYMENT_ELIGIBLE',       'PAYMENT_APPROVED',        'HUMAN_APPROVAL_GRANTED',      'Human Brand Admin',   'Aman Gupta authorized payment ₹18,000 to FitWithPriya.'],
    ['PAYMENT_APPROVED',       'PAID',                    'PAYMENT_EXECUTED',            'Payment Agent',       'Payment ₹18,000 executed via UPI. Ref: pay_boat_priya_01. Idempotency verified.'],
  ];

  for (const [from, to, event, actor, rationale] of auditStagesA) {
    await runDb(`
      INSERT INTO audit_logs (id, deal_id, campaign_id, stage_from, stage_to, trigger_event, actor_agent, rationale, human_approved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, ['audit_' + uuidv4().substring(0, 8), dealA, campaignId, from, to, event, actor, rationale,
        actor.includes('Human') ? 1 : 0]);
  }

  // Agent runs for Deal A
  await runDb(`
    INSERT INTO agent_runs (id, agent_name, campaign_id, deal_id, input_json, reasoning, tools_used, actions_taken, policy_evaluated, result, confidence, human_approved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, ['run_e2e_A1', 'Discovery Agent', campaignId, dealA,
      JSON.stringify({ query: 'Bangalore fitness creator, ₹18K', platform: 'Instagram' }),
      'Creator matched all discovery criteria: fitness niche, Bangalore, ₹18K rate, brand safety 96%, no competitor overlap in 90 days.',
      'agentGuardrails,riskClassifier', 'Shortlisted FitWithPriya',
      'DiscoveryAgent.minBrandSafetyScore=90, excludeCompetitorWindowDays=90', 'COMPLETED', 0.92, 0]);

  await runDb(`
    INSERT INTO agent_runs (id, agent_name, campaign_id, deal_id, input_json, reasoning, tools_used, actions_taken, policy_evaluated, result, confidence, human_approved, human_actor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, ['run_e2e_A2', 'Content QA Agent', campaignId, dealA,
      JSON.stringify({ complianceScore: 96, hasPromoCode: true, hasSpokenPhrase: true, hasVisualLogo: true }),
      'Content passed all compliance checks. Score: 96%. Promo code BOAT30 detected at 00:17. Spoken phrase at 00:42. Logo at 00:08. Brand safety clean.',
      'videoDbService,agentGuardrails', 'Transitioned deal to QA_PASSED, payment proposed',
      'ContentQA.minPassingComplianceScore=80, requireSpokenPhrase=true, requirePromoCode=true', 'QA_PASSED', 0.97, 0]);

  await runDb(`
    INSERT INTO agent_runs (id, agent_name, campaign_id, deal_id, input_json, reasoning, tools_used, actions_taken, policy_evaluated, result, confidence, human_approved, human_actor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, ['run_e2e_A3', 'Payment Agent', campaignId, dealA,
      JSON.stringify({ amount: 18000, creatorName: 'FitWithPriya', dealStatus: 'PAYMENT_APPROVED' }),
      'Human authorization confirmed. Executing payment ₹18,000 to FitWithPriya. Idempotency key: PAYMENT_deal_e2e_A. No duplicate detected.',
      'idempotencyGuard,razorpayMock', 'Payment executed. Ref: pay_boat_priya_01',
      'PaymentAgent.humanApproved=true, IdempotencyGuard.checked=true', 'PAYMENT_EXECUTED', 1.0, 1, 'Aman Gupta (Brand Admin)']);

  // Seed 5 Verified Shopify Order Conversions for Deal A (FitWithPriya: ₹18,000 fee → ₹1,42,000 GMV → 7.89x ROAS)
  const seedOrders = [
    { id: 'conv_e2e_1', orderId: '#BOAT-89101', val: 2999,  promo: 'BOAT30', medium: 'creator_fitwithpriya', email: 'rajesh@gmail.com' },
    { id: 'conv_e2e_2', orderId: '#BOAT-89102', val: 3499,  promo: 'BOAT30', medium: 'creator_fitwithpriya', email: 'sneha@yahoo.com' },
    { id: 'conv_e2e_3', orderId: '#BOAT-89103', val: 18999, promo: 'BOAT30', medium: 'creator_fitwithpriya', email: 'vikas@tech.in' },
    { id: 'conv_e2e_4', orderId: '#BOAT-89104', val: 58500, promo: 'BOAT30', medium: 'creator_fitwithpriya', email: 'karan@gym.in' },
    { id: 'conv_e2e_5', orderId: '#BOAT-89105', val: 58000, promo: 'BOAT30', medium: 'creator_fitwithpriya', email: 'amit@fit.in' },
  ];

  for (const o of seedOrders) {
    await runDb(`
      INSERT INTO conversions (id, campaign_id, deal_id, creator_id, creator_name, order_id, promo_code, utm_medium, order_value, commission_amount, customer_email, store_provider)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [o.id, campaignId, dealA, 'cr_in_105', 'FitWithPriya', o.orderId, o.promo, o.medium, o.val, Math.round(o.val * 0.1), o.email, 'SHOPIFY_WEBHOOK']);
  }

  console.log('[E2E Seed] Deal A (PAID) seeded with full audit trail, agent runs, and ₹1,42,000 GMV conversions (7.89x ROAS)');

  // ─── Deal B: Escalated — negotiation blocked at ₹35,000 ──────────────────
  const dealB = 'deal_e2e_B';
  await runDb(`
    INSERT INTO deals (id, campaign_id, creator_name, creator_email, platform, offered_price,
      current_agreed_price, status, organization_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [dealB, campaignId, 'GainsByGaurav', 'gaurav@gains.in', 'YouTube', 20000, 20000, 'NEGOTIATING', orgId]);

  await runDb(`
    INSERT INTO escalation_queue (id, deal_id, creator_name, reason, requested_rate, max_allowed_rate, actor_agent, risk_level, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, ['esc_e2e_B1', dealB, 'GainsByGaurav',
      'Requested rate ₹35,000 exceeds automated negotiation policy ceiling of ₹25,000',
      35000, 25000, 'Negotiation Agent', 'HIGH', 'PENDING']);

  await runDb(`
    INSERT INTO agent_runs (id, agent_name, campaign_id, deal_id, input_json, reasoning, tools_used, actions_taken, policy_evaluated, result, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, ['run_e2e_B1', 'Negotiation Agent', campaignId, dealB,
      JSON.stringify({ requestedRate: 35000, campaignMaxBudget: 25000, creatorName: 'GainsByGaurav' }),
      'Requested ₹35,000 exceeds policy ceiling ₹25,000. Risk: HIGH. Escalating to human Brand Admin. Execution paused.',
      'agentGuardrails,riskClassifier', 'Created escalation ticket esc_e2e_B1',
      'NegotiationAgent.maxAutoNegotiablePrice=₹25,000, RiskLevel=HIGH', 'ESCALATED', 0.98]);

  await runDb(`
    INSERT INTO audit_logs (id, deal_id, campaign_id, stage_from, stage_to, trigger_event, actor_agent, rationale, human_approved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, ['audit_e2e_B1', dealB, campaignId, 'INVITED', 'NEGOTIATING',
      'HUMAN_ESCALATION_TRIGGERED', 'Negotiation Agent',
      'Counter-offer ₹35,000 paused. Awaiting Brand Admin authorization.', 0]);

  console.log('[E2E Seed] Deal B (ESCALATED) seeded');

  // ─── Deal C: QA Revision Required — content failed ────────────────────────
  const dealC = 'deal_e2e_C';
  await runDb(`
    INSERT INTO deals (id, campaign_id, creator_name, creator_email, platform, offered_price,
      current_agreed_price, status, organization_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [dealC, campaignId, 'MuscleWithMohit', 'mohit@muscle.in', 'Instagram', 22000, 22000, 'QA_REVISION_REQUIRED', orgId]);

  await runDb(`
    INSERT INTO agent_runs (id, agent_name, campaign_id, deal_id, input_json, reasoning, tools_used, actions_taken, policy_evaluated, result, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, ['run_e2e_C1', 'Content QA Agent', campaignId, dealC,
      JSON.stringify({ complianceScore: 68, hasPromoCode: false, hasSpokenPhrase: true, hasVisualLogo: true }),
      'Content failed compliance. Score: 68% (min 80%). Missing: promo code BOAT30. Requesting revision from creator.',
      'videoDbService,agentGuardrails', 'Emitted QA_REVISION_REQUIRED. Outreach Agent to send revision email.',
      'ContentQA.minPassingComplianceScore=80, requirePromoCode=true', 'REVISION_REQUIRED', 0.95]);

  await runDb(`
    INSERT INTO audit_logs (id, deal_id, campaign_id, stage_from, stage_to, trigger_event, actor_agent, rationale, human_approved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, ['audit_e2e_C1', dealC, campaignId, 'VIDEO_ANALYSIS_PENDING', 'QA_REVISION_REQUIRED',
      'VIDEODB_AUDIT_FAILED', 'Content QA Agent',
      'Content QA score 68% below 80% threshold. Missing promo code. Revision requested.', 0]);

  console.log('[E2E Seed] Deal C (QA_REVISION_REQUIRED) seeded');

  // ─── Deal D: Dead Letter Queue — video analysis timed out ─────────────────
  const dealD = 'deal_e2e_D';
  await runDb(`
    INSERT INTO deals (id, campaign_id, creator_name, creator_email, platform, offered_price,
      current_agreed_price, status, organization_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [dealD, campaignId, 'ProteinWithPrateek', 'prateek@protein.in', 'YouTube', 19000, 19000, 'VIDEO_ANALYSIS_PENDING', orgId]);

  await runDb(`
    INSERT INTO dead_letter_queue (id, agent_name, action_type, deal_id, payload_json, error, retry_count, max_retries, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, ['dlq_e2e_D1', 'Content QA Agent', 'VIDEO_ANALYSIS',
      dealD, JSON.stringify({ videoUrl: 'https://youtube.com/watch?v=abc123', dealId: dealD }),
      'VideoDB API timeout after 30s (attempt 3/3). Network error: ECONNABORTED',
      3, 3, 'PENDING']);

  await runDb(`
    INSERT INTO audit_logs (id, deal_id, campaign_id, stage_from, stage_to, trigger_event, actor_agent, rationale, human_approved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, ['audit_e2e_D1', dealD, campaignId, 'VIDEO_SUBMITTED', 'VIDEO_ANALYSIS_PENDING',
      'VIDEODB_TIMEOUT', 'Content QA Agent',
      'VideoDB analysis timed out after 3 retries (30s each). Routed to Dead Letter Queue. Manual retry required.', 0]);

  console.log('[E2E Seed] Deal D (DEAD LETTER) seeded');
  console.log('[E2E Seed] ✓ Complete E2E scenario seeded successfully');
}
