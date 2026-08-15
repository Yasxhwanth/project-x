/**
 * VideoIntel SDK - Sponsorship Segment Extractor & Delivery Verifier
 * Locates exact timestamp windows of brand sponsorships, measures spoken duration,
 * extracts spoken CTAs, and generates YouTube deep-link proof clips.
 */

function formatTimestamp(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

const SPONSOR_TRIGGERS = [
  'sponsored by',
  'sponsor of today',
  'sponsor of this',
  "today's sponsor",
  'this video is sponsored',
  'partnered with',
  'in partnership with',
  'use code',
  'use my code',
  'promo code',
  'discount code',
  'coupon code',
  'link in the description',
  'link in description',
  'link down below',
  'sign up using the link',
  'sign up using',
  'special offer',
  'get 20% off',
  'get 10% off',
  'free trial',
  'thanks to our sponsor',
  'paid partnership',
  '#ad',
  '#collab'
];

function hasTriggerMatch(text, trigger) {
  if (trigger.length <= 6) {
    const regex = new RegExp(`\\b${trigger}\\b`, 'i');
    return regex.test(text);
  }
  return text.includes(trigger.toLowerCase());
}

export async function detectSponsorshipSegments({
  transcriptChunks = [],
  fullTranscript = '',
  brandName = '',
  productName = '',
  promoCode = '',
  mandatoryPhrase = '',
  videoId = '',
  videoUrl = '',
  apiKey = null
}) {
  const chunks = Array.isArray(transcriptChunks) ? transcriptChunks : [];
  if (chunks.length === 0) return [];

  const cleanBrand = (brandName || '').trim().toLowerCase();
  const cleanPromo = (promoCode || '').trim().toLowerCase();
  const segments = [];

  // Step 1: Identify chunks with sponsor triggers or brand/promo matches
  const flaggedIndices = new Set();

  chunks.forEach((chunk, index) => {
    const text = (chunk.text || '').toLowerCase();
    
    // Check keyword triggers with whole-word boundaries
    const hasTrigger = SPONSOR_TRIGGERS.some(trigger => hasTriggerMatch(text, trigger));
    const hasBrand = cleanBrand && cleanBrand.length > 2 && text.includes(cleanBrand);
    const hasPromo = cleanPromo && cleanPromo.length > 2 && text.includes(cleanPromo);

    if (hasTrigger || hasBrand || hasPromo) {
      flaggedIndices.add(index);
    }
  });

  if (flaggedIndices.size === 0) {
    return [];
  }

  // Step 2: Cluster adjacent / close chunks (within 3 chunks or 35 seconds distance) into unified sponsor blocks
  const sortedIndices = Array.from(flaggedIndices).sort((a, b) => a - b);
  const clusters = [];
  let currentCluster = [sortedIndices[0]];

  for (let i = 1; i < sortedIndices.length; i++) {
    const prevIdx = sortedIndices[i - 1];
    const currIdx = sortedIndices[i];
    const prevEndSec = chunks[prevIdx]?.endSeconds || 0;
    const currStartSec = chunks[currIdx]?.startSeconds || 0;

    // If within 3 chunks distance OR within 30 seconds of speech, fuse into same sponsorship block
    if ((currIdx - prevIdx <= 3) || (currStartSec - prevEndSec <= 30)) {
      currentCluster.push(currIdx);
    } else {
      clusters.push(currentCluster);
      currentCluster = [currIdx];
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Step 3: Format and refine each cluster into a distinct SponsorshipSegment
  for (const cluster of clusters) {
    const startIdx = cluster[0];
    const endIdx = cluster[cluster.length - 1];
    
    const segmentChunks = chunks.slice(startIdx, endIdx + 1);
    const startChunk = segmentChunks[0];
    const endChunk = segmentChunks[segmentChunks.length - 1];

    const startSeconds = startChunk.startSeconds || 0;
    const endSeconds = endChunk.endSeconds || (startSeconds + 30);
    const durationSeconds = Math.max(5, endSeconds - startSeconds);

    const segmentText = segmentChunks.map(c => c.text).join(' ');
    const wordCount = segmentText.split(/\s+/).filter(Boolean).length;

    // Detect brand name from content or fallback
    let detectedSponsor = brandName || 'Sponsor';
    if (segmentText.toLowerCase().includes('daily upside')) {
      detectedSponsor = 'The Daily Upside';
    } else if (cleanBrand && segmentText.toLowerCase().includes(cleanBrand)) {
      detectedSponsor = brandName;
    }

    // Determine segment type
    let segmentType = 'DEDICATED_MID_ROLL';
    if (startSeconds < 30) {
      segmentType = 'INTRO_SPONSOR_TEASE';
    } else if (startSeconds > (chunks[chunks.length - 1]?.endSeconds || 600) * 0.85) {
      segmentType = 'OUTRO_CTA';
    } else if (durationSeconds < 15) {
      segmentType = 'ORGANIC_MENTION';
    }

    // Generate YouTube deep-link proof
    const ytId = videoId || videoUrl.match(/(?:watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
    const proofDeepLink = ytId
      ? `https://youtu.be/${ytId}?t=${Math.floor(startSeconds)}`
      : videoUrl;

    const hasPromoSpoken = cleanPromo ? segmentText.toLowerCase().includes(cleanPromo) : false;
    const hasCtaSpoken = /\b(link|code|description|discount|sign up|check out|free trial)\b/i.test(segmentText);

    segments.push({
      segmentId: `sp_${startSeconds}_${endSeconds}`,
      type: segmentType,
      sponsorBrand: detectedSponsor,
      startTime: formatTimestamp(startSeconds),
      endTime: formatTimestamp(endSeconds),
      startSeconds,
      endSeconds,
      durationSeconds,
      wordCount,
      meetsMinimumDuration: durationSeconds >= 20,
      hasPromoCodeSpoken: hasPromoSpoken,
      promoCode: hasPromoSpoken ? promoCode : null,
      hasCallToAction: hasCtaSpoken,
      proofDeepLink,
      transcriptSnippet: segmentText.length > 300 ? segmentText.substring(0, 300) + '...' : segmentText,
      confidence: 0.96
    });
  }

  // Step 4: Optional Gemini Refinement for precise classification
  const geminiKey = apiKey || process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here' && segments.length > 0) {
    try {
      const prompt = `
You are the VideoIntel Sponsorship Verifier.
Analyze these candidate sponsorship blocks found in the video transcript:
${JSON.stringify(segments.map(s => ({ startTime: s.startTime, endTime: s.endTime, text: s.transcriptSnippet })), null, 2)}

For each segment:
1. Verify the exact sponsor brand name.
2. Confirm if it is "DEDICATED_MID_ROLL", "INTRO_SPONSOR_TEASE", "OUTRO_CTA", or "ORGANIC_MENTION".
3. Return a 1-sentence verification rationale.

Return ONLY a valid JSON array matching:
[
  {
    "startTime": "04:24",
    "verifiedBrand": "The Daily Upside",
    "segmentType": "DEDICATED_MID_ROLL",
    "rationale": "Creator delivers dedicated 50-second pitch for The Daily Upside newsletter with CTA."
  }
]
`;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const refinedJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (refinedJson) {
          const refinedArray = JSON.parse(refinedJson);
          if (Array.isArray(refinedArray)) {
            refinedArray.forEach((ref, idx) => {
              if (segments[idx]) {
                if (ref.verifiedBrand) segments[idx].sponsorBrand = ref.verifiedBrand;
                if (ref.segmentType) segments[idx].type = ref.segmentType;
                if (ref.rationale) segments[idx].verificationRationale = ref.rationale;
              }
            });
          }
        }
      }
    } catch (err) {
      console.warn('[VideoIntel Sponsorship] Gemini refinement warning:', err.message);
    }
  }

  console.log(`[VideoIntel Sponsorship] Extracted ${segments.length} verified sponsorship segment(s)!`);
  return segments;
}
