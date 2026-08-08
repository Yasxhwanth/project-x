/**
 * AI Email Negotiation Service (Indian Brands & Creators)
 * Handles INR pricing, Hinglish dialogue, GST queries, and TDS tax rules.
 */

export function processCreatorEmailResponse({ campaign, deal, creatorMessage }) {
  const lowerMsg = creatorMessage.toLowerCase();
  const currentPrice = deal.currentAgreedPrice || deal.offeredPrice;
  const budgetCap = campaign.maxBudgetPerCreator || Math.round(deal.offeredPrice * 1.25);

  let aiIntent = "GENERAL_INQUIRY";
  let newStatus = deal.status;
  let newAgreedPrice = currentPrice;
  let replyBody = "";

  // Scenario 1: Creator accepts the deal
  if (
    lowerMsg.includes("accept") ||
    lowerMsg.includes("done") ||
    lowerMsg.includes("pakka") ||
    lowerMsg.includes("deal") ||
    lowerMsg.includes("let's do it") ||
    lowerMsg.includes("send agreement") ||
    lowerMsg.includes("bhai done") ||
    lowerMsg.includes("ok")
  ) {
    aiIntent = "DEAL_ACCEPTED";
    newStatus = "AGREED";
    replyBody = `Namaste ${deal.creatorName},\n\nAwesome! We are excited to collaborate with you for the ${campaign.productName} campaign.\n\nHere are the locked campaign parameters:\n- Agreed Deliverable Fee: ₹${currentPrice.toLocaleString('en-IN')}\n- Mandatory Spoken Phrase: "${campaign.mandatoryPhrases}"\n- Promo Code / Link: ${campaign.promoCode || "DISCOUNT20"}\n- Payment Rail: UPI Auto-Payout / Razorpay Escrow (Includes 10% TDS deduction under Sec 194J)\n\nOnce your video is live on ${deal.platform}, please submit the video URL. Our VideoDB AI will index the audio & visual frames and trigger your instant Razorpay/UPI payout upon verification!\n\nWarm regards,\n${campaign.brandName} AI Marketing Agent`;
  }
  // Scenario 2: Counter-offer / price increase request in INR / Hinglish
  else if (
    lowerMsg.includes("₹") ||
    lowerMsg.includes("rs") ||
    lowerMsg.includes("rupees") ||
    lowerMsg.includes("k") ||
    lowerMsg.includes("rate") ||
    lowerMsg.includes("budget") ||
    lowerMsg.includes("extra") ||
    lowerMsg.includes("more")
  ) {
    aiIntent = "COUNTER_OFFER";
    
    // Extract price if possible
    const priceMatch = creatorMessage.match(/(?:₹|rs\.?|inr)?\s*(\d{2,6})\s*k?/i);
    let requestedPrice = currentPrice;
    if (priceMatch) {
      let val = parseInt(priceMatch[1], 10);
      if (val < 1000 && lowerMsg.includes('k')) val *= 1000;
      requestedPrice = val;
    } else {
      requestedPrice = Math.round(currentPrice * 1.2);
    }

    if (requestedPrice <= budgetCap) {
      newAgreedPrice = requestedPrice;
      newStatus = "AGREED";
      replyBody = `Hi ${deal.creatorName},\n\nThanks for your reply! Considering your strong reach in ${deal.location || "India"}, we can accept your revised rate of ₹${requestedPrice.toLocaleString('en-IN')}.\n\nDeliverable Terms:\n- Agreed Fee: ₹${requestedPrice.toLocaleString('en-IN')}\n- Deliverable: Dedicated review featuring "${campaign.mandatoryPhrases}" and product placement.\n\nPlease confirm your UPI ID or Bank account details so we can lock this deal and dispatch your sample unit!\n\nBest regards,\n${campaign.brandName} AI Negotiator`;
    } else {
      const counterOfferPrice = Math.min(budgetCap, Math.round((currentPrice + requestedPrice) / 2));
      newAgreedPrice = counterOfferPrice;
      newStatus = "NEGOTIATING";
      replyBody = `Hi ${deal.creatorName},\n\nThank you for reaching out! While ₹${requestedPrice.toLocaleString('en-IN')} is slightly above our fixed campaign ceiling, we really like your audience engagement. The best we can offer for this campaign is ₹${counterOfferPrice.toLocaleString('en-IN')}.\n\nWould ₹${counterOfferPrice.toLocaleString('en-IN')} work for you? We will also provide priority shipping for the sample product.\n\nBest regards,\n${campaign.brandName} AI Negotiator`;
    }
  }
  // Scenario 3: Question about GST, sample shipping, or guidelines
  else if (
    lowerMsg.includes("gst") ||
    lowerMsg.includes("tds") ||
    lowerMsg.includes("sample") ||
    lowerMsg.includes("shipping") ||
    lowerMsg.includes("courier") ||
    lowerMsg.includes("talking points") ||
    lowerMsg.includes("script")
  ) {
    aiIntent = "TAX_PRODUCT_INQUIRY";
    newStatus = "NEGOTIATING";
    replyBody = `Hi ${deal.creatorName},\n\nRegarding your query:\n- GST & Taxes: GST (18%) is added on top if you provide a valid GSTIN. 10% TDS will be deducted as per Section 194J and form 16A will be issued.\n- Product Courier: Shipped via BlueDart/Delhivery express courier within 24 hours of deal lock.\n- Spoken Requirements: Include "${campaign.mandatoryPhrases}" in Hindi/English.\n\nLet us know if you're ready to proceed at ₹${currentPrice.toLocaleString('en-IN')}!\n\nBest regards,\n${campaign.brandName} AI Negotiator`;
  }
  // Fallback AI response
  else {
    aiIntent = "GENERAL_REPLY";
    newStatus = "NEGOTIATING";
    replyBody = `Namaste ${deal.creatorName},\n\nThank you for your message regarding the ${campaign.productName} campaign!\n\nQuick Summary of terms:\n- Product: ${campaign.productName}\n- Proposed Fee: ₹${currentPrice.toLocaleString('en-IN')}\n- Deliverable: Dedicated integration featuring promo code "${campaign.promoCode || "DISCOUNT20"}"\n\nPlease let us know if these terms work for you so we can proceed!\n\nBest regards,\n${campaign.brandName} AI Negotiator`;
  }

  return {
    aiIntent,
    newStatus,
    newAgreedPrice,
    replyMessage: {
      id: "msg_" + Date.now(),
      sender: "BRAND_AI",
      senderName: `${campaign.brandName} AI Negotiator`,
      recipientName: deal.creatorName,
      body: replyBody,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intent: aiIntent
    }
  };
}
