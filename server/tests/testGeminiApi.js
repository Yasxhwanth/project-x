import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('./server/.env') });

import { processRealAiNegotiation } from '../services/realAiNegotiator.js';

async function testGeminiKey() {
  console.log("--------------------------------------------------");
  console.log("🧪 Testing Real Google Gemini API Integration...");
  console.log("API Key loaded from environment:", process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 8)}...` : 'MISSING');
  console.log("--------------------------------------------------");

  const dummyCampaign = {
    brandName: "boAt Lifestyle",
    productName: "boAt Airdopes Pro Max 500",
    maxBudgetPerCreator: 50000,
    promoCode: "SAVER20"
  };

  const dummyDeal = {
    creatorName: "FitWithPriya",
    currentAgreedPrice: 40000,
    status: "NEGOTIATING"
  };

  const creatorMessage = "Hey team! I loved the product concept. My rate for 1 Reel + 2 Stories is ₹48,000. Let me know if we can lock this deal!";

  try {
    const result = await processRealAiNegotiation({
      campaign: dummyCampaign,
      deal: dummyDeal,
      creatorMessage,
      organization: { id: 'org_boat_01', sender_name: 'boAt Marketing AI' }
    });

    console.log("✅ [Gemini API Test Success]");
    console.log("Status Transition:", result.newStatus);
    console.log("New Agreed Price: ₹" + (result.newAgreedPrice ? result.newAgreedPrice.toLocaleString('en-IN') : 'N/A'));
    console.log("\nGenerated Real Gemini AI Email Reply:\n--------------------------------------------------");
    console.log(result.replyMessage?.body || result.aiReplyText);
    console.log("--------------------------------------------------");
  } catch (err) {
    console.error("❌ Gemini API Test Error:", err);
  }
}

testGeminiKey();
