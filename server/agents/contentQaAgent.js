import { AGENT_GUARDRAILS } from './agentGuardrails.js';
import { createAgentRun } from '../engine/orchestrator.js';

/**
 * Content QA Agent — Updated for v3
 *
 * Returns explicit QA outcome: QA_PASSED | QA_REVISION_REQUIRED
 * Analysis happening ≠ content passed. These are distinct states.
 */
export async function analyzeContent({ dealId, campaignId, videoUrl, complianceScore, hasPromoCode, hasSpokenPhrase, hasVisualLogo, hasBrandSafetyViolation }) {
  const policy = AGENT_GUARDRAILS['Content QA Agent'];

  const missing = [];
  if (!hasPromoCode)    missing.push('promo code');
  if (!hasSpokenPhrase) missing.push('spoken phrase');
  if (!hasVisualLogo)   missing.push('visual logo');

  const score = complianceScore ?? 0;
  const passesThreshold = score >= policy.minPassingComplianceScore;
  const passesChecks    = missing.length === 0;
  const noSafetyViolation = !hasBrandSafetyViolation;

  const passed = passesThreshold && passesChecks && noSafetyViolation;
  const outcome = passed ? 'QA_PASSED' : 'QA_REVISION_REQUIRED';

  const reasoning = passed
    ? `Content passed all compliance checks. Score: ${score}%. Promo code ✓, spoken phrase ✓, visual logo ✓, brand safety ✓.`
    : `Content failed compliance. Score: ${score}% (min ${policy.minPassingComplianceScore}%). Missing: ${missing.join(', ') || 'none'}. Brand safety violation: ${hasBrandSafetyViolation ? 'YES' : 'NO'}.`;

  // Record agent run
  await createAgentRun({
    agentName: 'Content QA Agent',
    campaignId, dealId,
    input: { videoUrl, complianceScore: score, hasPromoCode, hasSpokenPhrase, hasVisualLogo, hasBrandSafetyViolation },
    reasoning,
    toolsUsed: 'videoDbService,agentGuardrails',
    actionsTaken: `Emitting ${outcome} event to orchestrator via outbox`,
    policyEvaluated: `ContentQA.minPassingComplianceScore=${policy.minPassingComplianceScore}, requireSpokenPhrase=${policy.requireSpokenPhrase}, requirePromoCode=${policy.requirePromoCode}`,
    result: outcome,
    confidence: 0.95
  });

  return { outcome, score, missing, passed };
}
