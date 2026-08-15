import { YoutubeTranscript } from 'youtube-transcript';

async function testRealTranscript() {
  const videoId = 'vXQdYFcT_uE';
  console.log(`Fetching REAL YouTube subtitles for video: ${videoId}...`);
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    console.log(`✅ Fetched ${transcript.length} real subtitle chunks!`);
    console.log('\n--- FIRST 15 SPOKEN LINES FROM THE ACTUAL VIDEO ---');
    transcript.slice(0, 15).forEach((t) => {
      const sec = Math.floor(t.offset / 1000);
      const mins = Math.floor(sec / 60).toString().padStart(2, '0');
      const secs = (sec % 60).toString().padStart(2, '0');
      console.log(`[${mins}:${secs}] ${t.text}`);
    });

    const fullText = transcript.map(t => t.text).join(' ');
    console.log('\n--- TOTAL TRANSCRIPT LENGTH ---');
    console.log(`Total words: ${fullText.split(/\s+/).length}`);
    console.log(`Snippet: ${fullText.substring(0, 300)}...`);
  } catch (err) {
    console.error('❌ Failed:', err);
  }
}

testRealTranscript();
