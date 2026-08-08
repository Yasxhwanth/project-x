import { getIntegrationSecret } from '../database/sqliteDb.js';

/**
 * Real LLM AI Email Negotiation Engine (Powered by Google Gemini API & OpenAI fallback)
 */
export async function processRealAiNegotiation({ campaign, deal, creatorMessage, organization }) {
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

  const promptText = `You are ${senderName}, the Autonomous AI Influencer Marketing Manager for ${brandName} in India.
Your goal is to autonomously negotiate a commercial influencer deal with ${deal.creatorName} for promoting ${productName}.

AGENT ACTIVE SKILLS SUITE:
1. [SKILL: Sec 194J Indian Tax Compliance]
   - Under Section 194J of the Indian Income Tax Act, calculate and explain the 10% TDS deduction on gross agreed fee.
   - Show exact calculation: Gross Fee, 10% TDS withholding, and Net Instant UPI Transfer upon VideoDB approval.

2. [SKILL: Hinglish Rate & Counter-Offer Negotiation]
   - Campaign Max Budget Ceiling per Creator: ₹${maxBudget.toLocaleString('en-IN')}.
   - Currently Offered Price: ₹${currentPrice.toLocaleString('en-IN')}.
   - If creator requests an amount above ₹${maxBudget.toLocaleString('en-IN')}, explain budget limits, counter with maximum allowed (₹${maxBudget.toLocaleString('en-IN')}), and offer complimentary ${productName} product gifting + unboxing.
   - If creator rate is <= ₹${maxBudget.toLocaleString('en-IN')}, accept and lock the rate.

3. [SKILL: Mandatory Deliverables & VideoDB Audit]
   - Require 1 Instagram Reel / YouTube Integration featuring ${productName}.
   - Spoken mandatory phrase requirement: "${campaign.mandatoryPhrases || 'Use code SAVER20 for 20% off'}".
   - Mention automated VideoDB AI multimodal compliance audit before escrow release.

4. [SKILL: Conversational Indian Brand Tone]
   - Warm, natural Indian business tone (Hinglish/English mix when appropriate, e.g., "Namaste", "Best regards").

Creator's Incoming Message: "${creatorMessage}"

Respond directly with a clear, concise, professional email message.`;

  // 1. Google Gemini API Call (Free Tier)
  if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
    const modelsToTry = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
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

  // 3. No Dummy Fallbacks — Throw explicit error if AI Key is missing or failed
  if (!aiReplyText) {
    throw new Error(
      "Google Gemini AI API Key is unconfigured or failed to generate a response. Please add a valid GEMINI_API_KEY in Organization Settings or server/.env."
    );
  }

  const replyMessageObj = {
    id: "msg_ai_" + Date.now(),
    sender: "BRAND_AI",
    senderName,
    recipientName: deal.creatorName,
    body: aiReplyText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    intent: isAcceptance ? "AGREEMENT_CONFIRMATION" : "AI_REPLY"
  };

  return {
    replyMessage: replyMessageObj,
    newStatus,
    newAgreedPrice
  };
}
