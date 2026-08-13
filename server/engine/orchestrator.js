import eventBus, { EVENTS } from './eventBus.js';
import { transitionDealState, logAuditTrail } from './campaignStateMachine.js';
import { getDbRow, runDb } from '../database/sqliteDb.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Project X Orchestrator
 *
 * Registers all event → agent/action mappings.
 * ALL routing decisions are deterministic (switch/if logic) — no LLM in this layer.
 * LLM proposes. Deterministic systems authorize.
 */

async function createAgentRun({ agentName, campaignId, dealId, input, reasoning, toolsUsed, actionsTaken, policyEvaluated, result, confidence }) {
  try {
    const id = 'run_' + uuidv4().substring(0, 8);
    await runDb(
      `INSERT INTO agent_runs (id, agent_name, campaign_id, deal_id, input_json, reasoning, tools_used, actions_taken, policy_evaluated, result, confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, agentName, campaignId || null, dealId || null,
       JSON.stringify(input), reasoning, toolsUsed, actionsTaken, policyEvaluated,
       result, confidence || null]
    );
    return id;
  } catch (err) {
    console.error('[Orchestrator] Agent run creation error:', err.message);
  }
}

async function handleCreatorAgreed(payload) {
  const { dealId, campaignId } = payload;
  console.log(`[Orchestrator] CREATOR_AGREED → issuing brief for deal ${dealId}`);

  await createAgentRun({
    agentName: 'Onboarding Agent',
    campaignId, dealId,
    input: payload,
    reasoning: 'Deal reached AGREED state. Issuing content brief and transitioning to CONTENT_PENDING.',
    toolsUsed: 'campaignStateMachine',
    actionsTaken: 'Transitioned deal to CONTENT_PENDING, brief issued',
    policyEvaluated: 'Onboarding.autoDeliverBriefs=true',
    result: 'COMPLETED',
    confidence: 1.0
  });

  // Transition to CONTENT_PENDING
  try {
    await transitionDealState({
      dealId, triggerEvent: 'BRIEF_ISSUED', actorAgent: 'Onboarding Agent',
      targetStage: 'CONTENT_PENDING', bypassGuardrails: true,
      payload: { rationale: 'Campaign brief auto-delivered by Onboarding Agent' }
    });
  } catch (err) {
    console.error('[Orchestrator] CREATOR_AGREED handler error:', err.message);
  }
}

async function handleContentSubmitted(payload) {
  const { dealId, campaignId } = payload;
  console.log(`[Orchestrator] CONTENT_SUBMITTED → triggering QA analysis for deal ${dealId}`);

  // Transition to VIDEO_ANALYSIS_PENDING
  try {
    await transitionDealState({
      dealId, triggerEvent: 'VIDEO_UPLOAD_RECEIVED', actorAgent: 'Content QA Agent',
      targetStage: 'VIDEO_ANALYSIS_PENDING', bypassGuardrails: true,
      payload: { rationale: 'Video received, VideoDB analysis queued' }
    });
  } catch (err) {
    console.error('[Orchestrator] CONTENT_SUBMITTED handler error:', err.message);
  }
}

async function handleQaPassed(payload) {
  const { dealId, campaignId } = payload;
  console.log(`[Orchestrator] QA_PASSED → transitioning to PAYMENT_ELIGIBLE for deal ${dealId}`);

  await createAgentRun({
    agentName: 'Content QA Agent',
    campaignId, dealId,
    input: payload,
    reasoning: 'Content passed all compliance checks. Recommending payment eligibility.',
    toolsUsed: 'videoDbService,campaignStateMachine',
    actionsTaken: 'Transitioned deal to PAYMENT_ELIGIBLE, payment proposal created',
    policyEvaluated: 'ContentQA.minPassingComplianceScore=80',
    result: 'QA_PASSED',
    confidence: payload.score ? payload.score / 100 : 0.95
  });

  try {
    await transitionDealState({
      dealId, triggerEvent: 'VIDEODB_AUDIT_PASSED', actorAgent: 'Content QA Agent',
      targetStage: 'PAYMENT_ELIGIBLE', bypassGuardrails: true,
      payload: { rationale: `Content QA passed. Score: ${payload.score || 96}%. Payment authorization required.` }
    });

    // Create payment authorization escalation ticket (HIGH risk — human must approve all payments)
    const deal = await getDbRow('SELECT * FROM deals WHERE id = ?', [dealId]);
    if (deal) {
      const escId = 'esc_pay_' + uuidv4().substring(0, 8);
      await runDb(
        `INSERT INTO escalation_queue (id, deal_id, creator_name, reason, requested_rate, max_allowed_rate, actor_agent, risk_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [escId, dealId, deal.creator_name,
         `Payment authorization required for ${deal.creator_name} — content QA passed (score: ${payload.score || 96}%)`,
         deal.current_agreed_price || deal.offered_price,
         deal.current_agreed_price || deal.offered_price,
         'Payment Agent', 'HIGH']
      );
    }
  } catch (err) {
    console.error('[Orchestrator] QA_PASSED handler error:', err.message);
  }
}

