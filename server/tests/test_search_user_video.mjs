import { VideoIndexer } from '../sdk/videoIntel/index.js';

async function runSearch() {
  const matches = await VideoIndexer.search({
    videoId: 'vintel_1786864420789',
    query: 'Yahoo'
  });
  console.log(`\n🔍 Search Results for "Yahoo" in Video 89YZXIGOAB0:`);
  console.log(`Found ${matches.length} matching transcript chunks:`);
  matches.forEach((m, i) => {
    console.log(`  [Match ${i+1}] At ${m.timestamp} (${m.startSeconds}s - ${m.endSeconds}s): "${m.matchingText}"`);
  });
}

runSearch();
