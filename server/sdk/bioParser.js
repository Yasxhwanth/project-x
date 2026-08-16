/**
 * 🧠 Bio Parser Utility
 * Extracts real emails, links, location hints, and niches from creator bio text.
 * Used by CreatorScraperSDK and RealScraperEngine.
 */

// Regex to extract email addresses from any text
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Regex to extract URLs (linktree, taplink, beacons, personal websites)
const URL_REGEX = /https?:\/\/[^\s"'<>]+/g;

// Regex to extract Linktree, Taplink, Beacons links specifically
const COLLAB_LINK_REGEX = /(?:linktr\.ee|linktree\.com|taplink\.cc|beacons\.ai|bit\.ly|bio\.link|stan\.store|lnk\.bio|allmylinks\.com)\/[^\s"'<>]+/gi;

// Niche keyword map (keyword → niche label)
const NICHE_KEYWORDS = [
  { keywords: ['fashion', 'style', 'outfit', 'ootd', 'lookbook', 'clothing', 'wear', 'wardrobe', 'stylist', 'designer', 'luxury'], niche: 'Fashion & Style' },
  { keywords: ['beauty', 'makeup', 'skincare', 'cosmetic', 'glow', 'lipstick', 'foundation', 'skinroutine', 'glam'], niche: 'Beauty & Skincare' },
  { keywords: ['fitness', 'gym', 'workout', 'health', 'nutrition', 'yoga', 'bodybuilding', 'wellness', 'exercise', 'protein'], niche: 'Fitness & Health' },
  { keywords: ['food', 'recipe', 'cooking', 'chef', 'cuisine', 'restaurant', 'foodie', 'baking', 'eat', 'taste', 'kitchen'], niche: 'Food & Cooking' },
  { keywords: ['travel', 'explore', 'adventure', 'wanderlust', 'trip', 'vacation', 'vlog', 'destination', 'backpacker'], niche: 'Travel & Adventure' },
  { keywords: ['tech', 'gadget', 'review', 'unboxing', 'smartphone', 'laptop', 'coding', 'programming', 'ai', 'software', 'hardware', 'apple', 'samsung', 'oneplus'], niche: 'Tech & Gadgets' },
  { keywords: ['finance', 'invest', 'stock', 'trading', 'money', 'business', 'startup', 'entrepreneur', 'wealth', 'crypto'], niche: 'Finance & Business' },
  { keywords: ['comedy', 'funny', 'meme', 'humor', 'sketch', 'skit', 'entertainment', 'actor', 'actress', 'vine'], niche: 'Entertainment & Comedy' },
  { keywords: ['gaming', 'gamer', 'esports', 'playstation', 'xbox', 'stream', 'twitch', 'pubg', 'freefire', 'minecraft'], niche: 'Gaming' },
  { keywords: ['music', 'singer', 'rapper', 'musician', 'artist', 'band', 'album', 'song', 'beat', 'dj'], niche: 'Music & Arts' },
  { keywords: ['parenting', 'mom', 'dad', 'family', 'kids', 'baby', 'parent', 'child', 'pregnancy'], niche: 'Parenting & Family' },
  { keywords: ['education', 'learn', 'study', 'student', 'teacher', 'knowledge', 'upsc', 'exam', 'academic', 'tutorial'], niche: 'Education & Learning' },
  { keywords: ['sports', 'cricket', 'football', 'ipl', 'athlete', 'player', 'match', 'goal', 'score', 'tournament'], niche: 'Sports' },
  { keywords: ['automobile', 'car', 'bike', 'drive', 'motor', 'superbike', 'ev', 'vehicle', 'race', 'speed'], niche: 'Automotive' },
  { keywords: ['pet', 'dog', 'cat', 'animal', 'wildlife', 'veterinary'], niche: 'Pets & Animals' },
  { keywords: ['motivat', 'inspire', 'mindset', 'success', 'leadership', 'coaching', 'life', 'positive'], niche: 'Motivation & Lifestyle' },
];

// Location keyword map
const LOCATION_KEYWORDS = [
  { keywords: ['mumbai', 'bombay'], location: 'Mumbai, Maharashtra' },
  { keywords: ['delhi', 'new delhi', 'noida', 'gurgaon', 'gurugram'], location: 'Delhi NCR' },
  { keywords: ['bangalore', 'bengaluru'], location: 'Bengaluru, Karnataka' },
  { keywords: ['hyderabad', 'cyberabad'], location: 'Hyderabad, Telangana' },
  { keywords: ['chennai', 'madras'], location: 'Chennai, Tamil Nadu' },
  { keywords: ['kolkata', 'calcutta'], location: 'Kolkata, West Bengal' },
  { keywords: ['pune'], location: 'Pune, Maharashtra' },
  { keywords: ['jaipur', 'rajasthan'], location: 'Jaipur, Rajasthan' },
  { keywords: ['ahmedabad', 'gujarat'], location: 'Ahmedabad, Gujarat' },
  { keywords: ['lucknow', 'kanpur', 'uttar pradesh', 'up'], location: 'Uttar Pradesh' },
  { keywords: ['chandigarh', 'punjab', 'haryana'], location: 'Chandigarh' },
  { keywords: ['kerala', 'kochi', 'trivandrum', 'thrissur'], location: 'Kerala' },
  { keywords: ['kolkata'], location: 'Kolkata, West Bengal' },
  { keywords: ['india', 'bharat', 'desi', '🇮🇳'], location: 'India' },
  { keywords: ['usa', 'united states', 'america', 'new york', 'los angeles', 'california'], location: 'USA' },
  { keywords: ['uk', 'london', 'england', 'britain'], location: 'UK' },
  { keywords: ['dubai', 'uae', 'abu dhabi'], location: 'Dubai, UAE' },
  { keywords: ['canada', 'toronto', 'vancouver'], location: 'Canada' },
];

/**
 * Extract real email addresses from bio text.
 * Returns null if none found.
 */
export function extractEmailFromBio(bio) {
  if (!bio) return null;
  const matches = bio.match(EMAIL_REGEX);
  if (!matches || matches.length === 0) return null;
  // Filter out common false positives like example@domain and suspicious ones
  const filtered = matches.filter(e => {
    const lower = e.toLowerCase();
    return !lower.includes('example.') && !lower.includes('@domain') && !lower.includes('@email');
  });
  return filtered[0] || null;
}

/**
 * Extract all URLs from bio text.
 * Returns [] if none found.
 */
export function extractUrlsFromBio(bio) {
  if (!bio) return [];
  const matches = bio.match(URL_REGEX) || [];
  return matches.slice(0, 3); // Return max 3 URLs
}

/**
 * Extract collab/contact links (linktree, taplink etc) from bio.
 * Returns null if none found.
 */
export function extractCollabLink(bio) {
  if (!bio) return null;
  // Check for full URL first
  const urls = extractUrlsFromBio(bio);
  for (const u of urls) {
    if (COLLAB_LINK_REGEX.test(u)) {
      COLLAB_LINK_REGEX.lastIndex = 0;
      return u;
    }
  }
  COLLAB_LINK_REGEX.lastIndex = 0;
  // Also check plain mention without https
  const plainMatch = bio.match(COLLAB_LINK_REGEX);
  if (plainMatch) return `https://${plainMatch[0]}`;
  return null;
}

/**
 * Detect creator niche from bio or video titles.
 * Returns best matching niche label or 'Creator & Influencer'.
 */
export function detectNiche(bio = '', name = '', extraText = '') {
  const combined = `${bio} ${name} ${extraText}`.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of NICHE_KEYWORDS) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (combined.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry.niche;
    }
  }

  return bestMatch || 'Creator & Influencer';
}

