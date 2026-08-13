import { v4 as uuidv4 } from 'uuid';
import { runDb, getDbRow } from '../database/sqliteDb.js';
import { validateNegotiationGuardrails, AGENT_GUARDRAILS } from './agentGuardrails.js';
import { classify } from '../engine/riskClassifier.js';
import { createAgentRun } from '../engine/orchestrator.js';

/**
 * Negotiation Agent — Updated for v3
 * Now records structured Agent Run for every autonomous operation.
 */
export async function evaluateCounterOffer({ dealId, requestedRate, campaignId }) {
  const campaign = await getDbRow('SELECT * FROM campaigns WHERE id = ?', [campaignId])
    || { max_budget_per_creator: 50000 };

  const deal = await getDbRow('SELECT * FROM deals WHERE id = ?', [dealId]);
  const policy = AGENT_GUARDRAILS['Negotiation Agent'];

  // Risk classification first
  const risk = classify({ actionType: 'NEGOTIATION', financialAmount: requestedRate });

  // Guardrail evaluation
  const guardrailResult = validateNegotiationGuardrails({
    requestedRate,
    maxBudgetCap: campaign.max_budget_per_creator,
    creatorName: deal?.creator_name || 'Unknown',
    dealId
  });

  const result = guardrailResult.escalationRequired ? 'ESCALATED' : 'AUTO_APPROVED';
  const reasoning = guardrailResult.escalationRequired
    ? `Requested ₹${requestedRate.toLocaleString('en-IN')} exceeds policy ceiling ₹${policy.maxAutoNegotiablePrice.toLocaleString('en-IN')}. Escalating to human Brand Admin.`
    : `Requested ₹${requestedRate.toLocaleString('en-IN')} within automated authority. Auto-approving.`;

  // Record agent run
  await createAgentRun({
    agentName: 'Negotiation Agent',
    campaignId, dealId,
    input: { requestedRate, campaignMaxBudget: campaign.max_budget_per_creator, creatorName: deal?.creator_name },
    reasoning,
    toolsUsed: 'agentGuardrails,riskClassifier',
    actionsTaken: result === 'ESCALATED' ? 'Created escalation ticket in escalation_queue' : 'Auto-approved rate, transitioning to AGREED',
    policyEvaluated: `NegotiationAgent.maxAutoNegotiablePrice=₹${policy.maxAutoNegotiablePrice.toLocaleString('en-IN')}, RiskLevel=${risk.riskLevel}`,
    result,
    confidence: 0.98
  });

  return { ...guardrailResult, riskLevel: risk.riskLevel };
}

// Alias for backward compatibility — directorAgent imports this name
export const executeNegotiationCycle = evaluateCounterOffer;
