import { CreatorScraperSDK } from '../sdk/creatorScraperSdk.js';

const sdk = new CreatorScraperSDK();

// ─────────────────────────────────────────────────────────────────────────────
// REAL INDIAN INSTAGRAM HANDLES — scraped for live profile data at startup
// These are real public profiles. Scraper attempts to fetch:
//   - Real profile picture URL
//   - Live follower count
//   - Real bio (for email extraction)
// ─────────────────────────────────────────────────────────────────────────────
const INSTAGRAM_HANDLES_TO_SCRAPE = [
  // Fashion & Lifestyle
  '@komalpandeyreal', '@thatbohogirl', '@masoomminawala', '@aashnaashroff',
  '@santoshiveer', '@nikhilmurthy', '@karanshukla.style', '@priyankamakhija',
  '@manishmalhotraofficial', '@sabyasachi', '@perniaqureshi', '@anaitashroffadajania',

  // Beauty & Skincare
  '@malvikasitlani', '@shreyajain_s', '@debasree_banerjee', '@tarini_peshawaria',
  '@glamourous_geet', '@skincarewithsona', '@beautybyreena', '@nykaabeautycreator',
  '@roshinigazdar', '@triyanagendreya', '@makeupbyaishwarya',

  // Tech & Gadgets
  '@techburner', '@technicalguruji', '@gadgetguru_sumit',

  // Gaming & Esports
  '@ig_mortal', '@scout_op', '@regaltos_ig', '@jonathan_gaming', '@dynamo_gaming',

  // Finance & Investing
  '@ranveer.allahbadia', '@financewithsharan', '@ca_rachanaranade',
  '@warikoo', '@shark_tank_india_fanpage', '@ashneergrover', '@peyush_bansal',
  '@vineeta_singh_official', '@namitathaparbhat', '@aman_gupta_boat',

  // Fitness & Health
  '@fittuber', '@anshuka_yoga', '@mukeshgahlot.fit', '@dranjali_kumarsingh',
  '@priyankakakkar.fit', '@krissh_fitness', '@geetha_meenakshi',

  // Comedy & Entertainment
  '@mostlysane', '@bhuvan.bam22', '@fukravarun', '@slaypoint_ig',
  '@ashishchanchlani', '@bengalurubanter', '@punememsaab', '@hyderabadhumor',

  // Education & Motivation
  '@ankurwarikoo', '@ishansharma13', '@nitishrajput.ig', '@dhruvrathee',
  '@shreyasonawane',

  // Business & Startups
  '@foundr_india', '@ashneergrover', '@riteshagarwal', '@shraddhasharma_yvb',

  // Cricket & Sports
  '@cricketnext_in', '@irfanpathanlive', '@harbhajan.singh',
  '@yuvrajsingh', '@virendersehwag',

  // Astrology & Wellness
  '@tarot_by_priyaa', '@tarot_mansi',

  // Music & Arts
  '@raftaarofficial', '@seedhemaut_ig', '@armaanmalik', '@nucleya_official',
  '@yoyo_honey_singh', '@jassigilll', '@aasthagill',

  // Sustainability
  '@sustainablesrishti', '@zerowasteindia', '@priya_ragu_eco', '@green_lens_india',

  // Photography
  '@prasanth_photography', '@desertshots_aarav', '@akshaypatra_photography',
  '@tanveerdalal', '@vidhikr',

  // Parenting
  '@mumbaimoms_ig', '@delhidads', '@diaryofatypicalmom', '@gurugram_parenting',

  // Meme & Pop Culture
  '@sarcasmindian', '@dankindianmemes', '@chennaimemes_official',
  '@hyderabadi_memes', '@kannadamemes', '@benglimemes_ig',

  // Travel & Vlogging
  '@ladakhdiaries_ig', '@rajasthanroutes', '@uttarakhandwalks',
  '@northeast_wanders', '@thetravellingtaste', '@travel_ling_tales',
];