async function handleQaRevisionRequired(payload) {
  const { dealId, campaignId } = payload;
  console.log(`[Orchestrator] QA_REVISION_REQUIRED → looping back to CONTENT_PENDING for deal ${dealId}`);

  await createAgentRun({
    agentName: 'Content QA Agent',
    campaignId, dealId,
    input: payload,
    reasoning: `Content failed QA checks. Score: ${payload.score}%. Missing: ${payload.missing?.join(', ') || 'compliance requirements'}. Requesting revision.`,
    toolsUsed: 'videoDbService,campaignStateMachine',
    actionsTaken: 'Transitioned deal to QA_REVISION_REQUIRED, revision request queued',
    policyEvaluated: 'ContentQA.minPassingComplianceScore=80',
    result: 'REVISION_REQUIRED',
    confidence: 0.95
  });

  try {
    await transitionDealState({
      dealId, triggerEvent: 'VIDEODB_AUDIT_FAILED', actorAgent: 'Content QA Agent',
      targetStage: 'QA_REVISION_REQUIRED', bypassGuardrails: true,
      payload: { rationale: `Content QA score ${payload.score}% below 80% threshold. Revision required.` }
    });
  } catch (err) {
    console.error('[Orchestrator] QA_REVISION_REQUIRED handler error:', err.message);
  }
}

async function handleActionFailed(payload) {
  const { agentName, actionType, dealId, error, retryCount, maxRetries } = payload;
  console.error(`[Orchestrator] ACTION_FAILED → ${agentName} / ${actionType} for deal ${dealId}: ${error}`);

  if ((retryCount || 0) >= (maxRetries || 3)) {
    // Write to dead letter queue
    const id = 'dlq_' + uuidv4().substring(0, 8);
    await runDb(
      `INSERT INTO dead_letter_queue (id, agent_name, action_type, deal_id, payload_json, error, retry_count, max_retries)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, agentName, actionType, dealId, JSON.stringify(payload), error, retryCount || 3, maxRetries || 3]
    );
    console.log(`[Orchestrator] Dead Letter Queue entry created: ${id}`);
  }
}

/**
 * Register all event handlers. Called once at server startup.
 */
export function startOrchestrator() {
  eventBus.subscribe(EVENTS.CREATOR_AGREED,         handleCreatorAgreed);
  eventBus.subscribe(EVENTS.CONTENT_SUBMITTED,      handleContentSubmitted);
  eventBus.subscribe(EVENTS.QA_PASSED,              handleQaPassed);
  eventBus.subscribe(EVENTS.QA_REVISION_REQUIRED,   handleQaRevisionRequired);
  eventBus.subscribe(EVENTS.ACTION_FAILED,          handleActionFailed);

  console.log('[Orchestrator] All agent event handlers registered');
}

/**
 * Creates a human escalation ticket in the escalation_queue table.
 * Called by security shield and agent tools when a decision requires human approval.
 */
export async function createEscalationTicket({ dealId, creatorName, reason, requestedRate, maxAllowedRate, actorAgent, riskLevel }) {
  try {
    const id = 'esc_' + uuidv4().substring(0, 8);
    await runDb(
      `INSERT INTO escalation_queue (id, deal_id, creator_name, reason, requested_rate, max_allowed_rate, actor_agent, risk_level, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [id, dealId || null, creatorName || 'Unknown', reason,
       requestedRate || null, maxAllowedRate || null,
       actorAgent || 'System', riskLevel || 'MEDIUM']
    );
    console.log(`[Orchestrator] Escalation ticket created: ${id} — ${reason}`);
    return id;
  } catch (err) {
    console.error('[Orchestrator] createEscalationTicket error:', err.message);
    return null;
  }
}

export { createAgentRun };
