import { getIntegrationSecret } from '../database/sqliteDb.js';
import { sanitizeAndAuditInput, sanitizeAiOutputResponse } from '../security/antiJailbreakShield.js';

/**
 * Real LLM AI Email Negotiation Engine (Powered by Google Gemini API & OpenAI fallback)
 */
export async function processRealAiNegotiation({ campaign, deal, creatorMessage, organization }) {
  // 🛡️ Security Check 1: Audit input for prompt injections & jailbreak attacks
  const securityCheck = sanitizeAndAuditInput({
    creatorMessage,
    dealId: deal.id,
    creatorName: deal.creatorName,
    campaignId: deal.campaignId
  });

  if (!securityCheck.isClean) {
    return {
      replyText: "Your response triggered our security policy audit. A brand manager has been notified to review your message manually.",
      newAgreedPrice: deal.currentAgreedPrice || deal.offeredPrice || 25000,
      newStatus: deal.status,
      escalationTriggered: true,
      securityBlocked: true
    };
  }

  const organizationId = organization?.id;
  const geminiApiKey = (organizationId && await getIntegrationSecret(organizationId, 'gemini')) || process.env.GEMINI_API_KEY || organization?.gmail_api_key;
  const openaiApiKey = (organizationId && await getIntegrationSecret(organizationId, 'openai')) || process.env.OPENAI_API_KEY;

  const currentPrice = deal.currentAgreedPrice || deal.offeredPrice || 45000;
  const maxBudget = campaign.maxBudgetPerCreator || 50000;
  const brandName = campaign.brandName || "boAt Lifestyle";
  const productName = campaign.productName || "boAt Airdopes Pro Max 500";
  const senderName = organization?.sender_name || `${brandName} Marketing AI`;

  let aiReplyText = "";
  let newStatus = deal.status;
  let newAgreedPrice = currentPrice;

  // Detect counter-offer numbers in creator message
  const numMatches = creatorMessage.match(/(\d+)\s*k|₹?\s*(\d{4,6})/gi);
  let requestedPrice = null;

  if (numMatches) {
    for (const match of numMatches) {
      if (match.toLowerCase().includes('k')) {
        const val = parseFloat(match) * 1000;
        if (val >= 10000 && val <= 500000) requestedPrice = val;
      } else {
        const val = parseInt(match.replace(/[^0-9]/g, ''), 10);
        if (val >= 10000 && val <= 500000) requestedPrice = val;
      }
    }
  }

  const isAcceptance = /deal|accept|agree|lock|let's do it|done|sounds good|send contract|happy to work/i.test(creatorMessage);

  const promptText = `You are ${senderName}, the Executive AI Influencer Marketing Director for ${brandName}.
Your goal is to negotiate a formal commercial influencer partnership with ${deal.creatorName} for promoting ${productName}.

TONE & COMMUNICATION REQUIREMENTS:
- Maintain a 100% polished, formal corporate executive tone in professional English.
- Avoid informal greetings, slang, or colloquialisms. Always address the creator professionally (e.g. "Dear ${deal.creatorName}").
- Present commercial figures clearly in INR (₹) with formal financial terminology.

CRITICAL FINANCIAL CONFIDENTIALITY GUARDRAILS:
- NEVER disclose, reveal, or mention internal campaign budget ceilings or maximum numbers (e.g. NEVER say "our max budget is ₹50,000" or "our internal cap is ₹X").
- Treat internal financial caps as strictly confidential brand trade secrets.
- When countering high creator rates, frame price limits around "approved commercial slot pricing", "allocated tier budgets", or "standard campaign fee guidelines".

AGENT DOMAIN KNOWLEDGE BASE & WORKFLOW MECHANICS:
- Brand Profile: ${brandName} is India's leading consumer tech audio & wearable brand. Product being promoted: ${productName}.
- Campaign Deliverables: 1 Instagram Reel or YouTube Shorts integration featuring ${productName}.
- Mandatory Spoken Phrase: "${campaign.mandatoryPhrases || 'Use code SAVER20 for 20% off'}".
- Platform Workflow Mechanics:
  1. Negotiation & Agreement Lock: Once deal fee is agreed, the state machine transitions to AGREED status.
  2. Free Product Gifting: Unit of ${productName} is shipped directly to creator's address for unboxing.
  3. VideoDB AI Multimodal Audit: Upon Reel submission, VideoDB AI audits logo visibility, spoken mandatory phrases, and brand safety scores (>= 80%).
  4. Escrow UPI Payout: Upon VideoDB AI audit pass, instant UPI escrow transfer is released.
- Tax & Legal Knowledge (Section 194J): Under Section 194J of the Indian Income Tax Act, 10% TDS (Tax Deducted at Source) is withheld from gross influencer payouts. Form 16A TDS certificates are issued quarterly for 26AS credit.

INTERNAL FINANCIAL AUTHORITY BOUNDARIES (CONFIDENTIAL — DO NOT DISCLOSE TO CREATOR):
- Max Ceiling for this Creator: ₹${maxBudget.toLocaleString('en-IN')}.
- Currently Offered Rate: ₹${currentPrice.toLocaleString('en-IN')}.
- If requested rate > ₹${maxBudget.toLocaleString('en-IN')}, counter with standard tier pricing (up to ₹${maxBudget.toLocaleString('en-IN')}) + complimentary ${productName} product gifting + unboxing.

AGENT ACTIVE SKILLS SUITE:
1. [SKILL: Confidential Negotiation Guardrails] Keep internal budget ceilings hidden. Negotiate tactfully using tier pricing & product gifting.
2. [SKILL: Sec 194J Tax Calculation] Compute Gross Fee, 10% TDS withholding, and Net Instant UPI Transfer.
3. [SKILL: VideoDB Multimodal Compliance Audit] Explain multimodal AI video audit requirements and instant UPI escrow release.

TONE & FORMATTING POLICY:
- ABSOLUTELY NO EMOJIS: Do NOT use any emojis anywhere in the email response body under any circumstances.
- FORMAL CORPORATE TONE: Maintain a highly professional, crisp, executive corporate brand tone at all times.

Creator's Incoming Message: "${creatorMessage}"

Compose a formal, sleek, highly professional corporate email response without any emojis or disclosure of internal budget limits.`;

  // 1. Google Gemini API Call (Free Tier)
  if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
    const modelsToTry = [
      'gemini-3.1-flash-lite-preview',
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-3.1-pro-preview',
      'gemini-pro-latest'
    ];
    for (const modelName of modelsToTry) {
      if (aiReplyText) break;
      try {
        console.log(`🤖 [Real AI Negotiator] Calling Google Gemini API (${modelName})...`);
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: promptText }]
            }]
          })
        });

        const data = await res.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          aiReplyText = candidateText;
          console.log(`✨ Google Gemini API (${modelName}) response generated successfully!`);
          break;
        }
      } catch (err) {
        console.error(`Gemini API (${modelName}) call failed:`, err.message);
      }
    }
  }

  // 2. OpenAI API Fallback
  if (!aiReplyText && openaiApiKey && openaiApiKey.startsWith('sk-')) {
    try {
      console.log("🤖 [Real AI Negotiator] Calling OpenAI Chat Completions API...");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: promptText }],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      const data = await res.json();
      if (data.choices && data.choices[0]?.message?.content) {
        aiReplyText = data.choices[0].message.content;
      }
    } catch (err) {
      console.error("OpenAI API call failed:", err);
    }
  }

  // 3. Intelligent Autonomous Fallback (Zero Downtime Guarantee)
  if (!aiReplyText) {
    console.log("⚡ [Real AI Negotiator] Generating contextual negotiation response via autonomous rule engine...");
    if (isAcceptance) {
      aiReplyText = `Dear ${deal.creatorName},\n\nThank you for accepting our collaboration proposal for ${productName}. We are excited to partner with you!\n\nDeal Summary:\n- Agreed Commercial Fee: ₹${currentPrice.toLocaleString('en-IN')}\n- Deliverable: 1 Dedicated Reel / Short integration\n- Mandatory Spoken Phrase: "${campaign.mandatoryPhrases || 'Use code SAVER20 for 20% off'}"\n- Tax Compliance: Net payout after Section 194J 10% TDS (₹${(currentPrice * 0.1).toLocaleString('en-IN')}) will be ₹${(currentPrice * 0.9).toLocaleString('en-IN')}.\n\nOur team is shipping your complimentary unit of ${productName}. Please share your delivery address so we can initiate dispatch immediately.\n\nWarm regards,\n${senderName}`;
      newStatus = 'AGREED';
      newAgreedPrice = currentPrice;
    } else if (requestedPrice && requestedPrice > maxBudget) {
      aiReplyText = `Dear ${deal.creatorName},\n\nThank you for sharing your rate breakdown. While we cannot meet ₹${requestedPrice.toLocaleString('en-IN')} due to allocated tier budget ceilings, we can offer our maximum tier cap of ₹${maxBudget.toLocaleString('en-IN')} along with a complimentary sample unit of ${productName}.\n\nDeliverable requirements remain 1 dedicated Reel including the spoken phrase: "${campaign.mandatoryPhrases || 'Use code SAVER20 for 20% off'}".\n\nPlease let us know if this works for you and we will lock the agreement.\n\nWarm regards,\n${senderName}`;
      newStatus = 'NEGOTIATING';
      newAgreedPrice = maxBudget;
    } else if (requestedPrice && requestedPrice <= maxBudget) {
      aiReplyText = `Dear ${deal.creatorName},\n\nWe have reviewed your proposed fee of ₹${requestedPrice.toLocaleString('en-IN')} and are pleased to accept this rate for the ${productName} campaign integration.\n\nSummary:\n- Agreed Commercial Fee: ₹${requestedPrice.toLocaleString('en-IN')}\n- TDS Withholding (Sec 194J 10%): ₹${(requestedPrice * 0.1).toLocaleString('en-IN')}\n- Net Payout: ₹${(requestedPrice * 0.9).toLocaleString('en-IN')}\n\nPlease reply with your shipping address to receive the product sample unit and kick off production.\n\nWarm regards,\n${senderName}`;
      newStatus = 'AGREED';
      newAgreedPrice = requestedPrice;
    } else {
      aiReplyText = `Dear ${deal.creatorName},\n\nThank you for your response regarding the ${productName} campaign collaboration. Our offered fee of ₹${currentPrice.toLocaleString('en-IN')} includes 1 dedicated Reel with the required spoken phrase "${campaign.mandatoryPhrases || 'Use code SAVER20 for 20% off'}" and complimentary product gifting.\n\nPlease let us know if you would like to proceed on these terms.\n\nWarm regards,\n${senderName}`;
      newStatus = 'NEGOTIATING';
      newAgreedPrice = currentPrice;
    }
  }

  const sanitizedReply = sanitizeAiOutputResponse({ aiResponseText: aiReplyText, maxBudgetCap: maxBudget });

  const replyMessageObj = {
    id: "msg_ai_" + Date.now(),
    sender: "BRAND_AI",
    senderName,
    recipientName: deal.creatorName,
    body: sanitizedReply,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    intent: isAcceptance ? "AGREEMENT_CONFIRMATION" : "AI_REPLY"
  };

  return {
    replyMessage: replyMessageObj,
    newStatus,
    newAgreedPrice
  };
}
