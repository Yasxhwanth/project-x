import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, 'creators_db.json');

// Initial seed channels for YouTube and Instagram (Formatted in K and M)
const initialSeedCreators = [
  {
    id: "yt_channel_01",
    name: "Technical Guruji",
    handle: "@TechnicalGuruji",
    platform: "YouTube",
    niche: "Tech & Gadgets",
    subscribersRaw: 23500000,
    reachText: "23.5M Subscribers",
    avgViews: 450000,
    engagementRate: "8.6%",
    pricePerPost: 150000,
    minPrice: 120000,
    email: "guruji@technicalguruji.in",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
    rating: 4.95,
    location: "New Delhi / Dubai",
    language: "Hindi",
    recentVideos: [
      "Unboxing The World's Thinnest Smartphone! ⚡",
      "Top 5 Best Laptops Under ₹50,000 in India",
      "Is This The Ultimate Gaming Phone?"
    ],
    bio: "Chaliye shuru karte hain! Daily tech unboxings, gadget reviews, and tech news in Hindi."
  },
  {
    id: "ig_creator_01",
    name: "Komal Pandey",
    handle: "@komalpandeyreal",
    platform: "Instagram",
    niche: "Beauty & Fashion",
    subscribersRaw: 1900000,
    reachText: "1.9M Followers",
    avgViews: 450000,
    engagementRate: "9.2%",
    pricePerPost: 85000,
    minPrice: 70000,
    email: "collabs@komalpandey.in",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
    rating: 4.9,
    location: "New Delhi, India",
    language: "Hinglish",
    recentVideos: [
      "Reel: 5 Ways to Style a Black Blazer for Desi Weddings ✨",
      "Reel: Indo-Western Fusion Lookbook 2026",
      "Reel: Monochrome Saree Styling Hacks"
    ],
    bio: "Fashion influencer, fashion video creator, and visual stylist."
  },
  {
    id: "yt_channel_02",
    name: "Fit Tuber",
    handle: "@FitTuber",
    platform: "YouTube",
    niche: "Fitness & Health",
    subscribersRaw: 7400000,
    reachText: "7.4M Subscribers",
    avgViews: 850000,
    engagementRate: "11.2%",
    pricePerPost: 95000,
    minPrice: 80000,
    email: "contact@fittuber.com",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80",
    rating: 4.9,
    location: "Punjab, India",
    language: "Hindi & English",
    recentVideos: [
      "Best & Worst Peanut Butters in India (Exposed!)",
      "10-Minute Morning Yoga for Weight Loss",
      "How to Read Food Labels in Indian Supermarkets"
    ],
    bio: "Honest reviews of Indian food products, natural ayurvedic remedies, and fitness routines."
  },
  {
    id: "ig_creator_02",
    name: "Ranveer Allahbadia",
    handle: "@ranveer.allahbadia",
    platform: "Instagram",
    niche: "Finance & Productivity",
    subscribersRaw: 3800000,
    reachText: "3.8M Followers",
    avgViews: 920000,
    engagementRate: "11.5%",
    pricePerPost: 140000,
    minPrice: 110000,
    email: "ranveer@beerbiceps.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
    rating: 4.95,
    location: "Mumbai, Maharashtra",
    language: "Hindi & English",
    recentVideos: [
      "Reel: 3 Mindset Habits of Top Indian Founders 💡",
      "Reel: Why Young India Needs Stock Market Education",
      "Reel: Daily Fitness Routine & Supplement Stack"
    ],
    bio: "Entrepreneur, podcast host (The Ranveer Show), and fitness/lifestyle creator."
  },
  {
    id: "yt_channel_03",
    name: "MortaL (Naman Mathur)",
    handle: "@MortaLyt",
    platform: "YouTube",
    niche: "Gaming & Esports",
    subscribersRaw: 7000000,
    reachText: "7.0M Subscribers",
    avgViews: 620000,
    engagementRate: "12.4%",
    pricePerPost: 85000,
    minPrice: 70000,
    email: "mortal@s8ul.in",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
    rating: 4.98,
    location: "Mumbai, Maharashtra",
    language: "Hindi & Hinglish",
    recentVideos: [
      "BGMI 3.3 Update New Secret Tricks! 🚀",
      "Testing ₹1.5 Lakh Gaming Phone for Tournament",
      "S8UL Gaming House Tour 2026"
    ],
    bio: "Professional BGMI esports player, streamer, and co-founder of S8UL Esports India."
  }
];

export function getStoredCreators() {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      saveStoredCreators(initialSeedCreators);
      return initialSeedCreators;
    }
    const data = fs.readFileSync(DB_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading creators_db.json", err);
    return initialSeedCreators;
  }
}

export function saveStoredCreators(creators) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(creators, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing creators_db.json", err);
  }
}

export function addCreatorToDatabase(newCreator) {
  const current = getStoredCreators();
  const exists = current.some(c => c.handle.toLowerCase() === newCreator.handle.toLowerCase());
  if (!exists) {
    current.unshift(newCreator);
    saveStoredCreators(current);
  }
  return current;
}
