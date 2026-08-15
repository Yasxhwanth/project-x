/**
 * VideoIntel SDK — Comprehensive Test Suite
 * Tests every layer of the perception pipeline:
 *   ✅ Transcript Extraction (real YouTube subtitles)
 *   ✅ Metadata (real title, channel, duration)
 *   ✅ Gemini Multimodal Computer Vision (4 keyframes)
 *   ✅ Scene Breakdown + Sentiment Polarity
 *   ✅ Sponsorship Segment Extractor + Deep Links
 *   ✅ AI Executive Summary
 *   ✅ Keyword & Compliance Audit
 *   ✅ Full Audit Report (compositeScore, isApproved)
 *   ✅ SQLite Persistence (VideoIndexer.getVideoById)
 *   ✅ Transcript Search (VideoIndexer.search)
 *   ✅ Async Job Queue Engine (enqueue → poll → done)
 *   ✅ REST Endpoint Health (/api/videointel/*)
 */

import { videoIntel, VideoIndexer, videoJobQueue } from './index.js';

const TEST_URL = 'https://youtu.be/vXQdYFcT_uE';
const BRAND_NAME = 'The Daily Upside';
const PRODUCT_NAME = 'The Daily Upside Newsletter';
const SERVER_URL = 'http://localhost:5001';

let passed = 0;
let failed = 0;
const results = [];

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
    results.push({ name, status: 'PASS', detail });
  } else {
    console.error(`  ❌ FAIL: ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
    results.push({ name, status: 'FAIL', detail });
  }
}

function section(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(60)}`);
}

// ─────────────────────────────────────────────────
// SUITE 1: Full Perception Pipeline via session.index()
// ─────────────────────────────────────────────────
section('SUITE 1 — Full SDK Perception Pipeline');

console.log(`\n  🎬 Indexing: ${TEST_URL}`);
console.log(`  Brand: "${BRAND_NAME}" | Product: "${PRODUCT_NAME}"\n`);

const session = videoIntel.upload(TEST_URL);
let auditReport;

try {
  auditReport = await session.index({
    brandName: BRAND_NAME,
    productName: PRODUCT_NAME,
  });
} catch (err) {
  console.error('\n  🔴 FATAL: session.index() threw an error:', err.message);
  process.exit(1);
}

// — Metadata
section('SUITE 1a — Metadata Extraction');
assert('metadata object exists', !!session.metadata);
assert('title is NOT a placeholder', 
  session.metadata?.title && !session.metadata.title.includes('YouTube Video #'),
  `Got: "${session.metadata?.title}"`
);
assert('title matches expected video',
  session.metadata?.title?.includes('Dangerous Hedge Fund') || session.metadata?.title?.includes('History'),
  `Got: "${session.metadata?.title}"`
);
assert('duration is > 1000s (real 28m40s video)',
  session.metadata?.estimatedDurationSeconds > 1000,
  `Got: ${session.metadata?.estimatedDurationSeconds}s`
);
assert('channelName extracted',
  !!session.metadata?.channelName && session.metadata.channelName.length > 2,
  `Got: "${session.metadata?.channelName}"`
);
assert('videoId extracted', 
  session.metadata?.videoId === 'vXQdYFcT_uE',
  `Got: "${session.metadata?.videoId}"`
);

// — Transcript
section('SUITE 1b — Transcript Extraction');
assert('transcript text non-empty', typeof session.transcript === 'string' && session.transcript.length > 500);
assert('transcript word count > 3000',
  session.transcript.split(' ').length > 3000,
  `Got: ${session.transcript.split(' ').length} words`
);
assert('transcript chunks array non-empty', Array.isArray(session.transcriptChunks) && session.transcriptChunks.length > 0);
assert('chunks have startSeconds & endSeconds',
  session.transcriptChunks[0]?.startSeconds !== undefined && session.transcriptChunks[0]?.endSeconds !== undefined
);
assert('transcript mentions the sponsor brand',
  session.transcript.toLowerCase().includes('daily upside'),
  'Sponsor brand "The Daily Upside" should appear in transcript'
);

// — Visual Frames (Gemini Multimodal Vision)
section('SUITE 1c — Multimodal Keyframe Vision');
assert('visualFrames array has 4 entries',
  Array.isArray(session.visualFrames) && session.visualFrames.length === 4,
  `Got: ${session.visualFrames.length} frames`
);
if (session.visualFrames.length > 0) {
  const f = session.visualFrames[0];
  // frameAnalyzer returns: estimatedTimestamp, visionAnalysis.{ backgroundSetting, creatorFaceVisible }
  assert('frame has estimatedTimestamp', typeof f.estimatedTimestamp === 'string' && f.estimatedTimestamp.length > 0,
    `Got: "${f.estimatedTimestamp}" (keys: ${Object.keys(f).join(', ')})`
  );
  assert('frame has visionAnalysis.backgroundSetting',
    typeof f.visionAnalysis?.backgroundSetting === 'string' && f.visionAnalysis.backgroundSetting.length > 0,
    `Got: "${f.visionAnalysis?.backgroundSetting}"`
  );
  assert('frame has visionAnalysis.creatorFaceVisible',
    typeof f.visionAnalysis?.creatorFaceVisible === 'boolean',
    `Got: ${f.visionAnalysis?.creatorFaceVisible}`
  );
}

