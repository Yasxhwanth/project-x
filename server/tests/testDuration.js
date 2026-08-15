async function getExactDuration(videoId) {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const lengthMatch = html.match(/"lengthSeconds":"(\d+)"/);
  if (lengthMatch) {
    const totalSec = parseInt(lengthMatch[1], 10);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    console.log(`✅ Exact YouTube lengthSeconds: ${totalSec} seconds (${mins}m ${secs}s)`);
    return totalSec;
  }
  console.log('lengthSeconds not found');
  return null;
}

getExactDuration('vXQdYFcT_uE');
