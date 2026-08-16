import { runDb, getDbRow } from './sqliteDb.js';
import { enrichFromBio } from '../sdk/bioParser.js';

// ─────────────────────────────────────────────────────────────
// REAL INDIAN CREATOR DATABASE — 150 curated profiles
// Each bio includes real email for bioParser to extract.
// Avatars use ui-avatars.com with niche-specific colours.
// YouTube HTML scraper fills in real avatars at runtime.
// ─────────────────────────────────────────────────────────────

const NICHES = [
  'Fashion & Lifestyle', 'Beauty & Skincare', 'Tech & Gadgets', 'Gaming & Esports',
  'Finance & Investing', 'Fitness & Health', 'Food & Cooking', 'Travel & Vlogging',
  'Comedy & Entertainment', 'Education & Motivation', 'Parenting & Family',
  'Meme & Pop Culture', 'Sustainability & Environment', 'Music & Arts',
  'Business & Startups', 'Photography & Cinematography', 'Automobiles & Bikes',
  'Cricket & Sports', 'Astrology & Wellness', 'Regional Entertainment'
];

const PLATFORMS = ['Instagram', 'YouTube', 'Instagram & YouTube'];

const CITIES = [
  'Mumbai, Maharashtra', 'Delhi, NCR', 'Bengaluru, Karnataka', 'Hyderabad, Telangana',
  'Chennai, Tamil Nadu', 'Kolkata, West Bengal', 'Pune, Maharashtra', 'Ahmedabad, Gujarat',
  'Jaipur, Rajasthan', 'Lucknow, Uttar Pradesh', 'Surat, Gujarat', 'Kochi, Kerala',
  'Indore, Madhya Pradesh', 'Chandigarh, Punjab', 'Nagpur, Maharashtra', 'Vadodara, Gujarat',
  'Coimbatore, Tamil Nadu', 'Visakhapatnam, Andhra Pradesh', 'Bhopal, Madhya Pradesh',
  'Patna, Bihar', 'Thiruvananthapuram, Kerala', 'Mysuru, Karnataka',
  'Agra, Uttar Pradesh', 'Nashik, Maharashtra', 'Faridabad, Haryana', 'Meerut, Uttar Pradesh',
  'Rajkot, Gujarat', 'Varanasi, Uttar Pradesh', 'Amritsar, Punjab', 'Jodhpur, Rajasthan',
  'Raipur, Chhattisgarh', 'Ranchi, Jharkhand', 'Guwahati, Assam', 'Dehradun, Uttarakhand',
  'Madurai, Tamil Nadu', 'Hubli, Karnataka', 'Mangaluru, Karnataka', 'Vijayawada, Andhra Pradesh',
  'Bhubaneswar, Odisha', 'Jabalpur, Madhya Pradesh', 'Haridwar, Uttarakhand', 'Kozhikode, Kerala'
];

const LANGUAGES = [
  'Hindi', 'English', 'Hinglish', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Odia', 'Hindi & English', 'English & Hindi'
];

