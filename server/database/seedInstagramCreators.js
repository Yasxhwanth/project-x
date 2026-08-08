import { runDb, getDbRow } from './sqliteDb.js';

export const TOP_INDIAN_INSTAGRAM_CREATORS = [
  // Fashion & Beauty
  {
    id: "ig_komal_pandey",
    name: "Komal Pandey",
    handle: "@komalpandeyreal",
    platform: "Instagram",
    niche: "Beauty & Fashion",
    followers_raw: 1900000,
    reach_text: "1.9M Followers",
    avg_views: 450000,
    engagement_rate: "9.2%",
    price_per_post: 85000,
    min_price: 68000,
    email: "collabs@komalpandey.in",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    rating: 4.95,
    location: "New Delhi, India",
    language: "Hinglish & English",
    recent_videos_json: JSON.stringify([
      "Reel: Indo-Western Fusion Lookbook 2026 ✨",
      "Reel: Styling 5 Outfits with 1 Blazer",
      "Reel: Festive Ethnic Glam Transformation"
    ]),
    bio: "Fashion pioneer & content creator. Experimental styling & trendsetter across India."
  },
  {
    id: "ig_tarini_peshawaria",
    name: "Tarini Peshawaria",
    handle: "@tarini_peshawaria",
    platform: "Instagram",
    niche: "Beauty & Fashion",
    followers_raw: 750000,
    reach_text: "750K Followers",
    avg_views: 180000,
    engagement_rate: "8.7%",
    price_per_post: 42000,
    min_price: 33600,
    email: "contact@tarinipeshawaria.com",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    rating: 4.88,
    location: "Gurugram, India",
    language: "Hindi & English",
    recent_videos_json: JSON.stringify([
      "Reel: Skincare Routine for Glowing Indian Skin",
      "Reel: Top 5 Sunscreens Reviewed",
      "Reel: Simple Everyday Makeup Tutorial"
    ]),
    bio: "Skincare enthusiast & honest product reviewer. Certified beauty creator."
  },
  {
    id: "ig_masoom_minawala",
    name: "Masoom Minawala",
    handle: "@masoomminawala",
    platform: "Instagram",
    niche: "Beauty & Fashion",
    followers_raw: 1400000,
    reach_text: "1.4M Followers",
    avg_views: 320000,
    engagement_rate: "7.9%",
    price_per_post: 75000,
    min_price: 60000,
    email: "team@masoomminawala.com",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    rating: 4.92,
    location: "Mumbai, India",
    language: "English & Hindi",
    recent_videos_json: JSON.stringify([
      "Reel: Supporting Indian Designers at Milan Fashion Week",
      "Reel: Luxury Saree Draping Hacks",
      "Reel: Entrepreneurship & Fashion Advice"
    ]),
    bio: "Global luxury fashion influencer & Indian handloom advocate."
  },
  {
    id: "ig_kritika_khurana",
    name: "Kritika Khurana (ThatBohoGirl)",
    handle: "@thatbohogirl",
    platform: "Instagram",
    niche: "Beauty & Fashion",
    followers_raw: 1700000,
    reach_text: "1.7M Followers",
    avg_views: 410000,
    engagement_rate: "8.4%",
    price_per_post: 80000,
    min_price: 64000,
    email: "business@thatbohogirl.in",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80",
    rating: 4.9,
    location: "Delhi, India",
    language: "Hinglish & English",
    recent_videos_json: JSON.stringify([
      "Reel: Boho Chic Outfit Ideas for College",
      "Reel: Affordable Sarojini Nagar Shopping Haul",
      "Reel: My Daily Skincare Secrets"
    ]),
    bio: "Boho fashion icon & lifestyle creator. Empowering Indian youth."
  },

  // Tech & Gaming
  {
    id: "ig_tech_burner",
    name: "Shlok Srivastava (Tech Burner)",
    handle: "@techburner",
    platform: "Instagram",
    niche: "Tech & Gadgets",
    followers_raw: 4200000,
    reach_text: "4.2M Followers",
    avg_views: 950000,
    engagement_rate: "12.8%",
    price_per_post: 140000,
    min_price: 112000,
    email: "shlok@techburner.in",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
    rating: 4.98,
    location: "New Delhi, India",
    language: "Hindi & English",
    recent_videos_json: JSON.stringify([
      "Reel: Testing crazy smartphone gadgets under ₹999!",
      "Reel: World's thinnest smartphone review 📱",
      "Reel: Futuristic AI Earbuds Unboxing"
    ]),
    bio: "Making tech fun & entertaining for 4.2M+ followers across India!"
  },
  {
    id: "ig_technical_guruji",
    name: "Gaurav Chaudhary (Technical Guruji)",
    handle: "@technicalguruji",
    platform: "Instagram",
    niche: "Tech & Gadgets",
    followers_raw: 5100000,
    reach_text: "5.1M Followers",
    avg_views: 880000,
    engagement_rate: "9.5%",
    price_per_post: 150000,
    min_price: 120000,
    email: "gaurav@technicalguruji.in",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    rating: 4.95,
    location: "New Delhi & Dubai",
    language: "Hindi",
    recent_videos_json: JSON.stringify([
      "Reel: Flagship Smartphone Camera Comparison 📸",
      "Reel: Next Gen Gaming Laptop First Look",
      "Reel: Tech News & Weekly Updates"
    ]),
    bio: "Chaliye shuru karte hai! India's biggest tech influencer."
  },
  {
    id: "ig_mortal",
    name: "Naman Mathur (MortaL)",
    handle: "@ig_mortal",
    platform: "Instagram",
    niche: "Gaming & Esports",
    followers_raw: 5400000,
    reach_text: "5.4M Followers",
    avg_views: 1100000,
    engagement_rate: "14.2%",
    price_per_post: 135000,
    min_price: 108000,
    email: "mortal@s8ulesports.com",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=400&q=80",
    rating: 4.97,
    location: "Mumbai, India",
    language: "Hindi & English",
    recent_videos_json: JSON.stringify([
      "Reel: Epic BGMI 1v4 Clutch Clutch Play 🎮",
      "Reel: S8UL Gaming House Tour 2026",
      "Reel: Testing New Gaming Headset"
    ]),
    bio: "Esports Athlete & Co-founder S8UL. Esports personality of the year."
  },

  // Finance & Productivity
  {
    id: "ig_ranveer_allahbadia",
    name: "Ranveer Allahbadia (BeerBiceps)",
    handle: "@ranveer.allahbadia",
    platform: "Instagram",
    niche: "Finance & Productivity",
    followers_raw: 3800000,
    reach_text: "3.8M Followers",
    avg_views: 920000,
    engagement_rate: "11.5%",
    price_per_post: 140000,
    min_price: 112000,
    email: "ranveer@monk-e.in",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    rating: 4.96,
    location: "Mumbai, India",
    language: "Hinglish & English",
    recent_videos_json: JSON.stringify([
      "Reel: How to invest your first ₹50,000 in India 📈",
      "Reel: Top 3 Habits for High Performance",
      "Reel: TRS Podcast Highlights: Business Growth"
    ]),
    bio: "Entrepreneur, Podcaster & Monk-E founder. Self-improvement for India."
  },
  {
    id: "ig_sharan_hegde",
    name: "Sharan Hegde (Finance With Sharan)",
    handle: "@financewithsharan",
    platform: "Instagram",
    niche: "Finance & Productivity",
    followers_raw: 2800000,
    reach_text: "2.8M Followers",
    avg_views: 780000,
    engagement_rate: "13.1%",
    price_per_post: 110000,
    min_price: 88000,
    email: "sharan@financewithsharan.com",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    rating: 4.94,
    location: "Bengaluru, India",
    language: "Hinglish & English",
    recent_videos_json: JSON.stringify([
      "Reel: Tax saving tricks under Sec 80C you didn't know!",
      "Reel: Credit Card Points vs Cash Back Hack 💳",
      "Reel: Stock Market Rules for Beginners in 2026"
    ]),
    bio: "Finance made fun & simple. Comic financial advisor for 2.8M+ Indians."
  },
  {
    id: "ig_rachana_ranade",
    name: "CA Rachana Ranade",
    handle: "@ca_rachanaranade",
    platform: "Instagram",
    niche: "Finance & Productivity",
    followers_raw: 1200000,
    reach_text: "1.2M Followers",
    avg_views: 310000,
    engagement_rate: "8.9%",
    price_per_post: 65000,
    min_price: 52000,
    email: "contact@rachanaranade.com",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    rating: 4.91,
    location: "Pune, India",
    language: "Marathi, Hindi & English",
    recent_videos_json: JSON.stringify([
      "Reel: Mutual Fund SIP Strategy for Wealth Creation",
      "Reel: Understanding Union Budget & Tax Slabs",
      "Reel: Fundamental Analysis of Top Indian Stocks"
    ]),
    bio: "Chartered Accountant & Financial Educator. Simplifying stock market."
  },

  // Fitness & Health
  {
    id: "ig_fit_tuber",
    name: "Vivek Mittal (Fit Tuber)",
    handle: "@fittuber",
    platform: "Instagram",
    niche: "Fitness & Health",
    followers_raw: 7400000,
    reach_text: "7.4M Followers",
    avg_views: 1400000,
    engagement_rate: "11.2%",
    price_per_post: 95000,
    min_price: 76000,
    email: "contact@fittuber.com",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
    rating: 4.99,
    location: "Chandigarh, India",
    language: "Hindi & English",
    recent_videos_json: JSON.stringify([
      "Reel: Top 5 Healthy Indian Snacks for Weight Loss 🥗",
      "Reel: Chemical-free Shampoos Reviewed",
      "Reel: Daily Ayurvedic Routine for High Energy"
    ]),
    bio: "Natural health & fitness solutions. No fake supplements, pure ayurveda."
  },

  // Lifestyle & Comedy
  {
    id: "ig_mostlysane",
    name: "Prajakta Koli (MostlySane)",
    handle: "@mostlysane",
    platform: "Instagram",
    niche: "Food & Lifestyle",
    followers_raw: 7900000,
    reach_text: "7.9M Followers",
    avg_views: 1600000,
    engagement_rate: "10.8%",
    price_per_post: 160000,
    min_price: 128000,
    email: "prajakta@mostlysane.in",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    rating: 4.97,
    location: "Mumbai, India",
    language: "Hinglish",
    recent_videos_json: JSON.stringify([
      "Reel: Relatable Indian Family Relatives Scenes 😂",
      "Reel: Behind the Scenes on Set",
      "Reel: Morning Coffee Conversations"
    ]),
    bio: "Actor, creator & UN UNDP Climate Champion. Dum Dums assemble!"
  },
  {
    id: "ig_bhuvan_bam",
    name: "Bhuvan Bam (BB Ki Vines)",
    handle: "@bhuvan.bam22",
    platform: "Instagram",
    niche: "Food & Lifestyle",
    followers_raw: 19500000,
    reach_text: "19.5M Followers",
    avg_views: 3200000,
    engagement_rate: "15.4%",
    price_per_post: 250000,
    min_price: 200000,
    email: "bhuvan@bbkivines.in",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    rating: 4.99,
    location: "New Delhi, India",
    language: "Hindi",
    recent_videos_json: JSON.stringify([
      "Reel: Titu Mama's Advice on Career 🎭",
      "Reel: Taaza Khabar Season 2 Teaser",
      "Reel: Original Music Acoustic Jam"
    ]),
    bio: "Actor, Musician & Creator of BB Ki Vines. First Indian creator to 10M."
  }
];