/**
 * Detect location from bio text.
 * Returns null if not detected.
 */
export function detectLocation(bio = '', name = '') {
  const combined = `${bio} ${name}`.toLowerCase();
  for (const entry of LOCATION_KEYWORDS) {
    for (const kw of entry.keywords) {
      if (combined.includes(kw)) return entry.location;
    }
  }
  return null;
}

/**
 * Compute a smarter estimated email for a creator.
 * Priority: extracted from bio > collab link hint > handle-based guess
 */
export function resolveEmail(bio, handle) {
  // 1. Try extracting real email from bio
  const bioEmail = extractEmailFromBio(bio);
  if (bioEmail) return { email: bioEmail, emailSource: 'bio' };

  // 2. Try deriving from collab link (e.g. linktr.ee/username → username@gmail.com hint)
  const collabLink = extractCollabLink(bio);
  if (collabLink) {
    const linkHandle = collabLink.split('/').pop().replace(/[^a-zA-Z0-9._-]/g, '');
    if (linkHandle.length > 2) {
      return { email: `${linkHandle}@gmail.com`, emailSource: 'linktree_derived', collabLink };
    }
  }

  // 3. Fallback to handle-based email
  const cleanHandle = handle?.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'creator';
  return { email: `business@${cleanHandle}.in`, emailSource: 'inferred', collabLink: null };
}

/**
 * Parse avatar URL — ensure it's absolute and valid.
 * Returns null if invalid.
 */
export function resolveAvatar(rawUrl) {
  if (!rawUrl) return null;
  const url = rawUrl.trim();
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return null;
}

/**
 * Full bio enrichment: runs all parsers and returns an enriched object.
 */
export function enrichFromBio({ bio = '', name = '', handle = '', extraText = '', existingLocation = null }) {
  const { email, emailSource, collabLink } = resolveEmail(bio, handle);
  const niche = detectNiche(bio, name, extraText);
  const detectedLocation = detectLocation(bio, name);
  const links = extractUrlsFromBio(bio);
  
  return {
    email,
    emailSource,
    collabLink: collabLink || null,
    niche,
    location: detectedLocation || existingLocation || 'India',
    bioLinks: links,
  };
}