// ─────────────────────────────────────────────────────────────────────────────
// REAL INDIAN YOUTUBE SEARCH QUERIES — for discovering fresh real channels
// ─────────────────────────────────────────────────────────────────────────────
const YOUTUBE_DISCOVERY_QUERIES = [
  // Tech
  'India tech review Hindi channel',
  'Indian gadget unboxing YouTube',
  'best budget phone review India',

  // Gaming
  'BGMI India gameplay YouTube',
  'Free Fire India gaming channel',
  'Indian esports creator',

  // Finance
  'Indian stock market Hindi education',
  'mutual fund SIP India YouTube',
  'personal finance Hindi channel India',

  // Fitness
  'Indian fitness workout Hindi YouTube',
  'yoga for Indians YouTube',
  'Indian bodybuilding natural',

  // Food
  'Indian cooking channel YouTube Hindi',
  'Indian street food vlog',
  'Indian chef YouTube channel',

  // Comedy
  'Indian comedy YouTube Hindi',
  'Indian stand-up comedian YouTube',
  'Bollywood comedy sketches India',

  // Education
  'UPSC preparation Hindi YouTube',
  'Indian science explainer Hindi',
  'IIT JEE preparation YouTube India',

  // Fashion & Beauty
  'Indian beauty makeup tutorial Hindi',
  'Indian fashion lifestyle YouTube',
  'skincare routine India Hindi',

  // Travel
  'India travel vlog Hindi',
  'solo travel India YouTube',
  'Rajasthan travel guide YouTube',

  // Regional
  'Tamil comedy entertainment YouTube',
  'Telugu gaming YouTube',
  'Marathi entertainment comedy',
  'Bengali lifestyle YouTube',
  'Kannada tech review',
  'Punjabi motivation YouTube',
];

let isJobRunning = false;
let lastRunTimestamp = null;
let scrapedCountInLastRun = 0;

export async function runAutomatedScraperJob() {
  if (isJobRunning) {
    return { status: 'ALREADY_RUNNING', lastRunTimestamp };
  }

  isJobRunning = true;
  console.log('🚀 [AutoScraper] Starting automated background scraper for real Indian creators...');

  let totalScraped = 0;

  try {
    // ── Phase 1: Scrape real Instagram profiles ────────────────────────────
    console.log(`[AutoScraper] Phase 1: Scraping ${INSTAGRAM_HANDLES_TO_SCRAPE.length} real Instagram profiles...`);

    // Scrape in batches of 5 with 1.5s delay to avoid rate limits
    for (let i = 0; i < INSTAGRAM_HANDLES_TO_SCRAPE.length; i += 5) {
      const batch = INSTAGRAM_HANDLES_TO_SCRAPE.slice(i, i + 5);
      await Promise.allSettled(
        batch.map(handle => sdk.scrapeInstagramProfile(handle).catch(() => null))
      );
      totalScraped += batch.length;
      // Rate limit buffer
      await new Promise(r => setTimeout(r, 1500));
    }

    console.log(`[AutoScraper] Phase 1 complete. Processed ${totalScraped} Instagram profiles.`);

    // ── Phase 2: Discover real YouTube channels ────────────────────────────
    console.log(`[AutoScraper] Phase 2: Discovering real YouTube channels...`);
    let ytScraped = 0;

    for (const query of YOUTUBE_DISCOVERY_QUERIES) {
      try {
        const results = await sdk.scrapeYouTubeChannel(query);
        ytScraped += results.length;
        await new Promise(r => setTimeout(r, 800)); // polite delay
      } catch (e) {
        // continue
      }
    }

    totalScraped += ytScraped;
    console.log(`[AutoScraper] Phase 2 complete. Discovered ${ytScraped} YouTube channels.`);

    lastRunTimestamp = new Date().toISOString();
    scrapedCountInLastRun = totalScraped;
    console.log(`✨ [AutoScraper] Finished! Total processed: ${totalScraped} creators.`);

    return {
      status: 'COMPLETED',
      scrapedCount: totalScraped,
      instagramProfiles: INSTAGRAM_HANDLES_TO_SCRAPE.length,
      youtubeQueries: YOUTUBE_DISCOVERY_QUERIES.length,
      timestamp: lastRunTimestamp
    };
  } catch (err) {
    console.error('[AutoScraper] Error:', err);
    return { status: 'ERROR', error: err.message };
  } finally {
    isJobRunning = false;
  }
}

export function startBackgroundCronSchedule(intervalMinutes = 60) {
  console.log(`[AutoScraper] Scheduling real creator scraper every ${intervalMinutes} mins...`);

  // First run 10 seconds after server boot (non-blocking)
  setTimeout(() => {
    runAutomatedScraperJob().catch(err => console.error('[AutoScraper] Boot run error:', err));
  }, 10000);

  // Recurring refresh
  setInterval(() => {
    runAutomatedScraperJob().catch(err => console.error('[AutoScraper] Scheduled run error:', err));
  }, intervalMinutes * 60 * 1000);
}

export function getAutoScraperStatus() {
  return {
    isJobRunning,
    lastRunTimestamp,
    scrapedCountInLastRun,
    instagramHandlesConfigured: INSTAGRAM_HANDLES_TO_SCRAPE.length,
    youtubeQueriesConfigured: YOUTUBE_DISCOVERY_QUERIES.length,
  };
}