export async function seedInstagramCreatorsDatabase() {
  console.log("🌱 Seeding pre-populated Indian Instagram Creator Database with PFP Avatars...");
  let count = 0;

  for (const c of TOP_INDIAN_INSTAGRAM_CREATORS) {
    try {
      const existing = await getDbRow("SELECT id FROM creators WHERE handle = ?", [c.handle]);
      if (!existing) {
        await runDb(`
          INSERT INTO creators (
            id, name, handle, platform, niche, followers_raw, reach_text,
            avg_views, engagement_rate, price_per_post, min_price, email,
            avatar, rating, location, language, recent_videos_json, bio
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          c.id, c.name, c.handle, c.platform, c.niche, c.followers_raw, c.reach_text,
          c.avg_views, c.engagement_rate, c.price_per_post, c.min_price, c.email,
          c.avatar, c.rating, c.location, c.language, c.recent_videos_json, c.bio
        ]);
        count++;
      } else {
        // Update avatar PFP
        await runDb("UPDATE creators SET avatar = ? WHERE handle = ?", [c.avatar, c.handle]);
      }
    } catch (err) {
      console.error(`Error seeding ${c.handle}:`, err);
    }
  }

  console.log(`✨ Database Seeder Complete! Updated PFPs for ${TOP_INDIAN_INSTAGRAM_CREATORS.length} Indian Instagram creators.`);
}
