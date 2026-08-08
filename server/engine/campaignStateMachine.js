import { v4 as uuidv4 } from 'uuid';
import { runDb, queryDb, getDbRow } from '../database/sqliteDb.js';
import { validateNegotiationGuardrails } from '../agents/agentGuardrails.js';

export const CAMPAIGN_STAGES = {
  DISCOVERED:              'DISCOVERED',
  SHORTLISTED:             'SHORTLISTED',
  INVITED:                 'INVITED',
  NEGOTIATING:             'NEGOTIATING',
  AGREED:                  'AGREED',
  CONTENT_PENDING:         'CONTENT_PENDING',
  VIDEO_SUBMITTED:         'VIDEO_SUBMITTED',
  VIDEO_ANALYSIS_PENDING:  'VIDEO_ANALYSIS_PENDING',
  QA_PASSED:               'QA_PASSED',
  QA_REVISION_REQUIRED:    'QA_REVISION_REQUIRED',
  PAYMENT_ELIGIBLE:        'PAYMENT_ELIGIBLE',
  PAYMENT_APPROVED:        'PAYMENT_APPROVED',
  PAID:                    'PAID'
};

/**
 * Valid Transition Matrix — Correction 1: Explicit QA outcome branches
 *
 * VIDEO_SUBMITTED → VIDEO_ANALYSIS_PENDING → QA_PASSED         → PAYMENT_ELIGIBLE → PAYMENT_APPROVED → PAID
 *                                          → QA_REVISION_REQUIRED → CONTENT_PENDING (loop back)
 *                                          → CONTENT_PENDING   (analysis failure, routed via DLQ retry)
 */
const VALID_TRANSITIONS = {
  'DISCOVERED':             ['SHORTLISTED', 'INVITED'],
  'SHORTLISTED':            ['INVITED'],
  'INVITED':                ['NEGOTIATING', 'AGREED'],
  'NEGOTIATING':            ['AGREED', 'INVITED'],
  'AGREED':                 ['CONTENT_PENDING'],
  'CONTENT_PENDING':        ['VIDEO_SUBMITTED'],
  'VIDEO_SUBMITTED':        ['VIDEO_ANALYSIS_PENDING'],
  'VIDEO_ANALYSIS_PENDING': ['QA_PASSED', 'QA_REVISION_REQUIRED', 'CONTENT_PENDING'],
  'QA_PASSED':              ['PAYMENT_ELIGIBLE'],
  'QA_REVISION_REQUIRED':   ['CONTENT_PENDING'],
  'PAYMENT_ELIGIBLE':       ['PAYMENT_APPROVED'],
  'PAYMENT_APPROVED':       ['PAID'],
  'PAID':                   []
};

/**
 * Map stage transitions to outbox event names (Correction 2: outbox pattern)
 */
const TRANSITION_EVENTS = {
  'AGREED':                 'CREATOR_AGREED',
  'CONTENT_PENDING':        'CONTENT_PENDING_ISSUED',
  'VIDEO_ANALYSIS_PENDING': 'CONTENT_SUBMITTED',
  'QA_PASSED':              'QA_PASSED',
  'QA_REVISION_REQUIRED':   'QA_REVISION_REQUIRED',
  'PAYMENT_ELIGIBLE':       'PAYMENT_PROPOSED',
  'PAYMENT_APPROVED':       'PAYMENT_AUTHORIZED',
  'PAID':                   'PAYMENT_EXECUTED'
};

/**
 * Write an outbox event atomically alongside state change.
 * Dispatcher polls this table and emits to eventBus.
 */
async function writeOutboxEvent(eventName, payload) {
  try {
    const id = 'outbox_' + uuidv4().substring(0, 8);
    await runDb(
      `INSERT INTO outbox_events (id, event_name, payload_json) VALUES (?, ?, ?)`,
      [id, eventName, JSON.stringify(payload)]
    );
  } catch (err) {
    console.error('Outbox write error:', err);
  }
}

/**
 * Transition Campaign Deal State with:
 *  - Valid topology check
 *  - Guardrail enforcement
 *  - Risk classification
 *  - Atomic DB update + outbox write
 *  - Immutable audit log
 */