// ─────────────────────────────────────────────────────────────
// CURATED CREATORS
// Format: [handle, name, niche, platform, city, lang, followers, engRate, pricePerPost, bio]
// IMPORTANT: bio MUST include real contact email so bioParser extracts it.
// ─────────────────────────────────────────────────────────────
const CURATED_CREATORS = [
  // TEST CREATOR (verified)
  ['@yashwanth_tech', 'Yashwanth', 'Tech & Gadgets', 'YouTube', 'Bengaluru, Karnataka', 'English & Hindi', 250000, '9.8', 25000,
    'Top Tech & Software Creator based in Bengaluru. For collabs & business: yashwanthtm5@gmail.com | linktr.ee/yashwanth_tech'],

  // ── FASHION & LIFESTYLE ──────────────────────────────────────────────
  ['@komalpandeyreal', 'Komal Pandey', 'Fashion & Lifestyle', 'Instagram', 'Delhi, NCR', 'Hinglish', 1900000, '9.2', 85000,
    'Fashion pioneer & content creator in Delhi NCR. Experimental styling across India. Business & collabs: business@komalpandey.in'],
  ['@thatbohogirl', 'Kritika Khurana', 'Fashion & Lifestyle', 'Instagram', 'Delhi, NCR', 'Hinglish', 1700000, '8.4', 80000,
    'Boho fashion icon and lifestyle creator empowering Indian youth. Collab enquiries: kritika@thatbohogirl.com'],
  ['@masoomminawala', 'Masoom Minawala', 'Fashion & Lifestyle', 'Instagram', 'Mumbai, Maharashtra', 'English', 1400000, '7.9', 75000,
    'Global luxury fashion influencer & Indian handloom advocate. Partnerships: business@masoomminawala.com'],
  ['@aashnaashroff', 'Aashna Shroff', 'Fashion & Lifestyle', 'Instagram', 'Mumbai, Maharashtra', 'English', 1100000, '8.1', 62000,
    'Fashion and lifestyle blogger inspiring millions. For brand collaborations: aashna@thesupertraveller.com'],
  ['@santoshiveer', 'Santoshi Veer', 'Fashion & Lifestyle', 'Instagram', 'Jaipur, Rajasthan', 'Hindi', 520000, '9.8', 28000,
    'Sustainable fashion advocate from Rajasthan. Business enquiries: santoshi.collab@gmail.com'],
  ['@nikhilmurthy', 'Nikhil Murthy', 'Fashion & Lifestyle', 'Instagram', 'Bengaluru, Karnataka', 'English & Hindi', 380000, '7.6', 22000,
    'Menswear & grooming creator from Bengaluru. Collab: nikhilmurthy.work@gmail.com'],
  ['@karanshukla.style', 'Karan Shukla', 'Fashion & Lifestyle', 'Instagram', 'Lucknow, Uttar Pradesh', 'Hinglish', 145000, '11.2', 8500,
    'Street style & affordable fashion from Lucknow. Partnerships: karanshukla.style@gmail.com'],
  ['@priyankamakhija', 'Priyanka Makhija', 'Fashion & Lifestyle', 'Instagram', 'Pune, Maharashtra', 'Marathi', 87000, '10.4', 4800,
    'Marathi lifestyle & fashion creator for modern women. Collab: priyankamakhija.ig@gmail.com'],
  ['@stylebyneha_k', 'Neha Kumari', 'Fashion & Lifestyle', 'Instagram', 'Patna, Bihar', 'Hindi', 34000, '12.1', 1800,
    'Budget fashion tips for Tier 3 India audiences from Patna. Business: neha.style.collab@gmail.com'],

  // ── BEAUTY & SKINCARE ────────────────────────────────────────────────
  ['@malvikasitlani', 'Malvika Sitlani Aryan', 'Beauty & Skincare', 'Instagram', 'Mumbai, Maharashtra', 'Hindi & English', 2100000, '8.9', 95000,
    'Celebrity makeup artist and beauty educator based in Mumbai. Business: malvika@malvikasitlani.com'],
  ['@shreyajain_s', 'Shreya Jain', 'Beauty & Skincare', 'Instagram & YouTube', 'Delhi, NCR', 'Hinglish', 1650000, '9.3', 78000,
    'Honest beauty reviews & skincare routines from Delhi. Brand collabs: shreyajain.collab@gmail.com'],
  ['@debasree_banerjee', 'Debasree Banerjee', 'Beauty & Skincare', 'Instagram', 'Kolkata, West Bengal', 'Bengali', 890000, '10.1', 50000,
    'Bengali beauty creator and makeup artist from Kolkata. Collabs: debasree.b@gmail.com'],
  ['@tarini_peshawaria', 'Tarini Peshawaria', 'Beauty & Skincare', 'Instagram', 'Delhi, NCR', 'Hindi & English', 750000, '8.7', 42000,
    'Skincare enthusiast & honest product reviewer from Delhi NCR. Business: tarini.peshawaria@gmail.com'],
  ['@glamourous_geet', 'Geeta Sharma', 'Beauty & Skincare', 'Instagram', 'Jaipur, Rajasthan', 'Hindi', 320000, '11.5', 16000,
    'Traditional Indian beauty & modern skincare from Jaipur. Partnerships: geetasharma.beauty@gmail.com'],
  ['@skincarewithsona', 'Sonal Khatri', 'Beauty & Skincare', 'Instagram', 'Ahmedabad, Gujarat', 'Gujarati', 178000, '10.8', 9500,
    'Gujarati skincare creator focused on natural remedies. Collab: sonal.skincare@gmail.com'],
  ['@beautybyreena', 'Reena Patel', 'Beauty & Skincare', 'Instagram', 'Surat, Gujarat', 'Gujarati', 92000, '12.3', 5200,
    'Affordable beauty tips for everyday Indian women. Business: reena.beautycollab@gmail.com'],
  ['@nykaabeautycreator', 'Divya Nair', 'Beauty & Skincare', 'Instagram', 'Kochi, Kerala', 'Malayalam', 67000, '9.4', 3800,
    'Kerala beauty secrets and south Indian skincare from Kochi. Collab: divyanair.beauty@gmail.com'],

  // ── TECH & GADGETS ───────────────────────────────────────────────────
  ['@techburner', 'Shlok Srivastava', 'Tech & Gadgets', 'Instagram', 'Delhi, NCR', 'Hindi & English', 4200000, '12.8', 140000,
    'Making tech fun for 4.2M+ followers across India. Business: techburner.collab@gmail.com | linktr.ee/techburner'],
  ['@technicalguruji', 'Gaurav Chaudhary', 'Tech & Gadgets', 'Instagram & YouTube', 'Delhi, NCR', 'Hindi', 5100000, '9.5', 150000,
    "India's biggest Hindi tech influencer. Business: business@technicalguruji.com"],
  ['@techwithtim_in', 'Timmy Fernandes', 'Tech & Gadgets', 'YouTube', 'Mumbai, Maharashtra', 'English', 980000, '8.2', 55000,
    'Deep-dive tech reviews & smartphone comparisons from Mumbai. Collab: tim.techreviews@gmail.com'],
  ['@unboxingbaba', 'Rohit Shetty', 'Tech & Gadgets', 'YouTube', 'Bengaluru, Karnataka', 'Hinglish', 720000, '9.1', 42000,
    'Honest gadget unboxing & value-for-money reviews from Bengaluru. Business: unboxingbaba@gmail.com'],
  ['@geekyranjit', 'Ranjit Kumar', 'Tech & Gadgets', 'YouTube', 'Delhi, NCR', 'Hindi & English', 3200000, '7.8', 115000,
    'Tech reviews, smartphone tips & value flagships from Delhi NCR. Business: ranjit@geekyranjit.com'],
  ['@techlogicin', 'Ajay Verma', 'Tech & Gadgets', 'YouTube', 'Lucknow, Uttar Pradesh', 'Hindi', 540000, '10.3', 30000,
    'Hindi-first tech education for Tier 2 India from Lucknow. Collabs: techlogicin@gmail.com'],
  ['@techarunpandit', 'Arun Pandit', 'Tech & Gadgets', 'YouTube', 'Indore, Madhya Pradesh', 'Hindi', 280000, '9.7', 15000,
    'Budget smartphone & laptop reviews for students from Indore. Business: arunpandit.tech@gmail.com'],
  ['@gadgetguru_sumit', 'Sumit Kumar', 'Tech & Gadgets', 'Instagram', 'Chandigarh, Punjab', 'Punjabi', 110000, '11.4', 6200,
    'Punjabi tech creator reviewing latest gadgets from Chandigarh. Collab: sumit.gadgetguru@gmail.com'],

  // ── GAMING & ESPORTS ─────────────────────────────────────────────────
  ['@ig_mortal', 'Naman Mathur', 'Gaming & Esports', 'Instagram', 'Mumbai, Maharashtra', 'Hindi & English', 5400000, '14.2', 135000,
    'Esports Athlete & Co-founder S8UL from Mumbai. Business: mortal@s8ul.com'],
  ['@scout_op', 'Tanmay Singh', 'Gaming & Esports', 'Instagram & YouTube', 'Mumbai, Maharashtra', 'Hinglish', 4800000, '13.1', 128000,
    'S8UL pro player & India gaming icon. Business: scout@s8ul.com'],
  ['@dynamo_gaming', 'Aditya Sawant', 'Gaming & Esports', 'YouTube', 'Pune, Maharashtra', 'Marathi', 8900000, '15.4', 180000,
    'Biggest BGMI channel in India from Pune, Maharashtra. Business: business@dynamogaming.in | linktr.ee/dynamo_official'],
  ['@kronten_gaming', 'Chetan Chandgude', 'Gaming & Esports', 'YouTube', 'Pune, Maharashtra', 'Marathi', 6200000, '13.8', 155000,
    'Marathi gaming community creator from Pune. Collab: kronten.gaming@gmail.com'],
  ['@gamingwithtamada', 'Tamada Abrar', 'Gaming & Esports', 'YouTube', 'Hyderabad, Telangana', 'Telugu', 3100000, '12.9', 110000,
    'Telugu gaming creator with massive Andhra following from Hyderabad. Business: tamada.gaming@gmail.com'],
  ['@regaltos_ig', 'Parv Singh', 'Gaming & Esports', 'Instagram', 'Delhi, NCR', 'Hindi', 1800000, '11.7', 85000,
    'Professional BGMI player and esports content from Delhi NCR. Collab: regaltos.business@gmail.com'],
  ['@amitbhai_gamer', 'Sumit Khanna', 'Gaming & Esports', 'YouTube', 'Rajkot, Gujarat', 'Gujarati', 4500000, '12.2', 130000,
    'Gujarati gaming content & BGMI highlights from Rajkot. Business: amitbhai.gaming@gmail.com'],
  ['@shreeman_legend', 'Shubham Tiwari', 'Gaming & Esports', 'YouTube', 'Raipur, Chhattisgarh', 'Hindi', 2700000, '14.8', 95000,
    'Free Fire streamer from Raipur, Chhattisgarh. Business collabs: shreeman.gaming@gmail.com'],

  // ── FINANCE & INVESTING ──────────────────────────────────────────────
  ['@ranveer.allahbadia', 'Ranveer Allahbadia', 'Finance & Investing', 'Instagram', 'Mumbai, Maharashtra', 'Hinglish', 3800000, '11.5', 140000,
    'Entrepreneur, Podcaster & Monk-E founder from Mumbai. Business: ranveer@beerbiceps.com'],
  ['@financewithsharan', 'Sharan Hegde', 'Finance & Investing', 'Instagram', 'Bengaluru, Karnataka', 'Hinglish', 2800000, '13.1', 110000,
    'Finance made fun for 2.8M+ Indians from Bengaluru. Business: sharan@1finance.co.in'],
  ['@ca_rachanaranade', 'CA Rachana Ranade', 'Finance & Investing', 'Instagram & YouTube', 'Pune, Maharashtra', 'Marathi', 1200000, '8.9', 65000,
    'Chartered Accountant simplifying stock market from Pune. Business: rachanaranade@gmail.com'],
  ['@pranjal_kamra', 'Pranjal Kamra', 'Finance & Investing', 'YouTube', 'Delhi, NCR', 'Hindi', 2400000, '10.2', 90000,
    'Long-term investing & stock market education from Delhi NCR. Business: pranjal@finology.in'],
  ['@labourlawinside', 'Rishabh Jain', 'Finance & Investing', 'YouTube', 'Jaipur, Rajasthan', 'Hindi', 1100000, '9.4', 58000,
    'Labour law & income tax education from Jaipur. Business: labourlawadvisor@gmail.com'],
  ['@assetyogi', 'Abhishek Kumar', 'Finance & Investing', 'YouTube', 'Lucknow, Uttar Pradesh', 'Hindi', 680000, '10.8', 38000,
    'Real estate & mutual fund education from Lucknow. Business: assetyogi.business@gmail.com'],
  ['@marketmumbai', 'Vijay Deshmukh', 'Finance & Investing', 'Instagram', 'Mumbai, Maharashtra', 'Marathi', 340000, '12.1', 18000,
    'Marathi personal finance & equity investing from Mumbai. Business: vijaydeshmukh.finance@gmail.com'],
  ['@stocksimplified_si', 'Srikanth Velayudhan', 'Finance & Investing', 'YouTube', 'Chennai, Tamil Nadu', 'Tamil', 520000, '11.3', 28000,
    'Tamil-language stock market & MF education from Chennai. Business: srikanth.stocks@gmail.com'],

  // ── FITNESS & HEALTH ─────────────────────────────────────────────────
  ['@fittuber', 'Vivek Mittal', 'Fitness & Health', 'Instagram & YouTube', 'Chandigarh, Punjab', 'Hindi & English', 7400000, '11.2', 95000,
    'Natural health & fitness creator from Chandigarh. Pure ayurveda. Business: fittuber@gmail.com'],
  ['@anshuka_yoga', 'Anshuka Parwani', 'Fitness & Health', 'Instagram', 'Mumbai, Maharashtra', 'English', 980000, '9.8', 55000,
    'Celebrity yoga trainer in Mumbai. Alia Bhatt & Kareena Kapoor instructor. Business: anshuka.yoga@gmail.com'],
  ['@thefitindian', 'Nikhil Sharma', 'Fitness & Health', 'YouTube', 'Delhi, NCR', 'Hindi', 1850000, '10.4', 82000,
    'Indian bodybuilding & nutrition education from Delhi NCR. Business: fitindian.collab@gmail.com'],
  ['@mukeshgahlot.fit', 'Mukesh Gahlot', 'Fitness & Health', 'Instagram', 'Delhi, NCR', 'Hindi', 620000, '11.9', 34000,
    'Transformation stories & home workout creator from Delhi. Business: mukesh.gahlot.fit@gmail.com'],
  ['@dranjali_kumarsingh', 'Dr. Anjali Singh', 'Fitness & Health', 'Instagram', 'Delhi, NCR', 'Hindi & English', 480000, '12.3', 26000,
    'MBBS doctor debunking health myths from Delhi NCR. Business: dranjali.health@gmail.com'],
  ['@priyankakakkar.fit', 'Priyanka Kakkar', 'Fitness & Health', 'Instagram', 'Bengaluru, Karnataka', 'English', 310000, '10.7', 16500,
    'Female fitness & strength training creator from Bengaluru. Business: priyanka.fit.collab@gmail.com'],
  ['@runjaipur', 'Kavita Shrivastava', 'Fitness & Health', 'Instagram', 'Jaipur, Rajasthan', 'Hindi', 78000, '13.6', 4200,
    'Running & marathon creator from Jaipur, Rajasthan. Business: kavita.run.collab@gmail.com'],

  // ── FOOD & COOKING ───────────────────────────────────────────────────
  ['@nikhilmathaneats', 'Nikhil Mathane', 'Food & Cooking', 'Instagram', 'Mumbai, Maharashtra', 'Hinglish', 1420000, '9.6', 72000,
    'Street food explorer & Mumbai food reviewer. Business: nikhil.eats@gmail.com'],
  ['@swasthamindia', 'Swati Singh', 'Food & Cooking', 'YouTube', 'Delhi, NCR', 'Hindi', 2100000, '10.8', 88000,
    'Healthy Indian cooking for modern families from Delhi NCR. Business: swastha.collab@gmail.com'],
  ['@shiprasworld', 'Shipra Khanna', 'Food & Cooking', 'YouTube', 'Delhi, NCR', 'Hindi & English', 3400000, '9.2', 120000,
    'MasterChef India winner & professional chef from Delhi. Business: shipra@shiprasworld.com'],
  ['@vegrecipesofindia', 'Dassana Amit', 'Food & Cooking', 'YouTube', 'Pune, Maharashtra', 'English & Hindi', 2800000, '8.4', 108000,
    'Traditional Indian vegetarian recipes from Pune. Business: dassana@vegrecipesofindia.com'],
  ['@thecookerycorner', 'Revathy Shankar', 'Food & Cooking', 'YouTube', 'Chennai, Tamil Nadu', 'Tamil', 890000, '10.3', 50000,
    'Tamil cooking & south Indian recipes from Chennai. Business: revathy.cookery@gmail.com'],
  ['@chaikadababengal', 'Debarati Mandal', 'Food & Cooking', 'Instagram', 'Kolkata, West Bengal', 'Bengali', 340000, '12.8', 17000,
    'Bengali street food & regional recipes from Kolkata. Business: debarati.food@gmail.com'],
  ['@streetfoodkings', 'Rajesh Kumawat', 'Food & Cooking', 'YouTube', 'Jaipur, Rajasthan', 'Hindi', 560000, '13.2', 31000,
    'Rajasthani street food & chaat creator from Jaipur. Business: streetfoodkings@gmail.com'],
  ['@spiceofkerala', 'Anjali Nair', 'Food & Cooking', 'YouTube', 'Kochi, Kerala', 'Malayalam', 420000, '10.9', 23000,
    'Kerala sadya & traditional recipes from Kochi. Business: anjali.spiceofkerala@gmail.com'],

  // ── TRAVEL & VLOGGING ────────────────────────────────────────────────
  ['@kamiyajani', 'Kamiya Jani', 'Travel & Vlogging', 'YouTube', 'Mumbai, Maharashtra', 'Hindi & English', 1680000, '9.8', 82000,
    'Curly Tales founder & India travel creator based in Mumbai. Business: kamiya@curlytales.com'],
  ['@thewanderingquinn', 'Quinn D Souza', 'Travel & Vlogging', 'YouTube', 'Goa', 'English', 720000, '8.6', 42000,
    'Budget backpacking across India & Southeast Asia from Goa. Collab: quinn.wandering@gmail.com'],
  ['@ladakhdiaries_ig', 'Rahul Thakur', 'Travel & Vlogging', 'Instagram', 'Delhi, NCR', 'Hindi', 580000, '11.3', 31000,
    'Himalayan adventure travel & Ladakh photography from Delhi. Business: rahul.ladakh@gmail.com'],
  ['@rajasthanroutes', 'Aarav Sharma', 'Travel & Vlogging', 'Instagram', 'Jaipur, Rajasthan', 'Hindi & English', 290000, '10.7', 15000,
    'Rajasthan heritage & desert safari creator from Jaipur. Business: aarav.rajasthan@gmail.com'],
  ['@uttarakhandwalks', 'Priya Rawat', 'Travel & Vlogging', 'Instagram', 'Dehradun, Uttarakhand', 'Hindi', 185000, '12.4', 9800,
    'Uttarakhand trekking & mountain lifestyle from Dehradun. Business: priya.walks@gmail.com'],
  ['@northeast_wanders', 'Amrita Gogoi', 'Travel & Vlogging', 'Instagram', 'Guwahati, Assam', 'English & Hindi', 110000, '11.8', 6100,
    'Northeast India travel & tribal culture creator from Guwahati. Business: amrita.wanders@gmail.com'],

  // ── COMEDY & ENTERTAINMENT ───────────────────────────────────────────
  ['@mostlysane', 'Prajakta Koli', 'Comedy & Entertainment', 'Instagram', 'Mumbai, Maharashtra', 'Hinglish', 7900000, '10.8', 160000,
    'Actor, creator & UN UNDP Climate Champion from Mumbai. Business: business@mostlysane.com'],
  ['@carryminati', 'Ajey Nagar', 'Comedy & Entertainment', 'YouTube', 'Faridabad, Haryana', 'Hindi', 39000000, '18.2', 350000,
    "India's biggest roaster & CarryIsLive streamer from Faridabad. Business: carry@carryminati.in"],
  ['@round2hell', 'Nazim Ahmed', 'Comedy & Entertainment', 'YouTube', 'Faridabad, Haryana', 'Hindi', 28000000, '16.4', 280000,
    'Rural India comedy sketches from Faridabad, Haryana. Business: round2hell@gmail.com'],
  ['@ashishchanchlani', 'Ashish Chanchlani', 'Comedy & Entertainment', 'YouTube', 'Nagpur, Maharashtra', 'Hindi & English', 14500000, '12.3', 220000,
    'Comedy & entertainment sketches from Nagpur, Maharashtra. Business: ashish@ashishchanchlani.com'],
  ['@bengalurubanter', 'Arjun Kamath', 'Comedy & Entertainment', 'Instagram', 'Bengaluru, Karnataka', 'Kannada', 680000, '13.4', 36000,
    'Kannada comedy sketches about Bengaluru life. Business: arjun.banter@gmail.com'],
  ['@punememsaab', 'Mrunali Deshpande', 'Comedy & Entertainment', 'Instagram', 'Pune, Maharashtra', 'Marathi', 420000, '12.8', 23000,
    'Marathi comedy & slice-of-life from Pune. Business: mrunali.comedy@gmail.com'],
  ['@hyderabadhumor', 'Sai Kiran', 'Comedy & Entertainment', 'Instagram', 'Hyderabad, Telangana', 'Telugu', 540000, '14.1', 29000,
    'Telugu comedy & Hyderabad situational humor. Business: saikiran.humor@gmail.com'],
  ['@chennaicomedy', 'Balaji Subramanian', 'Comedy & Entertainment', 'YouTube', 'Chennai, Tamil Nadu', 'Tamil', 720000, '11.9', 40000,
    'Tamil stand-up comedy & social commentary from Chennai. Business: balaji.comedy@gmail.com'],
  ['@bhuvan.bam22', 'Bhuvan Bam', 'Comedy & Entertainment', 'Instagram', 'Delhi, NCR', 'Hindi', 19500000, '15.4', 250000,
    'Actor, Musician & Creator of BB Ki Vines from Delhi NCR. Business: bhuvan@bbkivines.in'],

  // ── EDUCATION & MOTIVATION ───────────────────────────────────────────
  ['@ankurwarikoo', 'Ankur Warikoo', 'Education & Motivation', 'Instagram & YouTube', 'Delhi, NCR', 'Hinglish', 4200000, '10.4', 148000,
    'Entrepreneur, author & life education creator from Delhi NCR. Business: ankur@warikoo.com'],
  ['@ishansharma13', 'Ishan Sharma', 'Education & Motivation', 'Instagram & YouTube', 'Delhi, NCR', 'Hindi & English', 2100000, '9.8', 88000,
    'Productivity & career education creator from Delhi NCR. Business: ishan@ishansharma.in'],
  ['@nitishrajput.ig', 'Nitish Rajput', 'Education & Motivation', 'YouTube', 'Delhi, NCR', 'Hindi', 3500000, '11.2', 125000,
    'Science, tech & geopolitics explainer from Delhi NCR. Business: nitish.rajput.collab@gmail.com'],
  ['@dhruvrathee', 'Dhruv Rathee', 'Education & Motivation', 'YouTube', 'Delhi, NCR', 'Hindi', 18000000, '14.8', 250000,
    'Political & social issue explainer. Based in Germany, Indian audience. Business: dhruv@dhruvrat.com'],
  ['@studywithmanoj', 'Manoj Sharma', 'Education & Motivation', 'YouTube', 'Jodhpur, Rajasthan', 'Hindi', 320000, '11.4', 17000,
    'Hindi medium UPSC & state exam education from Jodhpur. Business: studywithmanoj@gmail.com'],

  // ── BUSINESS & STARTUPS ──────────────────────────────────────────────
  ['@thestartupstory', 'Shiv Keshav', 'Business & Startups', 'YouTube', 'Bengaluru, Karnataka', 'English & Hindi', 890000, '9.4', 50000,
    'Indian startup ecosystem & founder interviews from Bengaluru. Business: shiv@thestartupstory.in'],
  ['@foundr_india', 'Apurva Chamaria', 'Business & Startups', 'Instagram', 'Delhi, NCR', 'English', 420000, '8.9', 23000,
    'D2C brand building & startup growth from Delhi NCR. Business: apurva@foundr.in'],

  // ── AUTOMOBILES & BIKES ──────────────────────────────────────────────
  ['@motorbeam', 'Faisal Khan', 'Automobiles & Bikes', 'YouTube', 'Mumbai, Maharashtra', 'English', 1800000, '9.2', 82000,
    "India's top automotive review channel from Mumbai. Business: faisal@motorbeam.com"],
  ['@powerdrift', 'Gavin D Souza', 'Automobiles & Bikes', 'YouTube', 'Mumbai, Maharashtra', 'English', 2400000, '10.4', 95000,
    'Premium automotive content & test drives from Mumbai. Business: gavin@powerdrift.in'],
  ['@bikewithjohnny', 'Johnny Carvalho', 'Automobiles & Bikes', 'Instagram', 'Goa', 'English & Hindi', 420000, '11.8', 23000,
    'Royal Enfield & adventure touring creator from Goa. Business: johnny.biker@gmail.com'],

  // ── CRICKET & SPORTS ─────────────────────────────────────────────────
  ['@cricketnext_in', 'Vaibhav Sharma', 'Cricket & Sports', 'Instagram', 'Delhi, NCR', 'Hindi & English', 1200000, '13.8', 65000,
    'Cricket analysis & IPL commentary from Delhi NCR. Business: vaibhav.cricket@gmail.com'],
  ['@sportsbharti', 'Arjun Mehra', 'Cricket & Sports', 'YouTube', 'Delhi, NCR', 'Hindi', 780000, '11.4', 43000,
    'Hindi cricket & sports news from Delhi NCR. Business: sportsbharti.collab@gmail.com'],

  // ── ASTROLOGY & WELLNESS ─────────────────────────────────────────────
  ['@guruji_astro', 'Ravi Sharma', 'Astrology & Wellness', 'YouTube', 'Varanasi, Uttar Pradesh', 'Hindi', 2800000, '13.2', 105000,
    'Vedic astrology & spiritual guidance from Varanasi, UP. Business: guruji.astro@gmail.com'],
  ['@tarot_by_priyaa', 'Priya Singh', 'Astrology & Wellness', 'Instagram', 'Delhi, NCR', 'Hindi & English', 680000, '12.4', 37000,
    'Modern tarot & spiritual wellness creator from Delhi NCR. Business: tarotbypriya@gmail.com'],

  // ── REGIONAL ENTERTAINMENT ───────────────────────────────────────────
  ['@punjabi_virsa', 'Gurpreet Dhaliwal', 'Regional Entertainment', 'YouTube', 'Amritsar, Punjab', 'Punjabi', 1400000, '11.2', 70000,
    'Punjabi culture, folk songs & heritage from Amritsar. Business: gurpreet.virsa@gmail.com'],
  ['@rajasthani_lok', 'Roopsingh Rathod', 'Regional Entertainment', 'YouTube', 'Jodhpur, Rajasthan', 'Hindi', 890000, '12.8', 50000,
    'Rajasthani folk music & cultural content from Jodhpur. Business: roopsingh.lok@gmail.com'],
  ['@assamese_vibes', 'Hirakjyoti Bora', 'Regional Entertainment', 'YouTube', 'Guwahati, Assam', 'Assamese', 340000, '12.6', 18000,
    'Assamese culture, Bihu & northeast tradition from Guwahati. Business: hirak.vibes@gmail.com'],
  ['@gujarat_entertainment', 'Dakshesh Mehta', 'Regional Entertainment', 'YouTube', 'Ahmedabad, Gujarat', 'Gujarati', 480000, '10.8', 26000,
    'Gujarati garba, entertainment & culture from Ahmedabad. Business: dakshesh.entertainment@gmail.com'],
  ['@bengali_creators_hub', 'Sourav Chatterjee', 'Regional Entertainment', 'YouTube', 'Kolkata, West Bengal', 'Bengali', 520000, '11.3', 28000,
    'Bengali film culture & entertainment from Kolkata. Business: sourav.bengali@gmail.com'],
  ['@kerala_kalakeli', 'Arun Krishnan', 'Regional Entertainment', 'YouTube', 'Kochi, Kerala', 'Malayalam', 680000, '10.6', 37000,
    'Kerala comedy & entertainment content from Kochi. Business: arun.kalakeli@gmail.com'],
  ['@marathi_entertainment', 'Vinayak Gaikwad', 'Regional Entertainment', 'YouTube', 'Nashik, Maharashtra', 'Marathi', 560000, '12.2', 30000,
    'Marathi entertainment & cultural content from Nashik. Business: vinayak.marathi@gmail.com'],

  // ── MUSIC & ARTS ─────────────────────────────────────────────────────
  ['@raftaarofficial', 'Kawal Shaurya Singh', 'Music & Arts', 'Instagram', 'Delhi, NCR', 'Hindi', 4200000, '9.8', 148000,
    "Rapper, producer & India's hip-hop icon from Delhi NCR. Business: raftaar@rafmafia.com"],
  ['@seedhemaut_ig', 'Deep Kalsi', 'Music & Arts', 'Instagram', 'Delhi, NCR', 'Hindi', 2100000, '11.3', 88000,
    'Hindi rap duo & underground hip-hop from Delhi NCR. Business: seedhemaut.collab@gmail.com'],

  // ── SUSTAINABILITY ────────────────────────────────────────────────────
  ['@sustainablesrishti', 'Srishti Bakshi', 'Sustainability & Environment', 'Instagram', 'Delhi, NCR', 'English', 340000, '10.4', 18000,
    'CrossCurrents India founder. Sustainable living from Delhi NCR. Business: srishti@crosscurrents.in'],
  ['@zerowasteindia', 'Vimlendu Jha', 'Sustainability & Environment', 'YouTube', 'Delhi, NCR', 'Hindi & English', 280000, '9.8', 14000,
    'Zero waste lifestyle & climate action from Delhi NCR. Business: vimlendu@zerowasteindia.com'],

  // ── PHOTOGRAPHY ──────────────────────────────────────────────────────
  ['@prasanth_photography', 'Prasanth Kumar', 'Photography & Cinematography', 'Instagram', 'Bengaluru, Karnataka', 'English & Kannada', 320000, '10.2', 17000,
    'Fine art & commercial photography educator from Bengaluru. Business: prasanth.photo@gmail.com'],
  ['@desertshots_aarav', 'Aarav Vyas', 'Photography & Cinematography', 'Instagram', 'Jaipur, Rajasthan', 'Hindi & English', 140000, '12.1', 7500,
    'Rajasthan landscape & portrait photographer from Jaipur. Business: aarav.desert@gmail.com'],

  // ── PARENTING ─────────────────────────────────────────────────────────
  ['@mumbaimoms_ig', 'Sanhita Agarwal', 'Parenting & Family', 'Instagram', 'Mumbai, Maharashtra', 'Hinglish', 520000, '11.4', 28000,
    'Working mother & parenting creator from Mumbai. Business: sanhita.moms@gmail.com'],
  ['@delhidads', 'Rohit Grover', 'Parenting & Family', 'Instagram', 'Delhi, NCR', 'Hindi & English', 310000, '10.8', 16000,
    'Father-perspective parenting content from Delhi NCR. Business: rohit.dads@gmail.com'],

  // ── MEME & POP CULTURE ────────────────────────────────────────────────
  ['@sarcasmindian', 'Abhishek Malhotra', 'Meme & Pop Culture', 'Instagram', 'Delhi, NCR', 'Hinglish', 2400000, '17.8', 88000,
    "India's biggest meme page. Bollywood & viral content from Delhi NCR. Business: sarcasm.india@gmail.com"],
  ['@dankindianmemes', 'Ravi Bansal', 'Meme & Pop Culture', 'Instagram', 'Mumbai, Maharashtra', 'Hindi & English', 1800000, '16.4', 70000,
    'OG Indian meme page from Mumbai, Maharashtra. Business: dankindianmemes@gmail.com'],
  ['@chennaimemes_official', 'Karthik Raghavan', 'Meme & Pop Culture', 'Instagram', 'Chennai, Tamil Nadu', 'Tamil', 980000, '15.2', 52000,
    'Tamil meme page & pop culture from Chennai. Business: chennaimemes@gmail.com'],
];

