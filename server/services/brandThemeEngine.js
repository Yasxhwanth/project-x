/**
 * Brand Design Theme & Visual Identity Engine
 * Provides bespoke color schemes, hero gradients, taglines, and trust badges for each brand.
 */

// Curated Design System Palettes for Major Ecosystem Brands
const BRAND_THEMES = {
  'boat lifestyle': {
    brandName: 'boAt Lifestyle',
    slug: 'boat',
    tagline: 'Plug Into Nirvana • Audio & Wearables',
    badgeText: 'VERIFIED PROPOSAL • boAt NIRVANA',
    badgeColor: '#0f62fe',
    badgeBg: '#111d38',
    primaryColor: '#0f62fe',       // Electric Cyan Blue
    secondaryColor: '#ff003b',     // Sonic Red
    accentGlow: 'rgba(15, 98, 254, 0.25)',
    heroGradient: 'linear-gradient(180deg, #1c2b4a 0%, #161c28 100%)',
    heroBorder: '#0f62fe',
    cardBg: '#1a2233',
    cardBorder: '#28385e',
    btnBg: '#0f62fe',
    btnTextColor: '#ffffff',
    btnHover: '#0043ce',
    initials: 'boAt',
    fontCategory: 'cyber-audio'
  },
  'boat': {
    brandName: 'boAt Lifestyle',
    slug: 'boat',
    tagline: 'Plug Into Nirvana • Audio & Wearables',
    badgeText: 'VERIFIED PROPOSAL • boAt NIRVANA',
    badgeColor: '#0f62fe',
    badgeBg: '#111d38',
    primaryColor: '#0f62fe',
    secondaryColor: '#ff003b',
    accentGlow: 'rgba(15, 98, 254, 0.25)',
    heroGradient: 'linear-gradient(180deg, #1c2b4a 0%, #161c28 100%)',
    heroBorder: '#0f62fe',
    cardBg: '#1a2233',
    cardBorder: '#28385e',
    btnBg: '#0f62fe',
    btnTextColor: '#ffffff',
    btnHover: '#0043ce',
    initials: 'boAt',
    fontCategory: 'cyber-audio'
  },
  'mamaearth': {
    brandName: 'Mamaearth',
    slug: 'mamaearth',
    tagline: 'Goodness Inside • 100% Toxin-Free & Natural',
    badgeText: 'PLANT A TREE • PLASTIC POSITIVE',
    badgeColor: '#24a148',
    badgeBg: '#122619',
    primaryColor: '#198038',       // Botanical Green
    secondaryColor: '#00bfa5',     // Herbal Mint
    accentGlow: 'rgba(36, 161, 72, 0.25)',
    heroGradient: 'linear-gradient(180deg, #163321 0%, #112117 100%)',
    heroBorder: '#24a148',
    cardBg: '#172e1f',
    cardBorder: '#255234',
    btnBg: '#24a148',
    btnTextColor: '#ffffff',
    btnHover: '#198038',
    initials: 'ME',
    fontCategory: 'botanical-clean'
  },
  'cult.fit': {
    brandName: 'Cult.fit',
    slug: 'cultfit',
    tagline: 'We Are Cult • Be Better Everyday',
    badgeText: 'CULTPASS ELITE • ATHLETIC ROSTER',
    badgeColor: '#ff3278',
    badgeBg: '#33121f',
    primaryColor: '#ff3278',       // High-Energy Magenta
    secondaryColor: '#ff0055',     // Crimson Sprint
    accentGlow: 'rgba(255, 50, 120, 0.3)',
    heroGradient: 'linear-gradient(180deg, #3d1424 0%, #210d15 100%)',
    heroBorder: '#ff3278',
    cardBg: '#2b101c',
    cardBorder: '#5e1b38',
    btnBg: '#ff3278',
    btnTextColor: '#ffffff',
    btnHover: '#e01b60',
    initials: 'CULT',
    fontCategory: 'athletic-energy'
  },
  'cultfit': {
    brandName: 'Cult.fit',
    slug: 'cultfit',
    tagline: 'We Are Cult • Be Better Everyday',
    badgeText: 'CULTPASS ELITE • ATHLETIC ROSTER',
    badgeColor: '#ff3278',
    badgeBg: '#33121f',
    primaryColor: '#ff3278',
    secondaryColor: '#ff0055',
    accentGlow: 'rgba(255, 50, 120, 0.3)',
    heroGradient: 'linear-gradient(180deg, #3d1424 0%, #210d15 100%)',
    heroBorder: '#ff3278',
    cardBg: '#2b101c',
    cardBorder: '#5e1b38',
    btnBg: '#ff3278',
    btnTextColor: '#ffffff',
    btnHover: '#e01b60',
    initials: 'CULT',
    fontCategory: 'athletic-energy'
  },
  'the daily upside': {
    brandName: 'The Daily Upside',
    slug: 'dailyupside',
    tagline: 'Financial Intelligence • Wall Street Media',
    badgeText: 'WALL STREET AUDITED • EDITORIAL PARTNER',
    badgeColor: '#f1c21b',
    badgeBg: '#2c2412',
    primaryColor: '#f1c21b',       // Golden Amber
    secondaryColor: '#1b365d',     // Financial Navy
    accentGlow: 'rgba(241, 194, 27, 0.25)',
    heroGradient: 'linear-gradient(180deg, #2b281b 0%, #171c24 100%)',
    heroBorder: '#f1c21b',
    cardBg: '#1b222c',
    cardBorder: '#384457',
    btnBg: '#f1c21b',
    btnTextColor: '#161616',
    btnHover: '#d2a106',
    initials: 'TDU',
    fontCategory: 'editorial-finance'
  },
  'daily upside': {
    brandName: 'The Daily Upside',
    slug: 'dailyupside',
    tagline: 'Financial Intelligence • Wall Street Media',
    badgeText: 'WALL STREET AUDITED • EDITORIAL PARTNER',
    badgeColor: '#f1c21b',
    badgeBg: '#2c2412',
    primaryColor: '#f1c21b',
    secondaryColor: '#1b365d',
    accentGlow: 'rgba(241, 194, 27, 0.25)',
    heroGradient: 'linear-gradient(180deg, #2b281b 0%, #171c24 100%)',
    heroBorder: '#f1c21b',
    cardBg: '#1b222c',
    cardBorder: '#384457',
    btnBg: '#f1c21b',
    btnTextColor: '#161616',
    btnHover: '#d2a106',
    initials: 'TDU',
    fontCategory: 'editorial-finance'
  },
  'noise': {
    brandName: 'Noise',
    slug: 'noise',
    tagline: 'Listen to the Noise Within • Smart Wearables',
    badgeText: 'NOISE TECH PARTNERSHIP • OFFICIAL',
    badgeColor: '#be95ff',
    badgeBg: '#281a42',
    primaryColor: '#8a3ffc',       // Electric Iris Purple
    secondaryColor: '#00cec9',     // Tech Neon Cyan
    accentGlow: 'rgba(138, 63, 252, 0.3)',
    heroGradient: 'linear-gradient(180deg, #2d1b4a 0%, #191426 100%)',
    heroBorder: '#8a3ffc',
    cardBg: '#201930',
    cardBorder: '#45326b',
    btnBg: '#8a3ffc',
    btnTextColor: '#ffffff',
    btnHover: '#6929c4',
    initials: 'NOISE',
    fontCategory: 'tech-wearable'
  },
  'zepto': {
    brandName: 'Zepto',
    slug: 'zepto',
    tagline: '10-Minute Grocery Delivery Superfast',
    badgeText: 'EXPRESS Q-COMMERCE PARTNERSHIP',
    badgeColor: '#a56eff',
    badgeBg: '#2a1645',
    primaryColor: '#8c14fc',       // Speed Violet
    secondaryColor: '#ff7043',     // 10-Min Sunset Orange
    accentGlow: 'rgba(140, 20, 252, 0.3)',
    heroGradient: 'linear-gradient(180deg, #32164f 0%, #1f122e 100%)',
    heroBorder: '#8c14fc',
    cardBg: '#241438',
    cardBorder: '#532a85',
    btnBg: '#8c14fc',
    btnTextColor: '#ffffff',
    btnHover: '#6c0bc4',
    initials: 'ZEPTO',
    fontCategory: 'hyperlocal-speed'
  },
  'myntra': {
    brandName: 'Myntra',
    slug: 'myntra',
    tagline: 'India’s Trendiest Fashion Destination',
    badgeText: 'FASHION INFLUENCER ROSTER • OFFICIAL',
    badgeColor: '#ff7eb6',
    badgeBg: '#361523',
    primaryColor: '#ff2d75',       // Fashion Pink
    secondaryColor: '#ffb300',     // Gold
    accentGlow: 'rgba(255, 45, 117, 0.3)',
    heroGradient: 'linear-gradient(180deg, #3d1425 0%, #210d16 100%)',
    heroBorder: '#ff2d75',
    cardBg: '#2b101c',
    cardBorder: '#631f3e',
    btnBg: '#ff2d75',
    btnTextColor: '#ffffff',
    btnHover: '#d91b5c',
    initials: 'MYNTRA',
    fontCategory: 'fashion-lifestyle'
  }
};

