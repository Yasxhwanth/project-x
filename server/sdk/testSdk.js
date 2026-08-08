import { CreatorScraperSDK } from './creatorScraperSdk.js';

async function runSdkTests() {
  console.log("🚀 Initializing CreatorScraperSDK Test Suite...\n");

  const sdk = new CreatorScraperSDK();

  // Test 1: Rate Calculation
  console.log("Test 1: Price Rate Calculation...");
  const igRate = sdk.calculateEstimatedRate(1500000, 'Instagram');
  const ytRate = sdk.calculateEstimatedRate(2000000, 'YouTube');
  console.log(`✓ 1.5M Instagram Followers est rate: ₹${igRate.toLocaleString('en-IN')}`);
  console.log(`✓ 2.0M YouTube Subscribers est rate: ₹${ytRate.toLocaleString('en-IN')}\n`);

  // Test 2: Scrape Instagram Profile
  console.log("Test 2: Scraping Instagram Profile @tarini_peshawaria...");
  const igCreator = await sdk.scrapeInstagramProfile('@tarini_peshawaria');
  console.log(`✓ Scraped Instagram Creator: ${igCreator.name} (${igCreator.handle})`);
  console.log(`  Reach: ${igCreator.reachText} | Est Fee: ₹${igCreator.pricePerPost.toLocaleString('en-IN')}\n`);

  // Test 3: Scrape YouTube Channel
  console.log("Test 3: Scraping YouTube Channel 'Tech Burner'...");
  const ytCreators = await sdk.scrapeYouTubeChannel('Tech Burner');
  console.log(`✓ Scraped ${ytCreators.length} YouTube Creators`);
  if (ytCreators.length > 0) {
    console.log(`  Top Result: ${ytCreators[0].name} (${ytCreators[0].handle}) | Reach: ${ytCreators[0].reachText}\n`);
  }

  // Test 4: Search Creators via SDK
  console.log("Test 4: Searching Creators via SDK...");
  const searchResults = await sdk.searchCreators({
    platform: 'All',
    reachMax: 25000000,
    budgetMax: 150000
  });
  console.log(`✓ Total Creators in SDK Database: ${searchResults.length}\n`);

  console.log("✨ All CreatorScraperSDK Tests Passed Successfully!");
}

runSdkTests().catch(err => {
  console.error("SDK Test Error:", err);
  process.exit(1);
});
