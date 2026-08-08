/**
 * Tano-Inspired Service Models & Pricing Engine for CreatorConnect AI
 */

export function getTanoPricingMatrix(serviceType = 'cpa') {
  const matrix = {
    cpa: {
      title: "Creator Partnership Ads (CPA)",
      description: "End-to-end paid Reels with Meta Ad usage rights & whitelisting permissions.",
      serviceFeeText: "₹8,500 – ₹15,000 per creator service fee + creator payout",
      tiers: [
        { tier: "Nano", range: "1K–10K Followers", creatorCost: "₹2,000 – ₹10,000", totalCost: "₹10,500 – ₹25,000" },
        { tier: "Micro", range: "10K–50K Followers", creatorCost: "₹10,000 – ₹45,000", totalCost: "₹18,500 – ₹60,000" },
        { tier: "Mid-Tier", range: "50K–250K Followers", creatorCost: "₹45,000 – ₹1,50,000", totalCost: "₹53,500 – ₹1,65,000" },
        { tier: "Macro", range: "250K–1M+ Followers", creatorCost: "₹1,50,000 – ₹5,00,000", totalCost: "₹1,65,000 – ₹5,15,000" }
      ]
    },
    gifting: {
      title: "Product Gifting Campaigns",
      description: "Source creators, ship product samples, and collect UGC video content.",
      serviceFeeText: "₹150 per creator gifted (Campaign scale: 20 – 500 creators)",
      tiers: [
        { tier: "Nano & Micro Gifting", range: "1K–50K Followers", creatorCost: "Free Product Gifting", totalCost: "₹150 service fee per creator" },
        { tier: "UGC Video Rights", range: "10K–100K Followers", creatorCost: "Product + ₹1,500 Token Fee", totalCost: "₹1,650 total per creator" }
      ]
    },
    affiliate: {
      title: "Affiliate Channel Management",
      description: "Recruit, onboard, and manage creator affiliate channel with ongoing monthly tracking.",
      serviceFeeText: "₹175 per creator per month (Programme scale: 10 – 1,000 creators)",
      tiers: [
        { tier: "Affiliate Creators", range: "1K–100K Followers", creatorCost: "10%–15% Sales Commission", totalCost: "₹175/mo + Sales Commission" }
      ]
    }
  };

  return matrix[serviceType] || matrix.cpa;
}

export function generateLlmsTxt() {
  return `# CreatorConnect AI — AI-Native Influencer Platform

> CreatorConnect AI is an AI-powered influencer marketing operating system built for Indian Brands, Agencies, and Creators.

## Core Capabilities
- **Creator Database & Scraper**: Search pre-populated Indian creators with K & M reach formatting and YouTube live search parsing.
- **AI Campaign Strategy Engine**: Dynamic creator portfolio optimization across Micro, Mid, and Macro tiers with CPM and ROI calculations.
- **Real LLM AI Negotiator**: Dynamic Hinglish & English email negotiation powered by Google Gemini API with 10% TDS Sec 194J tax withholding calculation.
- **VideoDB AI Audit**: Multimodal video verification with speech-to-text transcript matching and visual bounding box proof.
- **Razorpay UPI Payouts**: Instant net UPI settlement (PhonePe, GPay) with separation of duties and idempotency.

## REST API Endpoints
- GET /api/creators — Search creators by reach and budget
- POST /api/creators/scrape-instagram — Scrape/fetch Instagram profile (@handle)
- POST /api/campaigns/generate-strategy — Generate AI portfolio mix
- GET /api/analytics/summary — Campaign performance metrics
- POST /api/deals/:id/negotiate — Submit creator response to Gemini AI agent
- POST /api/deals/:id/verify-video — Run VideoDB AI speech & vision audit
- POST /api/deals/:id/payout — Execute Razorpay UPI payout (requires human PAYMENT_APPROVED state)
`;
}

export function generateAgentCardJson() {
  const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
  return {
    name: "CreatorConnect AI Agent",
    description: "AI-native influencer marketing agent for Indian brands, agencies, and creators.",
    version: "1.0.0",
    url: baseUrl,
    endpoints: {
      llmsTxt: `${baseUrl}/llms.txt`,
      llmsFullTxt: `${baseUrl}/llms-full.txt`,
      agentCard: `${baseUrl}/.well-known/agent-card.json`
    },
    capabilities: [
      "creator_sourcing",
      "hinglish_ai_negotiation",
      "videodb_video_audit",
      "sec194j_tds_tax_payouts",
      "tano_service_models"
    ]
  };
}