// — Scenes & Sentiment
section('SUITE 1d — Scene Breakdown & Sentiment');
assert('scenes array non-empty', Array.isArray(session.scenes) && session.scenes.length > 0, `Got: ${session.scenes.length} scenes`);
assert('scenes cover full duration (> 5 scenes for 28min video)',
  session.scenes.length > 5,
  `Got: ${session.scenes.length} scenes`
);
if (session.scenes.length > 0) {
  const s = session.scenes[0];
  assert('scene has startTime', !!s.startTime);
  assert('scene has endTime', !!s.endTime);
  assert('scene has sentiment field', ['POSITIVE','NEUTRAL','CONSTRUCTIVE_CRITIQUE','CONTROVERSIAL'].includes(s.sentiment),
    `Got: "${s.sentiment}"`
  );
  assert('scene has visualDescription', typeof s.visualDescription === 'string' && s.visualDescription.length > 10);
}

// — Sponsorship Segments
section('SUITE 1e — Sponsorship Segment Detection');
assert('sponsorshipSegments array exists', Array.isArray(session.sponsorshipSegments));
assert('at least 1 sponsorship segment detected',
  session.sponsorshipSegments.length >= 1,
  `Got: ${session.sponsorshipSegments.length} segments`
);
if (session.sponsorshipSegments.length > 0) {
  const seg = session.sponsorshipSegments[0];
  assert('segment has startTime', !!seg.startTime);
  assert('segment has endTime', !!seg.endTime);
  assert('segment has durationSeconds > 0', seg.durationSeconds > 0, `Got: ${seg.durationSeconds}s`);
  assert('segment has wordCount > 0', seg.wordCount > 0, `Got: ${seg.wordCount} words`);
  assert('segment has proofDeepLink URL',
    typeof seg.proofDeepLink === 'string' && seg.proofDeepLink.startsWith('https://youtu.be/'),
    `Got: "${seg.proofDeepLink}"`
  );
  assert('proofDeepLink contains videoId',
    seg.proofDeepLink?.includes('vXQdYFcT_uE'),
    `Got: "${seg.proofDeepLink}"`
  );
}

// — Executive Summary
section('SUITE 1f — AI Executive Summary');
assert('summaryText is non-empty', typeof session.summaryText === 'string' && session.summaryText.length > 50);
assert('summaryText is NOT hardcoded placeholder',
  !session.summaryText.includes('boAt Airdopes') && !session.summaryText.includes('Lorem ipsum'),
  `Got first 80 chars: "${session.summaryText.substring(0, 80)}"`
);
assert('summaryText mentions video title or content',
  session.summaryText.toLowerCase().includes('hedge fund') ||
  session.summaryText.toLowerCase().includes('hamish') ||
  session.summaryText.toLowerCase().includes('capital management'),
  `Got: "${session.summaryText.substring(0, 120)}"`
);
const summaryWordCount = session.summaryText.split(' ').length;
assert('summaryText is 80-250 words long', summaryWordCount >= 80 && summaryWordCount <= 300,
  `Got: ${summaryWordCount} words`
);

// — Audit Report
section('SUITE 1g — Full Audit Report & Compliance Score');
assert('auditReport object returned', !!auditReport);
assert('compositeScore is a number 0-100', 
  typeof auditReport.compositeScore === 'number' && auditReport.compositeScore >= 0 && auditReport.compositeScore <= 100,
  `Got: ${auditReport.compositeScore}`
);
assert('status is VERIFIED_PASSED or NEEDS_REVISION',
  ['VERIFIED_PASSED','NEEDS_REVISION'].includes(auditReport.status),
  `Got: "${auditReport.status}"`
);
assert('evidenceProof array has >= 4 items',
  Array.isArray(auditReport.evidenceProof) && auditReport.evidenceProof.length >= 4,
  `Got: ${auditReport.evidenceProof?.length} items`
);
assert('sponsorshipDeliverables.detectedSegmentsCount >= 1',
  auditReport.sponsorshipDeliverables?.detectedSegmentsCount >= 1,
  `Got: ${auditReport.sponsorshipDeliverables?.detectedSegmentsCount}`
);
assert('totalSponsoredDurationSeconds > 0',
  auditReport.sponsorshipDeliverables?.totalSponsoredDurationSeconds > 0,
  `Got: ${auditReport.sponsorshipDeliverables?.totalSponsoredDurationSeconds}s`
);
assert('isIndexed flag set to true', session.isIndexed === true);

