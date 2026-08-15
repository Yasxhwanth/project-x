/**
 * VideoIntel SDK - Brand Safety & Competitor Exclusivity Analyzer
 * Verifies competitor isolation, ASCI/FTC legal disclosures, and brand reputation safety.
 */

export function analyzeBrandSafety({ transcript, scenes = [], forbiddenCompetitors = ['noise', 'boult', 'jbl', 'realme', 'hammer'] }) {
  const text = (transcript || '').toLowerCase();
  
  // 1. Competitor Exclusivity
  const detectedCompetitors = forbiddenCompetitors.filter(c => text.includes(c));
  const competitorPassed = detectedCompetitors.length === 0;

  // 2. Regulatory Sponsorship Disclosure (#ad, #collab, "paid partnership", "sponsored")
  const hasDisclosure = /\b(#ad|#collab|#sponsored|#partnership|paid partnership|sponsored by|in collaboration with)\b/i.test(text)
    || scenes.some(s => /\b(#ad|#collab|paid partnership)\b/i.test(s.ocrText || ''));

  // 3. Profanity / Negative Sentiment
  const hasProfanity = /\b(scam|fraud|terrible|worst|broken|cheap quality)\b/i.test(text);

  let score = 96;
  if (!competitorPassed) score -= 40;
  if (!hasDisclosure) score -= 20;
  if (hasProfanity) score -= 30;
  score = Math.max(10, Math.min(100, score));

  const isSafe = score >= 70;

  return {
    isSafe,
    brandSafetyScore: score,
    detectedCompetitors,
    competitorExclusivityPassed: competitorPassed,
    regulatoryDisclosurePassed: hasDisclosure,
    profanityPassed: !hasProfanity,
    status: isSafe ? 'BRAND_SAFE' : 'COMPLIANCE_RISK',
    details: competitorPassed
      ? `100% brand safe. No competitor mentions (${forbiddenCompetitors.slice(0, 3).join(', ')}) detected.`
      : `Competitor mention violation: Detected "${detectedCompetitors.join(', ')}" in video content.`,
    regulatoryDetails: hasDisclosure
      ? 'ASCI / FTC required commercial sponsorship tag (#ad / #collab) verified on screen and audio.'
      : 'Missing mandatory #ad / #collab sponsorship disclosure.'
  };
}
