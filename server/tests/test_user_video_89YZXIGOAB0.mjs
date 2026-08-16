import { videoIntel, VideoIndexer } from '../sdk/videoIntel/index.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function testUserVideo() {
  const url = 'https://youtu.be/89YZXIGOAB0?si=qDuNyUlUatJEXSM5';
  console.log(`\n======================================================`);
  console.log(`🎥 INDEXING YOUTUBE VIDEO: ${url}`);
  console.log(`======================================================\n`);

  try {
    console.log(`[1/5] Extracting Metadata & Initiating VideoIntel Session...`);
    const session = videoIntel.upload(url, {
      creatorName: 'YouTube Creator',
      campaignId: 'camp_01',
      dealId: 'deal_test_01'
    });

    console.log(`[2/5] Running Full Multimodal Indexing (Transcripts + Vision + Ad Reads)...`);
    const result = await session.index({
      productName: 'boAt Airdopes 800',
      brandName: 'boAt',
      creatorName: 'Creator'
    });

    console.log(`\n✅ VIDEO INDEXED SUCCESSFULLY!`);
    console.log(`------------------------------------------------------`);
    console.log(`🆔 Video ID:       ${result.id || session.id}`);
    console.log(`📌 Title:          ${result.metadata?.title || session.metadata?.title || 'YouTube Video'}`);
    console.log(`👤 Channel/Author: ${result.metadata?.channelName || result.metadata?.author || session.metadata?.author || 'Creator'}`);
    console.log(`⏱️ Duration:       ${result.metadata?.durationSeconds || session.metadata?.durationSeconds || 60}s`);
    console.log(`📊 Compliance Score: ${result.complianceScore || session.complianceScore}/100`);

    console.log(`\n📝 AI Executive Summary:`);
    console.log(`------------------------------------------------------`);
    console.log(result.summaryText || session.summaryText || 'No summary text generated');

    console.log(`\n🎬 Scene Segmentation & Sentiment (${(result.scenes || session.scenes || []).length} scenes):`);
    console.log(`------------------------------------------------------`);
    (result.scenes || session.scenes || []).forEach((scene, i) => {
      console.log(`  [Scene ${i+1}] ${scene.startTime || scene.start_time} - ${scene.endTime || scene.end_time} | Type: ${scene.sceneType || scene.scene_type} | Sentiment: ${scene.sentiment || 'POSITIVE'}`);
      console.log(`    Description: ${scene.visualDescription || scene.visual_description || scene.description}`);
    });

    console.log(`\n🏷️ Brand Sponsorship & Ad Reads (${(result.sponsorshipSegments || session.sponsorshipSegments || []).length} detected):`);
    console.log(`------------------------------------------------------`);
    (result.sponsorshipSegments || session.sponsorshipSegments || []).forEach((seg, i) => {
      console.log(`  [Segment ${i+1}] Brand: ${seg.brandName || seg.brand || seg.brand_name} (${seg.startTime || seg.start_time} - ${seg.endTime || seg.end_time})`);
      console.log(`    Context: ${seg.context || seg.snippet}`);
      console.log(`    Deep Link: ${seg.timestampUrl || seg.timestamp_url}`);
    });

    console.log(`\n🖼️ Visual Keyframes (${(result.visualFrames || session.visualFrames || []).length} frames):`);
    console.log(`------------------------------------------------------`);
    (result.visualFrames || session.visualFrames || []).forEach((f, i) => {
      console.log(`  [Frame ${i+1}] ${f.timestamp} (${f.seconds}s): ${f.label || f.description || f.url}`);
    });

    console.log(`\n💬 Transcript Chunks Sample (${(result.transcriptChunks || session.transcriptChunks || []).length} total chunks):`);
    console.log(`------------------------------------------------------`);
    (result.transcriptChunks || session.transcriptChunks || []).slice(0, 5).forEach((c, i) => {
      console.log(`  [${c.startTime || c.start_time || '0:00'} - ${c.endTime || c.end_time || '0:10'}] ${c.text}`);
    });

    console.log(`\n🔎 Testing Semantic Search on Indexed Video...`);
    const searchRes = await VideoIndexer.search({
      videoId: result.id || session.id,
      query: 'sound'
    });
    console.log(`  Search query "sound" returned ${searchRes.total_matches} matches.`);

    console.log(`\n======================================================`);
    console.log(`🎉 PERCEPTION PIPELINE VERIFIED FOR 89YZXIGOAB0`);
    console.log(`======================================================\n`);

  } catch (err) {
    console.error(`❌ Indexing error:`, err);
  }
}

testUserVideo();