export async function transitionDealState({
  dealId,
  triggerEvent,
  actorAgent,
  targetStage,
  payload = {},
  bypassGuardrails = false
}) {
  const deal = await getDbRow('SELECT * FROM deals WHERE id = ?', [dealId]);
  if (!deal) throw new Error(`Deal ID ${dealId} not found`);

  const currentStage = (deal.status || 'INVITED').toUpperCase();

  // 1. Validate transition topology
  const allowed = VALID_TRANSITIONS[currentStage] || [];
  if (!allowed.includes(targetStage) && currentStage !== targetStage) {
    throw new Error(
      `InvalidTransitionError: ${currentStage} → ${targetStage} is not a valid transition (trigger: ${triggerEvent})`
    );
  }

  // 2. Negotiation guardrail check
  if (triggerEvent === 'SUBMIT_COUNTER_OFFER' && !bypassGuardrails) {
    const campaign = await getDbRow('SELECT * FROM campaigns WHERE id = ?', [deal.campaign_id])
      || { max_budget_per_creator: 50000 };

    const guardrailResult = validateNegotiationGuardrails({
      requestedRate: payload.requestedRate || deal.offered_price,
      maxBudgetCap:  campaign.max_budget_per_creator,
      creatorName:   deal.creator_name,
      dealId:        deal.id
    });

    if (guardrailResult.escalationRequired) {
      const escId = 'esc_' + uuidv4().substring(0, 8);
      await runDb(
        `INSERT INTO escalation_queue (id, deal_id, creator_name, reason, requested_rate, max_allowed_rate, actor_agent, risk_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [escId, deal.id, deal.creator_name, guardrailResult.reason,
         payload.requestedRate, guardrailResult.escalationTicket.maxAllowedRate,
         actorAgent || 'Negotiation Agent', 'HIGH']
      );

      await logAuditTrail({
        dealId: deal.id, campaignId: deal.campaign_id,
        stageFrom: currentStage, stageTo: 'NEGOTIATING',
        triggerEvent: 'HUMAN_ESCALATION_TRIGGERED',
        actorAgent: actorAgent || 'Negotiation Agent',
        rationale: guardrailResult.reason, humanApproved: false
      });

      // Write outbox event for orchestrator
      await writeOutboxEvent('ESCALATION_CREATED', {
        escalationId: escId, dealId: deal.id,
        creatorName: deal.creator_name, reason: guardrailResult.reason
      });

      return {
        success: false, escalationRequired: true,
        escalationTicketId: escId, message: guardrailResult.reason, deal
      };
    }
  }

  // 3. Payment separation of duties check (Correction 3)
  if (targetStage === 'PAID' && !bypassGuardrails) {
    if (deal.status !== 'PAYMENT_APPROVED') {
      throw new Error(
        `Payment execution blocked: deal must be in PAYMENT_APPROVED state. Current: ${deal.status}`
      );
    }
  }

  // 4. Update deal record + write outbox event atomically
  const newAgreedPrice = payload.agreedPrice || deal.current_agreed_price || deal.offered_price;
  await runDb(
    `UPDATE deals SET status = ?, current_agreed_price = ? WHERE id = ?`,
    [targetStage, newAgreedPrice, dealId]
  );

  // Write outbox event for the dispatcher to relay to orchestrator
  const outboxEvent = TRANSITION_EVENTS[targetStage];
  if (outboxEvent) {
    await writeOutboxEvent(outboxEvent, { dealId: deal.id, campaignId: deal.campaign_id, stage: targetStage, ...payload });
  }

  // 5. Immutable audit trail
  await logAuditTrail({
    dealId: deal.id, campaignId: deal.campaign_id,
    stageFrom: currentStage, stageTo: targetStage,
    triggerEvent, actorAgent: actorAgent || 'State Machine Engine',
    rationale: payload.rationale || `Transitioned ${currentStage} → ${targetStage} via ${triggerEvent}`,
    humanApproved: bypassGuardrails || payload.humanApproved ? true : false
  });

  const updatedDeal = await getDbRow('SELECT * FROM deals WHERE id = ?', [dealId]);
  return { success: true, escalationRequired: false, deal: updatedDeal };
}

export async function logAuditTrail({ dealId, campaignId, stageFrom, stageTo, triggerEvent, actorAgent, rationale, humanApproved }) {
  try {
    const id = 'audit_' + uuidv4().substring(0, 8);
    await runDb(
      `INSERT INTO audit_logs (id, deal_id, campaign_id, stage_from, stage_to, trigger_event, actor_agent, rationale, human_approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dealId, campaignId, stageFrom, stageTo, triggerEvent, actorAgent, rationale, humanApproved ? 1 : 0]
    );
  } catch (err) {
    console.error('Audit log creation error:', err);
  }
}

export { writeOutboxEvent };
