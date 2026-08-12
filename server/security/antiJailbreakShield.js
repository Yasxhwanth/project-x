import { createEscalationTicket } from '../engine/orchestrator.js';

/**
 * 🛡️ Anti-Jailbreak & Security Shield Engine for Project X AI Agents
 * 
 * Protects against prompt injection attacks, system prompt leakage,
 * budget cap extraction, and unauthorized state machine manipulation.
 */

// Known Prompt Injection & Jailbreak Attack Patterns
const JAILBREAK_PATTERNS = [
  /ignore\s+(all\s+)?(previous\s+)?instructions/i,
  /disregard\s+(all\s+)?prior\s+prompts/i,
  /system\s+override/i,
  /developer\s+mode/i,
  /dan\s+mode/i,
  /reveal\s+(internal\s+)?budget/i,
  /print\s+(system\s+)?prompt/i,
  /bypass\s+guardrails/i,
  /sudo\s+approve/i,
  /execute\s+sql/i,
  /drop\s+table/i,
  /set\s+status\s+to\s+paid/i,
  /grant\s+admin/i,
  /show\s+api\s+key/i
];

/**
 * Audit incoming creator message for prompt injection & jailbreak attempts
 */
export function sanitizeAndAuditInput({ creatorMessage, dealId, creatorName, campaignId }) {
  if (!creatorMessage || typeof creatorMessage !== 'string') {
    return { isClean: true, sanitizedMessage: '' };
  }

  // Check against jailbreak regex patterns
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(creatorMessage)) {
      console.warn(`🚨 [Security Shield] Prompt Injection Attack Detected from "${creatorName}" (Deal: ${dealId}): "${creatorMessage}"`);

      // Create CRITICAL Risk Escalation Ticket for Human Security Audit
      createEscalationTicket({
        dealId,
        campaignId,
        agentName: 'Anti-Jailbreak Security Shield',
        riskLevel: 'CRITICAL',
        title: 'Security Violation: Prompt Injection / Jailbreak Attack Detected',
        description: `Creator "${creatorName}" submitted a suspicious message attempting to override AI instructions or extract internal parameters. Input pattern matched: ${pattern.toString()}`,
        policyViolated: 'Security.AntiJailbreakProtection=STRICT',
        proposedAction: 'Block automated AI response, flag creator account for manual human review'
      }).catch(err => console.error('[Security Shield] Failed to create escalation ticket:', err.message));

      return {
        isClean: false,
        sanitizedMessage: '[SECURITY VIOLATION DETECTED: Automated AI response blocked due to prompt injection attempt.]',
        violationReason: `Matched jailbreak pattern: ${pattern.toString()}`
      };
    }
  }

  return {
    isClean: true,
    sanitizedMessage: creatorMessage
  };
}

/**
 * Post-process AI response output to prevent accidental leak of internal secrets or budget caps
 */
export function sanitizeAiOutputResponse({ aiResponseText, maxBudgetCap }) {
  if (!aiResponseText || typeof aiResponseText !== 'string') {
    return aiResponseText;
  }

  let sanitized = aiResponseText;

  // Mask internal budget cap references if leaked by LLM
  if (maxBudgetCap) {
    const capRegex = new RegExp(`(max(imum)?\\s*budget|internal\\s*cap|ceiling|limit)\\s*(is|of)?\\s*₹?\\s*${maxBudgetCap}`, 'gi');
    sanitized = sanitized.replace(capRegex, '[Confidential Slot Pricing]');
  }

  // Remove potential system prompt leakage
  sanitized = sanitized.replace(/(You are an AI|My system prompt is|According to my instructions|I am programmed to)/gi, 'Our brand policy specifies');

  return sanitized;
}