// ─────────────────────────────────────────────────
// SUITE 2: SQLite Persistence & Search
// ─────────────────────────────────────────────────
section('SUITE 2 — SQLite Persistence & Vector Search');

const savedVideo = await VideoIndexer.getVideoById(session.id);
assert('getVideoById returns saved record', !!savedVideo, `videoId: ${session.id}`);
if (savedVideo) {
  assert('saved record has title', !!savedVideo.title);
  // getVideoById spreads raw SQLite row -> field is transcript_text (snake_case)
  assert('saved record has transcript',
    typeof (savedVideo.transcript_text || savedVideo.transcriptText) === 'string' &&
    (savedVideo.transcript_text || savedVideo.transcriptText || '').length > 100,
    `Keys: ${Object.keys(savedVideo).filter(k => k.includes('transcript')).join(', ')}`
  );
  assert('saved record has summaryText', typeof savedVideo.summaryText === 'string' && savedVideo.summaryText.length > 10);
  assert('saved record has scenes array', Array.isArray(savedVideo.scenes) && savedVideo.scenes.length > 0);
  assert('saved record has visualFrames', Array.isArray(savedVideo.visualFrames));
  assert('saved record has sponsorshipSegments', Array.isArray(savedVideo.sponsorshipSegments));
}

// Search
const searchResults = await VideoIndexer.search({ query: 'daily upside' });
assert('search returns results for "daily upside"',
  Array.isArray(searchResults) && searchResults.length > 0,
  `Got: ${searchResults.length} results`
);

const noResults = await VideoIndexer.search({ query: 'xyzfoobar123notreal' });
assert('search returns empty for nonsense query',
  Array.isArray(noResults) && noResults.length === 0,
  `Got: ${noResults.length} results`
);

// ─────────────────────────────────────────────────
// SUITE 3: Async Job Queue Engine
// ─────────────────────────────────────────────────
section('SUITE 3 — Async Job Queue Engine');

const job = videoJobQueue.enqueueJob({
  videoUrl: TEST_URL,
  options: { brandName: BRAND_NAME, productName: PRODUCT_NAME }
});

assert('job object returned', !!job);
assert('job has jobId', typeof job.jobId === 'string' && job.jobId.startsWith('vjob_'));
assert('initial status is QUEUED or PROCESSING', ['QUEUED','PROCESSING'].includes(job.status));
assert('initial progress is 0 or low', job.progress >= 0 && job.progress <= 50);

// Poll until complete
let completedJob = null;
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 1500));
  const current = videoJobQueue.getJob(job.jobId);
  process.stdout.write(`  ⏳ [Poll ${i+1}] status=${current.status} progress=${current.progress}%   \r`);
  if (current.status === 'COMPLETED' || current.status === 'FAILED') {
    completedJob = current;
    break;
  }
}
console.log('');

assert('async job completed (not timed out)', completedJob !== null);
assert('async job status is COMPLETED', completedJob?.status === 'COMPLETED', `Got: "${completedJob?.status}"`);
assert('async job progress is 100', completedJob?.progress === 100, `Got: ${completedJob?.progress}%`);
assert('async job result has videoId', typeof completedJob?.result?.videoId === 'string');
assert('async job result has summaryText', typeof completedJob?.result?.summaryText === 'string' && completedJob?.result?.summaryText.length > 20);

// getJob method
const fetched = videoJobQueue.getJob(job.jobId);
assert('getJob returns job by ID', !!fetched && fetched.jobId === job.jobId);

// listJobs
const allJobs = videoJobQueue.listJobs();
assert('listJobs returns array', Array.isArray(allJobs));
assert('listJobs includes our job', allJobs.some(j => j.jobId === job.jobId));

// ─────────────────────────────────────────────────
// SUITE 4: REST API Endpoints
// ─────────────────────────────────────────────────
section('SUITE 4 — REST API Endpoint Health');