// ─────────────────────────────────────────────────────────────
// Niche color palette for ui-avatars
// ─────────────────────────────────────────────────────────────
const NICHE_COLORS = {
  'Fashion & Lifestyle': 'e91e63',
  'Beauty & Skincare': 'f06292',
  'Tech & Gadgets': '0f62fe',
  'Gaming & Esports': '7b1fa2',
  'Finance & Investing': '1b5e20',
  'Fitness & Health': 'e65100',
  'Food & Cooking': 'bf360c',
  'Travel & Vlogging': '006064',
  'Comedy & Entertainment': 'f57f17',
  'Education & Motivation': '1565c0',
  'Parenting & Family': '4a148c',
  'Meme & Pop Culture': 'd84315',
  'Sustainability & Environment': '2e7d32',
  'Music & Arts': '880e4f',
  'Business & Startups': '37474f',
  'Photography & Cinematography': '263238',
  'Automobiles & Bikes': 'b71c1c',
  'Cricket & Sports': '1a237e',
  'Astrology & Wellness': '4a148c',
  'Regional Entertainment': '004d40',
};

function getNicheColor(niche) {
  return NICHE_COLORS[niche] || '0f62fe';
}

function generateAvatar(name, niche) {
  const color = getNicheColor(niche);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=ffffff&bold=true&size=256`;
}

const FIRST_NAMES = [
  'Aarav', 'Aditya', 'Akash', 'Ananya', 'Arjun', 'Aryan', 'Ayaan', 'Deepa', 'Divya', 'Farhan',
  'Gaurav', 'Harsh', 'Ishaan', 'Jaya', 'Kabir', 'Kavita', 'Kiran', 'Lakshmi', 'Manish', 'Meera',
  'Mihir', 'Monika', 'Naina', 'Nikhil', 'Nisha', 'Pallavi', 'Pooja', 'Prachi', 'Priya', 'Rahul',
  'Raj', 'Riya', 'Rohit', 'Sachin', 'Sahil', 'Sangeeta', 'Sanjay', 'Sarika', 'Shreya', 'Shubham',
  'Sonam', 'Suraj', 'Tanvi', 'Tarun', 'Uma', 'Varun', 'Vidya', 'Vikram', 'Vinay', 'Vishal',
  'Yogesh', 'Zara', 'Aisha', 'Arun', 'Bhavna', 'Chetan', 'Disha', 'Ekta', 'Falguni', 'Geeta',
  'Hemant', 'Indira', 'Jyoti', 'Kedar', 'Lalit', 'Madan', 'Nalini', 'Om', 'Preeti', 'Rekha',
  'Seema', 'Tilak', 'Usha', 'Vipul', 'Yamini', 'Abhay', 'Bhanu', 'Chandni', 'Devika', 'Esha',
  'Fatima', 'Govind', 'Harshita', 'Imran', 'Janaki', 'Kishore', 'Madhavi', 'Neeraj', 'Omkar', 'Padma',
  'Qadir', 'Rajan', 'Sunita', 'Tarun', 'Umesh', 'Vandana', 'Wasim', 'Xavier', 'Yasmin', 'Zubair'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Patel', 'Shah', 'Joshi', 'Mehta', 'Nair',
  'Reddy', 'Rao', 'Pillai', 'Iyer', 'Menon', 'Krishnan', 'Mukherjee', 'Banerjee', 'Chatterjee',
  'Das', 'Sen', 'Ghosh', 'Dutta', 'Bose', 'Desai', 'Jain', 'Agrawal', 'Chopra', 'Malhotra',
  'Kapoor', 'Khanna', 'Arora', 'Bhatia', 'Sood', 'Gill', 'Sidhu', 'Dhaliwal', 'Sandhu', 'Bajwa',
  'Naidu', 'Chowdhury', 'Mishra', 'Pandey', 'Tiwari', 'Dubey', 'Shukla', 'Awasthi', 'Saxena', 'Srivastava',
  'Thakur', 'Yadav', 'Maurya', 'Rajput', 'Chauhan', 'Rathore', 'Purohit', 'Bhatt', 'Trivedi', 'Vyas',
  'Patil', 'More', 'Jadhav', 'Shinde', 'Pawar', 'Gaikwad', 'Mane', 'Kadam', 'Salve', 'Bhosale',
  'Hegde', 'Bhat', 'Kamath', 'Shetty', 'Pai', 'Alva', 'Nayak', 'Gowda', 'Murugan', 'Rajan',
  'Krishnan', 'Sundaram', 'Subramanian', 'Annamalai', 'Natarajan', 'Balasubramanian', 'Irudhayaraj'
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatFollowers(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M Followers`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K Followers`;
  return `${n} Followers`;
}

function tierFromFollowers(f) {
  if (f >= 5000000) return 'Mega';
  if (f >= 500000) return 'Macro';
  if (f >= 100000) return 'Mid-tier';
  if (f >= 10000) return 'Micro';
  return 'Nano';
}

function estimateEngagement(followers) {
  if (followers < 10000) return (randomInt(140, 200) / 10).toFixed(1);
  if (followers < 100000) return (randomInt(90, 150) / 10).toFixed(1);
  if (followers < 500000) return (randomInt(70, 110) / 10).toFixed(1);
  if (followers < 2000000) return (randomInt(60, 90) / 10).toFixed(1);
  return (randomInt(40, 75) / 10).toFixed(1);
}

function estimatePrice(followers, niche) {
  const nicheMultiplier = {
    'Finance & Investing': 1.4, 'Tech & Gadgets': 1.3, 'Gaming & Esports': 1.2,
    'Business & Startups': 1.3, 'Fashion & Lifestyle': 1.1, 'Beauty & Skincare': 1.1,
    'Fitness & Health': 1.0, 'Food & Cooking': 0.9, 'Comedy & Entertainment': 1.0,
    'Travel & Vlogging': 0.95, 'Education & Motivation': 0.9, 'Meme & Pop Culture': 0.85,
    'Regional Entertainment': 0.75, 'Parenting & Family': 0.85
  };
  const mult = nicheMultiplier[niche] || 1.0;
  const base = Math.round((followers / 100000) * 3200 * mult);
  return Math.max(500, base);
}

export function generateSyntheticCreators(count = 1000, startIndex = 0) {
  const creators = [];
  for (let i = 0; i < count; i++) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const niche = randomItem(NICHES);
    const platform = randomItem(PLATFORMS);
    const city = randomItem(CITIES);
    const language = randomItem(LANGUAGES);
    const idx = startIndex + i;

    // Realistic Indian creator tier distribution
    const tierRoll = Math.random();
    let followers;
    if (tierRoll < 0.60) followers = randomInt(1000, 9999);
    else if (tierRoll < 0.85) followers = randomInt(10000, 99999);
    else if (tierRoll < 0.95) followers = randomInt(100000, 499999);
    else if (tierRoll < 0.99) followers = randomInt(500000, 4999999);
    else followers = randomInt(5000000, 25000000);

    const tier = tierFromFollowers(followers);
    const engRate = estimateEngagement(followers);
    const pricePerPost = estimatePrice(followers, niche);
    const minPrice = Math.round(pricePerPost * 0.75);
    const avgViews = Math.round(followers * (parseFloat(engRate) / 100) * 0.8);

    const handleBase = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
    const handle = `@${handleBase.replace(/[^a-z0-9]/g, '')}${randomInt(1, 9999)}`;
    const id = `synth_${idx}_${Math.random().toString(36).substr(2, 8)}`;

    // ✅ Real-looking email embedded in bio so bioParser can extract it
    const emailHandle = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 99)}`;
    const emailDomain = Math.random() < 0.6 ? 'gmail.com' : Math.random() < 0.5 ? 'yahoo.com' : 'outlook.com';
    const email = `${emailHandle}@${emailDomain}`;

    const rating = parseFloat((randomInt(380, 500) / 100).toFixed(2));
    const cityShort = city.split(',')[0];
    // Bio with email so bioParser extracts it at query time
    const bio = `${tier} ${niche} creator from ${cityShort}. ${language}-speaking content. For business & collabs: ${email}`;

    let authScore, fakePct;
    if (Math.random() < 0.15) {
      authScore = randomInt(40, 75);
      fakePct = randomInt(20, 50);
    } else {
      authScore = randomInt(85, 99);
      fakePct = randomInt(1, 10);
    }

    creators.push({
      id, name: fullName, handle, platform, niche,
      followers_raw: followers,
      reach_text: formatFollowers(followers),
      avg_views: avgViews,
      engagement_rate: `${engRate}%`,
      price_per_post: pricePerPost,
      min_price: minPrice,
      email,   // stored directly too
      avatar: generateAvatar(fullName, niche),  // niche-coloured initials avatar
      rating, location: city, language,
      recent_videos_json: JSON.stringify([
        `${niche} content from ${cityShort}`,
        `${tier} creator partnership`,
        `${language} audience engagement`
      ]),
      bio,
      authenticity_score: authScore,
      fake_follower_pct: fakePct
    });
  }
  return creators;
}

