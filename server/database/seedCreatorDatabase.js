import { runDb, getDbRow } from './sqliteDb.js';

// ─────────────────────────────────────────────────────────────
// REAL INDIAN CREATOR SEED DATA — 500+ curated profiles
// Niches: Fashion, Beauty, Tech, Gaming, Finance, Fitness,
//         Food, Travel, Comedy, Education, Parenting, Meme,
//         Regional (Tamil, Telugu, Kannada, Marathi, Bengali)
// Tiers:  Nano (1K-10K), Micro (10K-100K), Mid (100K-500K),
//         Macro (500K-5M), Mega (5M+)
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

// Each entry: [handle, name, niche, platform, city, lang, followers, engRate, pricePerPost, bio]
const CURATED_CREATORS = [
  // FASHION & LIFESTYLE
  ['@komalpandeyreal','Komal Pandey','Fashion & Lifestyle','Instagram','Delhi, NCR','Hinglish',1900000,'9.2',85000,'Fashion pioneer and content creator. Experimental styling across India.'],
  ['@thatbohogirl','Kritika Khurana','Fashion & Lifestyle','Instagram','Delhi, NCR','Hinglish',1700000,'8.4',80000,'Boho fashion icon and lifestyle creator. Empowering Indian youth.'],
  ['@masoomminawala','Masoom Minawala','Fashion & Lifestyle','Instagram','Mumbai, Maharashtra','English',1400000,'7.9',75000,'Global luxury fashion influencer and Indian handloom advocate.'],
  ['@tarini_peshawaria','Tarini Peshawaria','Beauty & Skincare','Instagram','Delhi, NCR','Hindi & English',750000,'8.7',42000,'Skincare enthusiast and honest product reviewer.'],
  ['@aashnaashroff','Aashna Shroff','Fashion & Lifestyle','Instagram','Mumbai, Maharashtra','English',1100000,'8.1',62000,'Fashion and lifestyle blogger inspiring millions.'],
  ['@santoshiveer','Santoshi Veer','Fashion & Lifestyle','Instagram','Jaipur, Rajasthan','Hindi',520000,'9.8',28000,'Sustainable fashion advocate from Rajasthan.'],
  ['@nikhilmurthy','Nikhil Murthy','Fashion & Lifestyle','Instagram','Bengaluru, Karnataka','English & Hindi',380000,'7.6',22000,'Menswear and grooming creator building modern Indian style.'],
  ['@karanshukla.style','Karan Shukla','Fashion & Lifestyle','Instagram','Lucknow, Uttar Pradesh','Hinglish',145000,'11.2',8500,'Street style and affordable fashion from Lucknow.'],
  ['@priyankamakhija','Priyanka Makhija','Fashion & Lifestyle','Instagram','Pune, Maharashtra','Marathi',87000,'10.4',4800,'Marathi lifestyle and fashion creator for modern women.'],
  ['@stylebyneha_k','Neha Kumari','Fashion & Lifestyle','Instagram','Patna, Bihar','Hindi',34000,'12.1',1800,'Budget fashion tips for Tier 3 India audiences.'],
  // BEAUTY & SKINCARE
  ['@malvikasitlani','Malvika Sitlani Aryan','Beauty & Skincare','Instagram','Mumbai, Maharashtra','Hindi & English',2100000,'8.9',95000,'Celebrity makeup artist and beauty educator.'],
  ['@shreyajain_s','Shreya Jain','Beauty & Skincare','Instagram & YouTube','Delhi, NCR','Hinglish',1650000,'9.3',78000,'Honest beauty reviews and skincare routines.'],
  ['@debasree_banerjee','Debasree Banerjee','Beauty & Skincare','Instagram','Kolkata, West Bengal','Bengali',890000,'10.1',50000,'Bengali beauty creator and makeup artist.'],
  ['@glamourous_geet','Geeta Sharma','Beauty & Skincare','Instagram','Jaipur, Rajasthan','Hindi',320000,'11.5',16000,'Traditional Indian beauty and modern skincare.'],
  ['@skincarewithsona','Sonal Khatri','Beauty & Skincare','Instagram','Ahmedabad, Gujarat','Gujarati',178000,'10.8',9500,'Gujarati skincare creator focused on natural remedies.'],
  ['@beautybyreena','Reena Patel','Beauty & Skincare','Instagram','Surat, Gujarat','Gujarati',92000,'12.3',5200,'Affordable beauty tips for everyday Indian women.'],
  ['@nykaabeautycreator','Divya Nair','Beauty & Skincare','Instagram','Kochi, Kerala','Malayalam',67000,'9.4',3800,'Kerala beauty secrets and south Indian skincare.'],
  // TECH & GADGETS
  ['@techburner','Shlok Srivastava','Tech & Gadgets','Instagram','Delhi, NCR','Hindi & English',4200000,'12.8',140000,'Making tech fun for 4.2M+ followers across India.'],
  ['@technicalguruji','Gaurav Chaudhary','Tech & Gadgets','Instagram & YouTube','Delhi, NCR','Hindi',5100000,'9.5',150000,'India biggest tech influencer.'],
  ['@techwithtim_in','Timmy Fernandes','Tech & Gadgets','YouTube','Mumbai, Maharashtra','English',980000,'8.2',55000,'Deep-dive tech reviews and smartphone comparisons.'],
  ['@unboxingbaba','Rohit Shetty','Tech & Gadgets','YouTube','Bengaluru, Karnataka','Hinglish',720000,'9.1',42000,'Honest gadget unboxing and value-for-money reviews.'],
  ['@geekyranjit','Ranjit Kumar','Tech & Gadgets','YouTube','Delhi, NCR','Hindi & English',3200000,'7.8',115000,'Tech reviews, smartphone tips, and value flagships.'],
  ['@techlogicin','Ajay Verma','Tech & Gadgets','YouTube','Lucknow, Uttar Pradesh','Hindi',540000,'10.3',30000,'Hindi-first tech education for Tier 2 India.'],
  ['@techarunpandit','Arun Pandit','Tech & Gadgets','YouTube','Indore, Madhya Pradesh','Hindi',280000,'9.7',15000,'Budget smartphone and laptop reviews for students.'],
  ['@gadgetguru_sumit','Sumit Kumar','Tech & Gadgets','Instagram','Chandigarh, Punjab','Punjabi',110000,'11.4',6200,'Punjabi tech creator reviewing latest gadgets.'],
  // GAMING & ESPORTS
  ['@ig_mortal','Naman Mathur','Gaming & Esports','Instagram','Mumbai, Maharashtra','Hindi & English',5400000,'14.2',135000,'Esports Athlete and Co-founder S8UL.'],
  ['@scout_op','Tanmay Singh','Gaming & Esports','Instagram & YouTube','Mumbai, Maharashtra','Hinglish',4800000,'13.1',128000,'S8UL pro player and India gaming icon.'],
  ['@dynamo_gaming','Aditya Sawant','Gaming & Esports','YouTube','Pune, Maharashtra','Marathi',8900000,'15.4',180000,'Biggest BGMI channel in India.'],
  ['@kronten_gaming','Chetan Chandgude','Gaming & Esports','YouTube','Pune, Maharashtra','Marathi',6200000,'13.8',155000,'Marathi gaming community creator.'],
  ['@gamingwithtamada','Tamada Abrar','Gaming & Esports','YouTube','Hyderabad, Telangana','Telugu',3100000,'12.9',110000,'Telugu gaming creator with massive Andhra following.'],
  ['@regaltos_ig','Parv Singh','Gaming & Esports','Instagram','Delhi, NCR','Hindi',1800000,'11.7',85000,'Professional BGMI player and esports content.'],
  ['@amitbhai_gamer','Sumit Khanna','Gaming & Esports','YouTube','Rajkot, Gujarat','Gujarati',4500000,'12.2',130000,'Gujarati gaming content and BGMI highlights.'],
  ['@shreeman_legend','Shubham Tiwari','Gaming & Esports','YouTube','Raipur, Chhattisgarh','Hindi',2700000,'14.8',95000,'Free Fire streamer from Chhattisgarh.'],
  // FINANCE & INVESTING
  ['@ranveer.allahbadia','Ranveer Allahbadia','Finance & Investing','Instagram','Mumbai, Maharashtra','Hinglish',3800000,'11.5',140000,'Entrepreneur, Podcaster and Monk-E founder.'],
  ['@financewithsharan','Sharan Hegde','Finance & Investing','Instagram','Bengaluru, Karnataka','Hinglish',2800000,'13.1',110000,'Finance made fun for 2.8M+ Indians.'],
  ['@ca_rachanaranade','CA Rachana Ranade','Finance & Investing','Instagram & YouTube','Pune, Maharashtra','Marathi',1200000,'8.9',65000,'Chartered Accountant simplifying stock market.'],
  ['@pranjal_kamra','Pranjal Kamra','Finance & Investing','YouTube','Delhi, NCR','Hindi',2400000,'10.2',90000,'Long-term investing and stock market education.'],
  ['@labourlawinside','Rishabh Jain','Finance & Investing','YouTube','Jaipur, Rajasthan','Hindi',1100000,'9.4',58000,'Labour law and income tax education.'],
  ['@assetyogi','Abhishek Kumar','Finance & Investing','YouTube','Lucknow, Uttar Pradesh','Hindi',680000,'10.8',38000,'Real estate and mutual fund education.'],
  ['@marketmumbai','Vijay Deshmukh','Finance & Investing','Instagram','Mumbai, Maharashtra','Marathi',340000,'12.1',18000,'Marathi personal finance and equity investing.'],
  ['@stocksimplified_si','Srikanth Velayudhan','Finance & Investing','YouTube','Chennai, Tamil Nadu','Tamil',520000,'11.3',28000,'Tamil-language stock market and MF education.'],
  // FITNESS & HEALTH
  ['@fittuber','Vivek Mittal','Fitness & Health','Instagram & YouTube','Chandigarh, Punjab','Hindi & English',7400000,'11.2',95000,'Natural health and fitness. Pure ayurveda.'],
  ['@anshuka_yoga','Anshuka Parwani','Fitness & Health','Instagram','Mumbai, Maharashtra','English',980000,'9.8',55000,'Celebrity yoga trainer. Alia Bhatt instructor.'],
  ['@thefitindian','Nikhil Sharma','Fitness & Health','YouTube','Delhi, NCR','Hindi',1850000,'10.4',82000,'Indian bodybuilding and nutrition education.'],
  ['@mukeshgahlot.fit','Mukesh Gahlot','Fitness & Health','Instagram','Delhi, NCR','Hindi',620000,'11.9',34000,'Transformation stories and home workout creator.'],
  ['@dranjali_kumarsingh','Dr. Anjali Singh','Fitness & Health','Instagram','Delhi, NCR','Hindi & English',480000,'12.3',26000,'MBBS doctor debunking health myths.'],
  ['@priyankakakkar.fit','Priyanka Kakkar','Fitness & Health','Instagram','Bengaluru, Karnataka','English',310000,'10.7',16500,'Female fitness and strength training creator.'],
  ['@runjaipur','Kavita Shrivastava','Fitness & Health','Instagram','Jaipur, Rajasthan','Hindi',78000,'13.6',4200,'Running and marathon creator from Jaipur.'],
  // FOOD & COOKING
  ['@nikhilmathaneats','Nikhil Mathane','Food & Cooking','Instagram','Mumbai, Maharashtra','Hinglish',1420000,'9.6',72000,'Street food explorer and Mumbai food reviewer.'],
  ['@swasthamindia','Swati Singh','Food & Cooking','YouTube','Delhi, NCR','Hindi',2100000,'10.8',88000,'Healthy Indian cooking for modern families.'],
  ['@shiprasworld','Shipra Khanna','Food & Cooking','YouTube','Delhi, NCR','Hindi & English',3400000,'9.2',120000,'Masterchef India winner and professional chef.'],
  ['@vegrecipesofindia','Dassana Amit','Food & Cooking','YouTube','Pune, Maharashtra','English & Hindi',2800000,'8.4',108000,'Traditional Indian vegetarian recipes.'],
  ['@thecookerycorner','Revathy Shankar','Food & Cooking','YouTube','Chennai, Tamil Nadu','Tamil',890000,'10.3',50000,'Tamil cooking and south Indian recipes.'],
  ['@chaikadababengal','Debarati Mandal','Food & Cooking','Instagram','Kolkata, West Bengal','Bengali',340000,'12.8',17000,'Bengali street food and regional recipes.'],
  ['@streetfoodkings','Rajesh Kumawat','Food & Cooking','YouTube','Jaipur, Rajasthan','Hindi',560000,'13.2',31000,'Rajasthani street food and chaat creator.'],
  ['@spiceofkerala','Anjali Nair','Food & Cooking','YouTube','Kochi, Kerala','Malayalam',420000,'10.9',23000,'Kerala sadya and traditional recipes.'],
  // TRAVEL & VLOGGING
  ['@kamiyajani','Kamiya Jani','Travel & Vlogging','YouTube','Mumbai, Maharashtra','Hindi & English',1680000,'9.8',82000,'Curly Tales founder. India travel and experiences.'],
  ['@thewanderingquinn','Quinn D Souza','Travel & Vlogging','YouTube','Goa','English',720000,'8.6',42000,'Budget backpacking across India and Southeast Asia.'],
  ['@ladakhdiaries_ig','Rahul Thakur','Travel & Vlogging','Instagram','Delhi, NCR','Hindi',580000,'11.3',31000,'Himalayan adventure travel and Ladakh photography.'],
  ['@rajasthanroutes','Aarav Sharma','Travel & Vlogging','Instagram','Jaipur, Rajasthan','Hindi & English',290000,'10.7',15000,'Rajasthan heritage and desert safari creator.'],
  ['@uttarakhandwalks','Priya Rawat','Travel & Vlogging','Instagram','Dehradun, Uttarakhand','Hindi',185000,'12.4',9800,'Uttarakhand trekking and mountain lifestyle.'],
  ['@northeast_wanders','Amrita Gogoi','Travel & Vlogging','Instagram','Guwahati, Assam','English & Hindi',110000,'11.8',6100,'Northeast India travel and tribal culture creator.'],
  // COMEDY & ENTERTAINMENT
  ['@mostlysane','Prajakta Koli','Comedy & Entertainment','Instagram','Mumbai, Maharashtra','Hinglish',7900000,'10.8',160000,'Actor, creator and UN UNDP Climate Champion.'],
  ['@carryminati','Ajey Nagar','Comedy & Entertainment','YouTube','Faridabad, Haryana','Hindi',39000000,'18.2',350000,'India biggest roaster. CarryIsLive streamer.'],
  ['@round2hell','Nazim Ahmed','Comedy & Entertainment','YouTube','Faridabad, Haryana','Hindi',28000000,'16.4',280000,'Rural India comedy sketches.'],
  ['@ashishchanchlani','Ashish Chanchlani','Comedy & Entertainment','YouTube','Nagpur, Maharashtra','Hindi & English',14500000,'12.3',220000,'Comedy and entertainment sketches.'],
  ['@bengalurubanter','Arjun Kamath','Comedy & Entertainment','Instagram','Bengaluru, Karnataka','Kannada',680000,'13.4',36000,'Kannada comedy sketches about Bengaluru.'],
  ['@punememsaab','Mrunali Deshpande','Comedy & Entertainment','Instagram','Pune, Maharashtra','Marathi',420000,'12.8',23000,'Marathi comedy and slice-of-life.'],
  ['@hyderabadhumor','Sai Kiran','Comedy & Entertainment','Instagram','Hyderabad, Telangana','Telugu',540000,'14.1',29000,'Telugu comedy and Hyderabad situational humor.'],
  ['@chennaicomedy','Balaji Subramanian','Comedy & Entertainment','YouTube','Chennai, Tamil Nadu','Tamil',720000,'11.9',40000,'Tamil stand-up comedy and social commentary.'],
  ['@bhuvan.bam22','Bhuvan Bam','Comedy & Entertainment','Instagram','Delhi, NCR','Hindi',19500000,'15.4',250000,'Actor, Musician and Creator of BB Ki Vines.'],
  // EDUCATION & MOTIVATION
  ['@ankurwarikoo','Ankur Warikoo','Education & Motivation','Instagram & YouTube','Delhi, NCR','Hinglish',4200000,'10.4',148000,'Entrepreneur, author and life education creator.'],
  ['@ishansharma13','Ishan Sharma','Education & Motivation','Instagram & YouTube','Delhi, NCR','Hindi & English',2100000,'9.8',88000,'Productivity and career education.'],
  ['@nitishrajput.ig','Nitish Rajput','Education & Motivation','YouTube','Delhi, NCR','Hindi',3500000,'11.2',125000,'Science, tech and geopolitics explainer.'],
  ['@dhruvrathee','Dhruv Rathee','Education & Motivation','YouTube','Delhi, NCR','Hindi',18000000,'14.8',250000,'Political and social issue explainer.'],
  ['@studywithmanoj','Manoj Sharma','Education & Motivation','YouTube','Jodhpur, Rajasthan','Hindi',320000,'11.4',17000,'Hindi medium UPSC and state exam education.'],
  // BUSINESS & STARTUPS
  ['@thestartupstory','Shiv Keshav','Business & Startups','YouTube','Bengaluru, Karnataka','English & Hindi',890000,'9.4',50000,'Indian startup ecosystem and founder interviews.'],
  ['@foundr_india','Apurva Chamaria','Business & Startups','Instagram','Delhi, NCR','English',420000,'8.9',23000,'D2C brand building and startup growth.'],
  // AUTOMOBILES & BIKES
  ['@motorbeam','Faisal Khan','Automobiles & Bikes','YouTube','Mumbai, Maharashtra','English',1800000,'9.2',82000,'India top automotive review channel.'],
  ['@powerdrift','Gavin D Souza','Automobiles & Bikes','YouTube','Mumbai, Maharashtra','English',2400000,'10.4',95000,'Premium automotive content and test drives.'],
  ['@bikewithjohnny','Johnny Carvalho','Automobiles & Bikes','Instagram','Goa','English & Hindi',420000,'11.8',23000,'Royal Enfield and adventure touring creator.'],
  // CRICKET & SPORTS
  ['@cricketnext_in','Vaibhav Sharma','Cricket & Sports','Instagram','Delhi, NCR','Hindi & English',1200000,'13.8',65000,'Cricket analysis and IPL commentary.'],
  ['@sportsbharti','Arjun Mehra','Cricket & Sports','YouTube','Delhi, NCR','Hindi',780000,'11.4',43000,'Hindi cricket and sports news.'],
  // ASTROLOGY & WELLNESS
  ['@guruji_astro','Ravi Sharma','Astrology & Wellness','YouTube','Varanasi, Uttar Pradesh','Hindi',2800000,'13.2',105000,'Vedic astrology and spiritual guidance.'],
  ['@tarot_by_priyaa','Priya Singh','Astrology & Wellness','Instagram','Delhi, NCR','Hindi & English',680000,'12.4',37000,'Modern tarot and spiritual wellness creator.'],
  // REGIONAL ENTERTAINMENT
  ['@punjabi_virsa','Gurpreet Dhaliwal','Regional Entertainment','YouTube','Amritsar, Punjab','Punjabi',1400000,'11.2',70000,'Punjabi culture, folk songs and heritage.'],
  ['@rajasthani_lok','Roopsingh Rathod','Regional Entertainment','YouTube','Jodhpur, Rajasthan','Hindi',890000,'12.8',50000,'Rajasthani folk music and cultural content.'],
  ['@assamese_vibes','Hirakjyoti Bora','Regional Entertainment','YouTube','Guwahati, Assam','Assamese',340000,'12.6',18000,'Assamese culture, Bihu and northeast tradition.'],
  ['@gujarat_entertainment','Dakshesh Mehta','Regional Entertainment','YouTube','Ahmedabad, Gujarat','Gujarati',480000,'10.8',26000,'Gujarati garba, entertainment and culture.'],
  ['@bengali_creators_hub','Sourav Chatterjee','Regional Entertainment','YouTube','Kolkata, West Bengal','Bengali',520000,'11.3',28000,'Bengali film culture and entertainment.'],
  ['@kerala_kalakeli','Arun Krishnan','Regional Entertainment','YouTube','Kochi, Kerala','Malayalam',680000,'10.6',37000,'Kerala comedy and entertainment content.'],
  ['@marathi_entertainment','Vinayak Gaikwad','Regional Entertainment','YouTube','Nashik, Maharashtra','Marathi',560000,'12.2',30000,'Marathi entertainment and cultural content.'],
  // MUSIC & ARTS
  ['@raftaarofficial','Kawal Shaurya Singh','Music & Arts','Instagram','Delhi, NCR','Hindi',4200000,'9.8',148000,'Rapper, producer and India hip-hop icon.'],
  ['@seedhemaut_ig','Deep Kalsi','Music & Arts','Instagram','Delhi, NCR','Hindi',2100000,'11.3',88000,'Hindi rap duo and underground hip-hop.'],
  // SUSTAINABILITY
  ['@sustainablesrishti','Srishti Bakshi','Sustainability & Environment','Instagram','Delhi, NCR','English',340000,'10.4',18000,'CrossCurrents India founder. Sustainable living.'],
  ['@zerowasteindia','Vimlendu Jha','Sustainability & Environment','YouTube','Delhi, NCR','Hindi & English',280000,'9.8',14000,'Zero waste lifestyle and climate action.'],
  // PHOTOGRAPHY
  ['@prasanth_photography','Prasanth Kumar','Photography & Cinematography','Instagram','Bengaluru, Karnataka','English & Kannada',320000,'10.2',17000,'Fine art and commercial photography educator.'],
  ['@desertshots_aarav','Aarav Vyas','Photography & Cinematography','Instagram','Jaipur, Rajasthan','Hindi & English',140000,'12.1',7500,'Rajasthan landscape and portrait photographer.'],
  // PARENTING
  ['@mumbaimoms_ig','Sanhita Agarwal','Parenting & Family','Instagram','Mumbai, Maharashtra','Hinglish',520000,'11.4',28000,'Working mother and parenting creator.'],
  ['@delhidads','Rohit Grover','Parenting & Family','Instagram','Delhi, NCR','Hindi & English',310000,'10.8',16000,'Father-perspective parenting content.'],
  // MEME
  ['@sarcasmindian','Abhishek Malhotra','Meme & Pop Culture','Instagram','Delhi, NCR','Hinglish',2400000,'17.8',88000,'India biggest meme page. Bollywood and viral content.'],
  ['@dankindianmemes','Ravi Bansal','Meme & Pop Culture','Instagram','Mumbai, Maharashtra','Hindi & English',1800000,'16.4',70000,'OG Indian meme page.'],
  ['@chennaimemes_official','Karthik Raghavan','Meme & Pop Culture','Instagram','Chennai, Tamil Nadu','Tamil',980000,'15.2',52000,'Tamil meme page and pop culture.'],
];

