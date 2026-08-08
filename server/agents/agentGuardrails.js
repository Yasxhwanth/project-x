/**
 * Central Guardrails Policy Registry & Permission Matrix for Project X Agents
 */

export const AGENT_GUARDRAILS = {
  "Campaign Strategy Agent": {
    canAutoApproveStrategy: true,
    maxTotalCampaignBudget: 10000000, // ₹1 Crore
    minCreatorsCount: 1,
    maxCreatorsCount: 200
  },
  "Discovery Agent": {
    minBrandSafetyScore: 90,
    minAuthenticityScore: 85,
    excludeCompetitorWindowDays: 90
  },
  "Outreach Agent": {
    autoSendPitches: true,
    requireTemplateValidation: true
  },
  "Negotiation Agent": {
    maxAutoNegotiablePrice: 25000, // INR ₹25,000 max auto-approval ceiling
    maxBudgetCapMultiplier: 1.0,   // Cannot exceed campaign max budget per creator
    allowDeliverableAlteration: false, // Cannot alter mandatory spoken phrases or usage rights
    escalateToHumanIf: [
      "COUNTER_OFFER_EXCEEDS_AUTO_CEILING",
      "COUNTER_OFFER_EXCEEDS_BUDGET_CAP",
      "EXCLUSIVITY_CLAUSE_MODIFICATION",
      "USAGE_RIGHTS_ALTERATION",
      "PAYMENT_TERMS_CHANGE"
    ]
  },
  "Onboarding Agent": {
    autoLockContracts: true,
    autoDeliverBriefs: true
  },
  "Content QA Agent": {
    minPassingComplianceScore: 80,
    requireSpokenPhrase: true,
    requirePromoCode: true,
    requireVisualLogo: true,
    escalateToHumanIf: [
      "COMPLIANCE_SCORE_BELOW_80",
      "SPOKEN_PHRASE_MISSING",
      "BRAND_SAFETY_VIOLATION"
    ]
  },
  "Optimization Agent": {
    minConfidenceForAutoReallocate: 0.90, // 90% confidence required
    maxAutoBudgetShift: 100000, // ₹1 Lakh max shift
    requireHumanApprovalForShiftAbove: 50000 // Shift > ₹50K needs 1-click human confirmation
  },
  "Reporting Agent": {
    autoGenerateExecSummaries: true
  }
};

/**
 * Validate Negotiation Counter-Offer against Guardrails
 */
export function validateNegotiationGuardrails({ requestedRate, maxBudgetCap, creatorName, dealId }) {
  const policy = AGENT_GUARDRAILS["Negotiation Agent"];
  
  if (requestedRate > policy.maxAutoNegotiablePrice || requestedRate > maxBudgetCap) {
    return {
      canAutoApprove: false,
      escalationRequired: true,
      reason: requestedRate > maxBudgetCap
        ? `Requested rate ₹${requestedRate.toLocaleString('en-IN')} exceeds campaign ceiling ₹${maxBudgetCap.toLocaleString('en-IN')}`
        : `Requested rate ₹${requestedRate.toLocaleString('en-IN')} exceeds auto-negotiation policy cap of ₹${policy.maxAutoNegotiablePrice.toLocaleString('en-IN')}`,
      escalationTicket: {
        dealId,
        creatorName,
        requestedRate,
        maxAllowedRate: Math.min(policy.maxAutoNegotiablePrice, maxBudgetCap),
        actorAgent: "Negotiation Agent"
      }
    };
  }

  return {
    canAutoApprove: true,
    escalationRequired: false,
    reason: `Rate ₹${requestedRate.toLocaleString('en-IN')} within automated approval threshold`
  };
}
