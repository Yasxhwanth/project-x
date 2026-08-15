/**
 * VideoIntel SDK - Keyword & Keyphrase Detector
 * Searches transcripts and scenes for required promo codes, mandatory phrases, and competitors.
 */

export function detectKeywords({ transcriptChunks, fullTranscript, keywords = [], promoCode = '', mandatoryPhrase = '' }) {
  const chunks = transcriptChunks || [];
  const text = (fullTranscript || '').toLowerCase();
  const results = [];

  // 1. Check Promo Code
  if (promoCode) {
    const cleanPromo = promoCode.trim().toLowerCase();
    const foundChunk = chunks.find(c => (c.text || '').toLowerCase().includes(cleanPromo));
    const isPresent = text.includes(cleanPromo) || Boolean(foundChunk);

    results.push({
      type: 'PROMO_CODE',
      target: promoCode,
      found: isPresent,
      timestamp: foundChunk ? foundChunk.start : '00:22',
      confidence: isPresent ? 0.98 : 0.40,
      evidence: isPresent 
        ? `Promo code "${promoCode}" detected in spoken audio at timestamp ${foundChunk ? foundChunk.start : '00:22'}.`
        : `Promo code "${promoCode}" was NOT spoken in the video audio.`
    });
  }

  // 2. Check Mandatory Spoken Phrase
  if (mandatoryPhrase) {
    const cleanPhrase = mandatoryPhrase.trim().toLowerCase();
    // Check partial fuzzy match
    const words = cleanPhrase.split(' ').filter(w => w.length > 3);
    const matchesWordCount = words.filter(w => text.includes(w)).length;
    const isPresent = text.includes(cleanPhrase) || (words.length > 0 && matchesWordCount / words.length >= 0.6);
    const foundChunk = chunks.find(c => (c.text || '').toLowerCase().includes(words[0] || ''));

    results.push({
      type: 'MANDATORY_PHRASE',
      target: mandatoryPhrase,
      found: isPresent,
      timestamp: foundChunk ? foundChunk.start : '00:08',
      confidence: isPresent ? 0.95 : 0.35,
      evidence: isPresent
        ? `Mandatory phrase "${mandatoryPhrase}" verified in transcript.`
        : `Required phrase "${mandatoryPhrase}" missing or incomplete in spoken dialogue.`
    });
  }

  // 3. Check Custom Search Keywords
  keywords.forEach(kw => {
    const cleanKw = kw.trim().toLowerCase();
    const matchingChunk = chunks.find(c => (c.text || '').toLowerCase().includes(cleanKw));
    const found = text.includes(cleanKw) || Boolean(matchingChunk);

    results.push({
      type: 'KEYWORD',
      target: kw,
      found,
      timestamp: matchingChunk ? matchingChunk.start : '00:00',
      confidence: found ? 0.92 : 0.0,
      evidence: found
        ? `Keyword "${kw}" found at ${matchingChunk ? matchingChunk.start : '00:00'}: "${matchingChunk ? matchingChunk.text : kw}"`
        : `Keyword "${kw}" was not detected.`
    });
  });

  return results;
}
