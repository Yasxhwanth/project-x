// Test real user YouTube video with VideoIntel SDK
async function testRealUserVideo() {
  const userVideoUrl = 'https://youtu.be/vXQdYFcT_uE?si=_3VdQmmTyD65HFp1';
  console.log(`🎬 [VideoIntel] Ingesting User YouTube Video:\n${userVideoUrl}\n`);

  try {
    const res = await fetch('http://localhost:5001/api/video-intel/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl: userVideoUrl,
        brandName: 'boAt Lifestyle',
        productName: 'boAt Airdopes Pro Max 500',
        creatorName: 'Creator Showcase',
        campaignId: 'camp_01',
        dealId: 'deal_user_video_01'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err}`);
    }

    const data = await res.json();
    console.log('✅ 1. Video Ingestion & Perception Complete!');
    console.log('------------------------------------------------------------');
    console.log(`Video ID:         ${data.videoId}`);
    console.log(`Video URL:        ${data.videoUrl}`);
    console.log(`Compliance Score: ${data.complianceScore}%`);
    console.log(`Status:           ${data.auditReport?.status}`);
    console.log(`Approval Status:  ${data.auditReport?.isApproved ? 'VERIFIED PASSED ✅' : 'NEEDS REVISION ⚠️'}`);

    console.log('\n📜 2. Timestamped Audio Dialogue Chunks:');
    data.chunks?.forEach((chunk) => {
      console.log(`  ⏱️ [${chunk.start} - ${chunk.end}] ${chunk.speaker}: "${chunk.text}"`);
    });

    console.log('\n👁️ 3. Computer Vision & Scene Segmentation:');
    data.scenes?.forEach((scene) => {
      console.log(`  🎬 [${scene.startTime} - ${scene.endTime}] ${scene.sceneType}`);
      console.log(`     • Visual: ${scene.visualDescription}`);
      console.log(`     • OCR On-Screen Text: "${scene.ocrText}"`);
      console.log(`     • Logo Detected: ${scene.brandLogoVisible ? 'YES' : 'NO'}`);
      console.log(`     • Elements: ${scene.detectedElements?.join(', ')}`);
    });

    console.log('\n🛡️ 4. AI Forensics & Regulatory Compliance Audit:');
    data.auditReport?.evidenceProof?.forEach((ev) => {
      console.log(`  ${ev.passed ? '✅' : '❌'} [${ev.type}] ${ev.title}`);
      console.log(`     Details: ${ev.evidenceSnippet}`);
    });

    // 5. Test semantic search on this video
    console.log('\n🔍 5. Querying Semantic Search on This Video for "discount" / "bio"...');
    const searchRes = await fetch(`http://localhost:5001/api/video-intel/search?q=bio&videoId=${data.videoId}`);
    const searchData = await searchRes.json();
    console.log(`Matches Found: ${searchData.totalMatches}`);
    searchData.matches?.forEach(m => {
      console.log(`  ⏱️ Timestamp ${m.timestamp}: "${m.matchingText}"`);
    });

    console.log('\n✨ Live API Inspection Link:');
    console.log(`http://localhost:5001/api/video-intel/${data.videoId}`);

  } catch (err) {
    console.error('❌ Error indexing user video:', err);
  }
}

testRealUserVideo();
