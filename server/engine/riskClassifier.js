/**
 * Risk Classifier — Correction 3
 *
 * Pure deterministic function. No I/O, no LLM.
 * LLM proposes. Deterministic policy engine authorizes.
 *
 * Every agent action is classified before execution.
 * The classification determines whether autonomous execution is permitted.
 */

export const RISK_LEVELS = {
  LOW:      'LOW',
  MEDIUM:   'MEDIUM',
  HIGH:     'HIGH',
  CRITICAL: 'CRITICAL'
};

const AUTO_APPROVAL_CEILING = 25000;   // ₹25,000
const BUDGET_SHIFT_MEDIUM_MAX = 50000; // ₹50,000

/**
 * Classify an agent action by risk level.
 *
 * @param {object} options
 * @param {string} options.actionType       - e.g. 'NEGOTIATION', 'PAYMENT', 'BUDGET_SHIFT', 'CONTENT_APPROVAL'
 * @param {number} options.financialAmount  - INR amount involved (0 if N/A)
 * @param {boolean} options.hasLegalClause  - whether the action involves a legal/contractual change
 * @param {string[]} options.brandRiskSignals - e.g. ['COMPETITOR_MENTION', 'NSFW_SIGNAL']
 * @returns {{ riskLevel: string, requiresHumanApproval: boolean, justification: string }}
 */
export function classify({ actionType, financialAmount = 0, hasLegalClause = false, brandRiskSignals = [] }) {
  // Legal clause changes always HIGH regardless of amount
  if (hasLegalClause) {
    return {
      riskLevel: RISK_LEVELS.HIGH,
      requiresHumanApproval: true,
      justification: `Legal clause modification detected. All contract changes require human authorization.`
    };
  }

  // Brand risk signals → HIGH
  if (brandRiskSignals.length > 0) {
    return {
      riskLevel: RISK_LEVELS.HIGH,
      requiresHumanApproval: true,
      justification: `Brand risk signals detected: ${brandRiskSignals.join(', ')}. Human review required.`
    };
  }

  switch (actionType) {
    case 'NEGOTIATION':
      if (financialAmount <= AUTO_APPROVAL_CEILING) {
        return {
          riskLevel: RISK_LEVELS.LOW,
          requiresHumanApproval: false,
          justification: `Negotiation ₹${financialAmount.toLocaleString('en-IN')} within automated authority (≤ ₹${AUTO_APPROVAL_CEILING.toLocaleString('en-IN')}).`
        };
      }
      if (financialAmount <= 100000) {
        return {
          riskLevel: RISK_LEVELS.MEDIUM,
          requiresHumanApproval: true,
          justification: `Negotiation ₹${financialAmount.toLocaleString('en-IN')} exceeds automated ceiling. Human approval required.`
        };
      }
      return {
        riskLevel: RISK_LEVELS.HIGH,
        requiresHumanApproval: true,
        justification: `Negotiation ₹${financialAmount.toLocaleString('en-IN')} is a high-value agreement. Mandatory human authorization.`
      };

    case 'BUDGET_SHIFT':
      if (financialAmount <= BUDGET_SHIFT_MEDIUM_MAX) {
        return {
          riskLevel: RISK_LEVELS.MEDIUM,
          requiresHumanApproval: true,
          justification: `Budget reallocation of ₹${financialAmount.toLocaleString('en-IN')} requires human confirmation.`
        };
      }
      return {
        riskLevel: RISK_LEVELS.HIGH,
        requiresHumanApproval: true,
        justification: `Budget reallocation ₹${financialAmount.toLocaleString('en-IN')} exceeds ₹${BUDGET_SHIFT_MEDIUM_MAX.toLocaleString('en-IN')}. High-risk action.`
      };

    case 'PAYMENT':
      if (financialAmount > 100000) {
        return {
          riskLevel: RISK_LEVELS.CRITICAL,
          requiresHumanApproval: true,
          justification: `Payment ₹${financialAmount.toLocaleString('en-IN')} exceeds ₹1L. Requires dual authorization.`
        };
      }
      return {
        riskLevel: RISK_LEVELS.HIGH,
        requiresHumanApproval: true,
        justification: `All payments require human authorization regardless of amount. Separation of duties enforced.`
      };

    case 'CONTENT_APPROVAL':
      return {
        riskLevel: RISK_LEVELS.LOW,
        requiresHumanApproval: false,
        justification: `Content approval is within Content QA Agent autonomous authority (score ≥ 80% required).`
      };

    case 'CREATOR_SHORTLIST':
      return {
        riskLevel: RISK_LEVELS.LOW,
        requiresHumanApproval: false,
        justification: `Discovery Agent shortlisting is a non-financial autonomous operation.`
      };

    default:
      return {
        riskLevel: RISK_LEVELS.MEDIUM,
        requiresHumanApproval: true,
        justification: `Unknown action type '${actionType}'. Defaulting to MEDIUM risk with human approval.`
      };
  }
}