/**
 * Generate a deterministic dynamic theme for any arbitrary brand name
 */
function generateDynamicBrandTheme(brandName) {
  const name = (brandName || 'Brand').trim();
  
  // Deterministic hash from brand name string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  const primaryColor = `hsl(${hue}, 85%, 55%)`;
  const secondaryColor = `hsl(${(hue + 45) % 360}, 90%, 60%)`;
  
  const initials = name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase() || name.substring(0, 3).toUpperCase();

  return {
    brandName: name,
    slug: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    tagline: `Official Creator Collaboration • ${name}`,
    badgeText: 'VERIFIED COMMERCIAL PROPOSAL',
    badgeColor: primaryColor,
    badgeBg: '#1c1c1c',
    primaryColor,
    secondaryColor,
    accentGlow: `hsla(${hue}, 85%, 55%, 0.25)`,
    heroGradient: `linear-gradient(180deg, hsl(${hue}, 35%, 16%) 0%, #161616 100%)`,
    heroBorder: primaryColor,
    cardBg: '#1f1f1f',
    cardBorder: '#393939',
    btnBg: primaryColor,
    btnTextColor: '#ffffff',
    btnHover: `hsl(${hue}, 85%, 45%)`,
    initials,
    fontCategory: 'enterprise-custom'
  };
}

/**
 * Get full visual identity theme for any brand
 */
export function getBrandTheme(brandName) {
  if (!brandName) return BRAND_THEMES['boat lifestyle'];
  const key = brandName.toLowerCase().trim();
  
  if (BRAND_THEMES[key]) {
    return BRAND_THEMES[key];
  }
  
  // Substring match check
  for (const [k, theme] of Object.entries(BRAND_THEMES)) {
    if (key.includes(k) || k.includes(key)) {
      return theme;
    }
  }
  
  return generateDynamicBrandTheme(brandName);
}

export default getBrandTheme;
