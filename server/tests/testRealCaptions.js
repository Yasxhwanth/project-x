async function inspectCaptionXml(videoId) {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  const html = await res.text();
  const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
  if (!captionMatch) return console.log('no match');
  const tracks = JSON.parse(captionMatch[1]);
  console.log('Tracks count:', tracks.length, tracks[0].baseUrl);
  const xmlRes = await fetch(tracks[0].baseUrl + '&fmt=json3');
  const text = await xmlRes.text();
  console.log('JSON3 subtitle payload (first 600 chars):', text.substring(0, 600));
}

inspectCaptionXml('vXQdYFcT_uE');