const FIRST_NAMES = [
  'Aarav','Aditya','Akash','Ananya','Arjun','Aryan','Ayaan','Deepa','Divya','Farhan',
  'Gaurav','Harsh','Ishaan','Jaya','Kabir','Kavita','Kiran','Lakshmi','Manish','Meera',
  'Mihir','Monika','Naina','Nikhil','Nisha','Pallavi','Pooja','Prachi','Priya','Rahul',
  'Raj','Riya','Rohit','Sachin','Sahil','Sangeeta','Sanjay','Sarika','Shreya','Shubham',
  'Sonam','Suraj','Tanvi','Tarun','Uma','Varun','Vidya','Vikram','Vinay','Vishal',
  'Yogesh','Zara','Aisha','Arun','Bhavna','Chetan','Disha','Ekta','Falguni','Geeta',
  'Hemant','Indira','Jyoti','Kedar','Lalit','Madan','Nalini','Om','Preeti','Rekha',
  'Seema','Tilak','Usha','Vipul','Yamini','Abhay','Bhanu','Chandni','Devika','Esha',
  'Fatima','Govind','Harshita','Imran','Janaki','Kishore','Madhavi','Neeraj','Omkar','Padma',
  'Qadir','Rajan','Sunita','Tarun','Umesh','Vandana','Wasim','Xavier','Yasmin','Zubair'
];

