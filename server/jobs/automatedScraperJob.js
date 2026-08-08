import { CreatorScraperSDK } from '../sdk/creatorScraperSdk.js';

const sdk = new CreatorScraperSDK();

const TRENDING_INDIAN_TOPICS = [
  "Hindi Tech Reviews",
  "Indian Beauty Fashion Haul",
  "BGMI Gaming Live",
  "Indian Stock Finance"
];

const TRENDING_INSTAGRAM_HANDLES = [
  "@tarini_peshawaria",
  "@techburner",
  "@komalpandeyreal",
  "@ranveer.allahbadia",
  "@mostlysane",
  "@bhuvan.bam22"
];

let isJobRunning = false;
let lastRunTimestamp = null;
let scrapedCountInLastRun = 0;

export async function runAutomatedScraperJob() {
  if (isJobRunning) {
    return { status: "ALREADY_RUNNING", lastRunTimestamp };
  }

  isJobRunning = true;
  console.log("🚀 Starting Automated Background Creator Scraper Job...");

  let totalScraped = 0;

  try {
    for (const topic of TRENDING_INDIAN_TOPICS) {
      const results = await sdk.scrapeYouTubeChannel(topic);
      totalScraped += results.length;
    }

    for (const handle of TRENDING_INSTAGRAM_HANDLES) {
      try {
        await sdk.scrapeInstagramProfile(handle);
        totalScraped += 1;
      } catch (e) {
        // continue
      }
    }

    lastRunTimestamp = new Date().toISOString();
    scrapedCountInLastRun = totalScraped;
    console.log(`✨ Background Scraper Job Finished! Updated ${totalScraped} creators.`);

    return {
      status: "COMPLETED",
      scrapedCount: totalScraped,
      timestamp: lastRunTimestamp
    };
  } catch (err) {
    console.error("Automated Scraper Job Error:", err);
  } finally {
    isJobRunning = false;
  }
}

export function startBackgroundCronSchedule(intervalMinutes = 30) {
  const intervalMs = intervalMinutes * 60 * 1000;
  console.log(`[Cron] Initializing Creator Scraper background schedule (Every ${intervalMinutes} mins)...`);

  // Run in non-blocking timeout after server boot
  setTimeout(() => {
    runAutomatedScraperJob().catch(err => console.error("Auto-scraper run error", err));
  }, 5000);

  setInterval(() => {
    runAutomatedScraperJob().catch(err => console.error("Scheduled auto-scraper run error", err));
  }, intervalMs);
}

export function getAutoScraperStatus() {
  return {
    isJobRunning,
    lastRunTimestamp,
    scrapedCountInLastRun
  };
}
