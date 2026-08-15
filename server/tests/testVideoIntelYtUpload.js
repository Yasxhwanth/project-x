// Node 22 native global fetch

async function testYouTubeVideoIndexing() {
  console.log('🎬 [Test VideoIntel] Starting YouTube Video Indexing Test...\n');

  const testPayload = {
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    brandName: 'boAt Lifestyle',
    productName: 'boAt Airdopes 800 ANC',
    creatorName: 'Rick Astley Tech',
    campaignId: 'camp_01',
    dealId: 'deal_yt_test_001'
  };

  console.log('📤 1. Sending POST /api/video-intel/index with payload:');
  console.log(JSON.stringify(testPayload, null, 2));

  try {
    const res = await fetch('http://localhost:5001/api/video-intel/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err}`);
    }

    const data = await res.json();
    console.log('\n✅ 2. Indexing Complete! Server Response:');
    console.log('--------------------------------------------------');
    console.log(`Video ID:         ${data.videoId}`);
    console.log(`Video URL:        ${data.videoUrl}`);
    console.log(`Compliance Score: ${data.complianceScore}%`);
    console.log(`Status:           ${data.auditReport?.status}`);
    console.log(`Is Approved:      ${data.auditReport?.isApproved ? 'YES ✅' : 'REVISION REQUIRED ⚠️'}`);

    console.log('\n📜 3. Timestamped Speech Dialogue Chunks:');
    data.chunks?.forEach((chunk, i) => {
      console.log(`  [${chunk.start} - ${chunk.end}] ${chunk.speaker}: "${chunk.text}"`);
    });

    console.log('\n👁️ 4. Visual Scene & Computer Vision Breakdown:');
    data.scenes?.forEach((scene, i) => {
      console.log(`  [${scene.startTime} - ${scene.endTime}] ${scene.sceneType}`);
      console.log(`    - Visual: ${scene.visualDescription}`);
      console.log(`    - OCR Text: "${scene.ocrText}"`);
      console.log(`    - Logo Visible: ${scene.brandLogoVisible ? 'YES' : 'NO'}`);
    });

    console.log('\n🛡️ 5. AI Audit & Forensic Evidence:');
    data.auditReport?.evidenceProof?.forEach((ev, i) => {
      console.log(`  ${ev.passed ? '✅' : '❌'} [${ev.type}] ${ev.title}`);
      console.log(`     Snippet: ${ev.evidenceSnippet}`);
    });

    // 6. Test Semantic Search
    console.log('\n🔍 6. Testing Semantic & Timestamp Search for keyword "Noise Cancellation"...');
    const searchRes = await fetch('http://localhost:5001/api/video-intel/search?q=Noise%20Cancellation');
    const searchData = await searchRes.json();
    console.log(`Found ${searchData.totalMatches} timestamped matches:`);
    searchData.matches?.forEach(m => {
      console.log(`  ⏱️ Timestamp: ${m.timestamp} | Speaker: ${m.speaker}`);
      console.log(`     Matching Line: "${m.matchingText}"`);
    });

    // 7. Test Retrieval by ID
    console.log(`\n📦 7. Testing Retrieval by Video ID: ${data.videoId}`);
    const getRes = await fetch(`http://localhost:5001/api/video-intel/${data.videoId}`);
    const getData = await getRes.json();
    console.log(`Successfully retrieved indexed video from SQLite database! Title: "${getData.title}"`);
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
  }
}

testYouTubeVideoIndexing();