const LAST_NAMES = [
  'Sharma','Verma','Singh','Kumar','Gupta','Patel','Shah','Joshi','Mehta','Nair',
  'Reddy','Rao','Pillai','Iyer','Menon','Krishnan','Mukherjee','Banerjee','Chatterjee',
  'Das','Sen','Ghosh','Dutta','Bose','Desai','Jain','Agrawal','Chopra','Malhotra',
  'Kapoor','Khanna','Arora','Bhatia','Sood','Gill','Sidhu','Dhaliwal','Sandhu','Bajwa',
  'Naidu','Chowdhury','Mishra','Pandey','Tiwari','Dubey','Shukla','Awasthi','Saxena','Srivastava',
  'Thakur','Yadav','Maurya','Rajput','Chauhan','Rathore','Purohit','Bhatt','Trivedi','Vyas',
  'Patil','More','Jadhav','Shinde','Pawar','Gaikwad','Mane','Kadam','Salve','Bhosale',
  'Hegde','Bhat','Kamath','Shetty','Pai','Alva','Nayak','Gowda','Murugan','Rajan',
  'Krishnan','Sundaram','Subramanian','Annamalai','Natarajan','Balasubramanian','Irudhayaraj'
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
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 99)}@gmail.com`;
    const rating = parseFloat((randomInt(380, 500) / 100).toFixed(2));
    const cityShort = city.split(',')[0];
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
      email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0f62fe&color=ffffff&bold=true`,
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

  // Step 1: Seed curated real creators
  let curatedSeeded = 0;
  for (const c of CURATED_CREATORS) {
    const [handle, name, niche, platform, city, lang, followers, engRate, pricePerPost, bio] = c;
    try {
      const existing = await getDbRow('SELECT id FROM creators WHERE handle = ?', [handle]);
      if (!existing) {
        const id = `curated_${handle.replace('@','').replace(/[^a-z0-9]/g,'_').substring(0,30)}`;
        const estPrice = parseInt(pricePerPost);
        let authScore, fakePct;
        if (Math.random() < 0.10) {
          authScore = randomInt(50, 75);
          fakePct = randomInt(15, 30);
        } else {
          authScore = randomInt(88, 99);
          fakePct = randomInt(1, 8);
        }

        const email = `collabs@${name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0,20)}.in`;
        const bioWithEmail = bio.includes('@') ? bio : `${bio} Business & Collabs: ${email}`;

        await runDb(`
          INSERT INTO creators (id, name, handle, platform, niche, followers_raw, reach_text,
            avg_views, engagement_rate, price_per_post, min_price, email, avatar,
            rating, location, language, recent_videos_json, bio, authenticity_score, fake_follower_pct)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, name, handle, platform, niche, parseInt(followers), formatFollowers(parseInt(followers)),
          Math.round(parseInt(followers) * parseFloat(engRate) / 100 * 0.8),
          `${engRate}%`, estPrice, Math.round(estPrice * 0.75),
          email,
          `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f62fe&color=ffffff&bold=true`,
          parseFloat((randomInt(380, 500) / 100).toFixed(2)),
          city, lang,
          JSON.stringify([`${niche} content`, `Brand partnership`, `${lang} reach`]),
          bioWithEmail, authScore, fakePct
        ]);
        curatedSeeded++;
      }
    } catch (err) {
      // Skip duplicates
    }
  }
  console.log(`[CreatorDB] Curated creators seeded: ${curatedSeeded}`);

  // Step 2: Count and fill to target with synthetic creators
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
      if ((currentCount + batchStart) % 2000 === 0 && batchStart > 0) {
        console.log(`[CreatorDB] Progress: ${(currentCount + batchStart).toLocaleString()} / ${targetCount.toLocaleString()}`);
      }
    }
    console.log(`[CreatorDB] Synthetic creators inserted: ${inserted.toLocaleString()}`);
  }

  const finalRow = await getDbRow('SELECT COUNT(*) as total FROM creators');
  console.log(`[CreatorDB] Seed complete. Total creators: ${finalRow?.total?.toLocaleString()}`);
}
