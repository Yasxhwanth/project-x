import { v4 as uuidv4 } from 'uuid';
import { getDbRow, runDb } from '../database/sqliteDb.js';
import { classify, RISK_LEVELS } from '../engine/riskClassifier.js';
import { ensureIdempotent, buildKey } from '../engine/idempotencyGuard.js';
import { createAgentRun } from '../engine/orchestrator.js';

/**
 * Payment Agent — Correction 3: Three fully separated stages
 *
 * PROPOSE  → records intent, creates human authorization escalation (HIGH risk)
 * AUTHORIZE → handled by human via escalation queue (not this agent)
 * EXECUTE  → only callable after PAYMENT_APPROVED deal status; idempotency-guarded
 *
 * This agent CANNOT authorize its own payment (separation of duties).
 */

/**
 * Stage 1: Propose a payment.
 * Creates an agent run and escalation ticket. Does NOT transfer any money.
 */
export async function proposePayment({ dealId, campaignId, amount, creatorName }) {
  const risk = classify({ actionType: 'PAYMENT', financialAmount: amount });

  const reasoning = `Content QA passed for ${creatorName}. Agreed fee ₹${amount?.toLocaleString('en-IN')}. ${risk.justification}`;

  await createAgentRun({
    agentName: 'Payment Agent',
    campaignId, dealId,
    input: { amount, creatorName },
    reasoning,
    toolsUsed: 'riskClassifier',
    actionsTaken: 'Created payment authorization escalation ticket',
    policyEvaluated: `PaymentAgent.requiresHumanApproval=true, RiskLevel=${risk.riskLevel}`,
    result: 'PROPOSED',
    confidence: 1.0
  });

  // Always escalate payment for human authorization
  const escId = 'esc_pay_' + uuidv4().substring(0, 8);
  await runDb(
    `INSERT INTO escalation_queue (id, deal_id, creator_name, reason, requested_rate, max_allowed_rate, actor_agent, risk_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [escId, dealId, creatorName,
     `Payment authorization required: ₹${amount?.toLocaleString('en-IN')} for ${creatorName} (content QA passed)`,
     amount, amount, 'Payment Agent', risk.riskLevel]
  );

  return { proposed: true, escalationTicketId: escId, riskLevel: risk.riskLevel, amount };
}

/**
 * Stage 3: Execute a payment — only callable after human authorization.
 * Idempotency-guarded to prevent double payments.
 *
 * @throws if deal is not in PAYMENT_APPROVED status
 */
export async function executePayment({ dealId, campaignId }) {
  const deal = await getDbRow('SELECT * FROM deals WHERE id = ?', [dealId]);
  if (!deal) throw new Error(`Deal ${dealId} not found`);

  // Separation of duties: must be in PAYMENT_APPROVED state
  if (deal.status !== 'PAYMENT_APPROVED') {
    throw new Error(
      `Payment execution blocked. Deal ${dealId} must be PAYMENT_APPROVED. Current status: ${deal.status}`
    );
  }

  const amount = deal.current_agreed_price || deal.offered_price;
  const idempotencyKey = buildKey('PAYMENT', dealId);

  const { result, isReplay } = await ensureIdempotent(
    idempotencyKey,
    'PAYMENT',
    dealId,
    async () => {
      // Razorpay / mock payment execution here
      const payoutRef = 'pay_' + uuidv4().substring(0, 10);
      const payoutResult = {
        success: true,
        payoutRef,
        amount,
        creatorName: deal.creator_name,
        method: 'UPI (Razorpay Mock)',
        executedAt: new Date().toISOString()
      };

      // Record successful agent run
      await createAgentRun({
        agentName: 'Payment Agent',
        campaignId, dealId,
        input: { amount, creatorName: deal.creator_name, dealStatus: deal.status },
        reasoning: `Human authorization confirmed. Executing payment ₹${amount?.toLocaleString('en-IN')} to ${deal.creator_name}. Idempotency key: ${idempotencyKey}`,
        toolsUsed: 'idempotencyGuard,razorpayMock',
        actionsTaken: `Payment executed. Ref: ${payoutRef}`,
        policyEvaluated: 'PaymentAgent.humanApproved=true, IdempotencyGuard.checked=true',
        result: 'PAYMENT_EXECUTED',
        confidence: 1.0
      });

      return payoutResult;
    }
  );

  if (isReplay) {
    console.log(`[PaymentAgent] Idempotency replay for deal ${dealId}. No double payment.`);
  }

  return result;
}

// Alias for directorAgent import compatibility — proposes payment for human authorization
export const executePaymentAuthorization = proposePayment;
