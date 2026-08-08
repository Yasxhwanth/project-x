import { scraperSdk } from './scraperSdk.js';
import { getIntegrationSecret } from '../database/sqliteDb.js';

/**
 * Natural-Language AI Creator Search Service powered by Google Gemini API
 * Parses complex natural language prompts, applies multi-attribute matching,
 * and ranks creators with AI explanation notes.
 */
export async function searchCreatorsWithNaturalLanguage({ prompt, organizationId = 'org_boat_01' }) {
  if (!prompt || !prompt.trim()) {
    throw new Error('Search prompt cannot be empty');
  }

  const geminiApiKey = (organizationId && await getIntegrationSecret(organizationId, 'gemini')) || process.env.GEMINI_API_KEY;

  if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in server/.env. Natural-Language AI Creator Search requires a valid Gemini API key.');
  }

  // 1. Fetch baseline creators pool from scraper SDK / database
  const baselineCreators = await scraperSdk.searchCreators({ query: prompt, reachMax: 25000000, budgetMax: 500000 });

  // 2. Build Gemini prompt to parse natural language criteria & rank candidates
  const geminiPrompt = `
You are an expert Influencer Marketing AI Data Analyst.
Analyze the following natural-language creator search request from a brand manager:

USER PROMPT: "${prompt}"

CANDIDATE CREATORS POOL (${baselineCreators.length} creators):
${JSON.stringify(baselineCreators.map(c => ({
  id: c.id,
  handle: c.handle,
  name: c.name,
  niche: c.niche,
  platform: c.platform,
  followers: c.followers,
  engagementRate: c.engagementRate,
  pricePerPost: c.pricePerPost,
  city: c.city || c.location || 'India',
  bio: c.bio || ''
})), null, 2)}

TASK:
1. Parse the user prompt and extract:
   - "niche": Target content niche (e.g., Fitness, Tech, Fashion, Food, Lifestyle)
   - "platform": Target platform (Instagram, YouTube, or All)
   - "city": Target location/city if specified (e.g., Bangalore, Mumbai, Delhi, N/A)
   - "maxBudget": Maximum price per post in INR if specified, else null
   - "parsedSummary": Short 1-sentence summary of parsed intent.

2. Evaluate each creator against the prompt parameters. For each creator calculate:
   - "id": Creator ID matching the candidate list
   - "aiMatchScore": Number between 65 and 99 indicating match quality percentage
   - "aiMatchReason": One crisp sentence explaining why this creator matches the query
   - "aiHighlights": Array of 2-3 short badge labels (e.g. ["Bangalore Based", "Fitness Specialist", "Under ₹20k"])

3. Return ONLY a valid JSON object in the exact following structure without markdown formatting or code block backticks:
{
  "parsed": {
    "niche": "string",
    "platform": "string",
    "city": "string",
    "maxBudget": number_or_null,
    "parsedSummary": "string"
  },
  "rankedCreators": [
    {
      "id": "string",
      "aiMatchScore": number,
      "aiMatchReason": "string",
      "aiHighlights": ["string", "string"]
    }
  ]
}
`;

  const modelsToTry = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  let rawResponseText = '';

  for (const modelName of modelsToTry) {
    if (rawResponseText) break;
    try {
      console.log(`🔍 [AI Creator Search] Querying Google Gemini (${modelName})...`);
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
      
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }]
        })
      });

      const data = await res.json();
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        rawResponseText = data.candidates[0].content.parts[0].text.trim();
      }
    } catch (err) {
      console.warn(`[AI Creator Search] Model ${modelName} call failed:`, err.message);
    }
  }

  if (!rawResponseText) {
    throw new Error('Google Gemini API failed to parse search query.');
  }

  // Sanitize JSON response (strip markdown code fences if present)
  let cleanJsonText = rawResponseText.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  let aiParsed = null;
  try {
    aiParsed = JSON.parse(cleanJsonText);
  } catch (err) {
    console.error('[AI Creator Search] JSON parse error:', err.message, 'Raw text:', rawResponseText);
    throw new Error('Failed to parse AI search results format.');
  }

  // 3. Merge AI scores & reasoning into original candidate creator records
  const rankedMap = new Map((aiParsed.rankedCreators || []).map(item => [item.id, item]));

  const enrichedCreators = baselineCreators.map(c => {
    const aiMeta = rankedMap.get(c.id);
    return {
      ...c,
      matchScore: aiMeta?.aiMatchScore || c.matchScore || 85,
      aiMatchReason: aiMeta?.aiMatchReason || `Matches ${c.niche} creator profile with ${c.followersFormatted} reach.`,
      aiHighlights: aiMeta?.aiHighlights || [c.niche, c.platform, `₹${c.pricePerPost.toLocaleString('en-IN')}`]
    };
  }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  return {
    success: true,
    prompt,
    parsed: aiParsed.parsed || { parsedSummary: prompt },
    total: enrichedCreators.length,
    creators: enrichedCreators
  };
}