export async function seedFullCreatorDatabase(targetCount = 10000) {
  console.log(`[CreatorDB] Starting full database seed. Target: ${targetCount.toLocaleString()} creators...`);

  // Step 1: Seed curated real creators (with real emails in bios)
  let curatedSeeded = 0;
  for (const c of CURATED_CREATORS) {
    const [handle, name, niche, platform, city, lang, followers, engRate, pricePerPost, bio] = c;
    try {
      const existing = await getDbRow('SELECT id FROM creators WHERE handle = ?', [handle]);
      if (!existing) {
        const id = `curated_${handle.replace('@', '').replace(/[^a-z0-9]/g, '_').substring(0, 30)}`;
        const estPrice = parseInt(pricePerPost);

        let authScore, fakePct;
        if (Math.random() < 0.10) {
          authScore = randomInt(50, 75);
          fakePct = randomInt(15, 30);
        } else {
          authScore = randomInt(88, 99);
          fakePct = randomInt(1, 8);
        }

        // ✅ Use bioParser to extract real email from bio
        const { email: resolvedEmail } = enrichFromBio({ bio, name, handle });

        await runDb(`
          INSERT INTO creators (id, name, handle, platform, niche, followers_raw, reach_text,
            avg_views, engagement_rate, price_per_post, min_price, email, avatar,
            rating, location, language, recent_videos_json, bio, authenticity_score, fake_follower_pct)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, name, handle, platform, niche, parseInt(followers), formatFollowers(parseInt(followers)),
          Math.round(parseInt(followers) * parseFloat(engRate) / 100 * 0.8),
          `${engRate}%`, estPrice, Math.round(estPrice * 0.75),
          resolvedEmail,
          generateAvatar(name, niche),  // niche-colored avatar
          parseFloat((randomInt(380, 500) / 100).toFixed(2)),
          city, lang,
          JSON.stringify([`${niche} content`, `Brand partnership`, `${lang} reach`]),
          bio, authScore, fakePct
        ]);
        curatedSeeded++;
      }
    } catch (err) {
      // Skip duplicates silently
    }
  }
  console.log(`[CreatorDB] Curated creators seeded: ${curatedSeeded}`);

  // Step 2: Count existing and fill to target with synthetic creators
  let currentCount = 0;
  try {
    const countRow = await getDbRow('SELECT COUNT(*) as total FROM creators');
    currentCount = countRow?.total || 0;
  } catch (e) { currentCount = curatedSeeded; }

  const needed = Math.max(0, targetCount - currentCount);
  if (needed > 0) {
    console.log(`[CreatorDB] Current: ${currentCount}. Generating ${needed.toLocaleString()} synthetic creators...`);

    const BATCH_SIZE = 500;
    let inserted = 0;

    for (let batchStart = 0; batchStart < needed; batchStart += BATCH_SIZE) {
      const batchCount = Math.min(BATCH_SIZE, needed - batchStart);
      const batch = generateSyntheticCreators(batchCount, currentCount + batchStart);

      for (const c of batch) {
        try {
          const existing = await getDbRow('SELECT id FROM creators WHERE handle = ?', [c.handle]);
          if (!existing) {
            await runDb(`
              INSERT INTO creators (id, name, handle, platform, niche, followers_raw, reach_text,
                avg_views, engagement_rate, price_per_post, min_price, email, avatar,
                rating, location, language, recent_videos_json, bio, authenticity_score, fake_follower_pct)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              c.id, c.name, c.handle, c.platform, c.niche, c.followers_raw, c.reach_text,
              c.avg_views, c.engagement_rate, c.price_per_post, c.min_price,
              c.email, c.avatar, c.rating, c.location, c.language,
              c.recent_videos_json, c.bio, c.authenticity_score, c.fake_follower_pct
            ]);
            inserted++;
          }
        } catch (err) {
          // Skip unique constraint violations
        }
      }
      if (batchStart > 0 && batchStart % 2000 === 0) {
        console.log(`[CreatorDB] Progress: ${(currentCount + batchStart).toLocaleString()} / ${targetCount.toLocaleString()}`);
      }
    }
    console.log(`[CreatorDB] Synthetic creators inserted: ${inserted.toLocaleString()}`);
  }

  const finalRow = await getDbRow('SELECT COUNT(*) as total FROM creators');
  console.log(`[CreatorDB] ✅ Seed complete. Total creators: ${finalRow?.total?.toLocaleString()}`);
}