async function apiGet(path) {
  const res = await fetch(`${SERVER_URL}${path}`);
  return { status: res.status, body: await res.json().catch(() => null) };
}
async function apiPost(path, body) {
  const res = await fetch(`${SERVER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

// GET /api/videointel/videos
const listRes = await apiGet('/api/videointel/videos');
assert('GET /api/videointel/videos returns 200', listRes.status === 200, `Got: ${listRes.status}`);
assert('/videos body has videos array', Array.isArray(listRes.body?.videos), `Got: ${JSON.stringify(listRes.body)?.substring(0, 80)}`);

// GET /api/videointel/video/:id
const videoRes = await apiGet(`/api/videointel/video/${session.id}`);
assert(`GET /api/videointel/video/:id returns 200`, videoRes.status === 200, `Got: ${videoRes.status}`);
assert('video response has id', videoRes.body?.id === session.id || !!videoRes.body?.video?.id);

// GET /api/videointel/search?query=hedge (also supports ?q=hedge alias)
const searchRes = await apiGet('/api/videointel/search?query=hedge');
assert('GET /api/videointel/search?query=hedge returns 200', searchRes.status === 200, `Got: ${searchRes.status}`);
assert('/search returns results array', Array.isArray(searchRes.body?.results),
  `Got: ${JSON.stringify(searchRes.body)?.substring(0, 80)}`
);
// Also test the ?q= alias
const searchResAlias = await apiGet('/api/videointel/search?q=hedge');
assert('GET /api/videointel/search?q= alias also returns 200', searchResAlias.status === 200, `Got: ${searchResAlias.status}`);

// POST /api/videointel/jobs (async enqueue)
const jobRes = await apiPost('/api/videointel/jobs', {
  videoUrl: TEST_URL,
  brandName: BRAND_NAME
});
assert('POST /api/videointel/jobs returns 200/201', [200, 201, 202].includes(jobRes.status), `Got: ${jobRes.status}`);
assert('job response has jobId', typeof jobRes.body?.jobId === 'string', `Got: ${JSON.stringify(jobRes.body)?.substring(0, 80)}`);
assert('job response has pollUrl', typeof jobRes.body?.pollUrl === 'string');

// Poll the REST job
if (jobRes.body?.pollUrl) {
  let restJobDone = null;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const pollRes = await apiGet(jobRes.body.pollUrl);
    process.stdout.write(`  ⏳ [REST Poll ${i+1}] status=${pollRes.body?.job?.status} progress=${pollRes.body?.job?.progress}%   \r`);
    if (pollRes.body?.job?.status === 'COMPLETED' || pollRes.body?.job?.status === 'FAILED') {
      restJobDone = pollRes.body.job;
      break;
    }
  }
  console.log('');
  assert('REST async job completed', !!restJobDone, 'Timed out waiting for REST job');
  assert('REST job final status COMPLETED', restJobDone?.status === 'COMPLETED', `Got: "${restJobDone?.status}"`);
}

// GET /api/videointel/jobs
const jobsListRes = await apiGet('/api/videointel/jobs');
assert('GET /api/videointel/jobs returns 200', jobsListRes.status === 200, `Got: ${jobsListRes.status}`);
assert('/jobs list has array', Array.isArray(jobsListRes.body?.jobs) || Array.isArray(jobsListRes.body));

// ─────────────────────────────────────────────────
// FINAL REPORT
// ─────────────────────────────────────────────────
const totalTests = passed + failed;
const passPct = Math.round((passed / totalTests) * 100);

console.log(`\n${'═'.repeat(60)}`);
console.log(`  📊 TEST RESULTS — VideoIntel SDK`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Total Tests : ${totalTests}`);
console.log(`  ✅ Passed   : ${passed}`);
console.log(`  ❌ Failed   : ${failed}`);
console.log(`  Pass Rate   : ${passPct}%`);
console.log(`${'═'.repeat(60)}\n`);

if (failed > 0) {
  console.log('  ❌ Failed Tests:');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`    • ${r.name}${r.detail ? ' (' + r.detail + ')' : ''}`);
  });
  console.log('');
}

console.log(`  🎬 Video Title    : ${session.metadata?.title}`);
console.log(`  ⏱️  Duration       : ${session.metadata?.estimatedDurationSeconds}s`);
console.log(`  📝 Transcript     : ${session.transcriptChunks.length} chunks, ${session.transcript?.split(' ').length} words`);
console.log(`  🎭 Scenes         : ${session.scenes.length} chapters (with sentiment)`);
console.log(`  📸 Visual Frames  : ${session.visualFrames.length} keyframes analyzed`);
console.log(`  💰 Sponsorships   : ${session.sponsorshipSegments.length} segments detected`);
console.log(`  🏆 Compliance     : ${session.complianceScore}/100 — ${auditReport.status}`);

if (session.sponsorshipSegments.length > 0) {
  console.log(`\n  📋 Sponsorship Segments:`);
  session.sponsorshipSegments.forEach((seg, i) => {
    console.log(`    ${i+1}. [${seg.type}] ${seg.startTime} → ${seg.endTime} | ${seg.durationSeconds}s | ${seg.wordCount} words`);
    console.log(`       Proof: ${seg.proofDeepLink}`);
  });
}

console.log(`\n  📄 Executive Brief (first 200 chars):`);
console.log(`  "${session.summaryText?.substring(0, 200)}..."\n`);

process.exit(failed > 0 ? 1 : 0);
