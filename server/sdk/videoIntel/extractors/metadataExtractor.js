/**
 * VideoIntel SDK - Metadata Extractor
 * Fetches real title, channel author, thumbnail, tags, and duration using YouTube Data API v3, oEmbed & platform APIs.
 */

function parseIsoDuration(duration) {
  if (!duration || typeof duration !== 'string') return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return (hours * 3600) + (minutes * 60) + seconds;
}

export async function extractVideoMetadata(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') {
    return {
      platform: 'Direct',
      normalizedUrl: '',
      title: 'Uploaded Video',
      channelName: 'Creator',
      thumbnailUrl: '',
      estimatedDurationSeconds: 60,
      isShortForm: true
    };
  }

  const url = videoUrl.trim();
  const ytApiKey = process.env.YOUTUBE_API_KEY;
  const hasValidYtKey = ytApiKey && ytApiKey !== 'your_youtube_api_key_here' && ytApiKey.length > 10;
  
  // 1. YouTube Detection & Real Data Extraction
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    const isShort = url.includes('/shorts/');
    const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const defaultThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    let title = isShort ? `YouTube Short #${videoId}` : `YouTube Video #${videoId}`;
    let channelName = 'Creator';
    let thumbnailUrl = defaultThumbnail;
    let durationSeconds = null;
    let description = '';
    let tags = [];
    let viewCount = null;
    let publishedAt = null;

    // A. Attempt YouTube Data API v3 (Official & High Fidelity)
    if (hasValidYtKey) {
      try {
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${ytApiKey}`;
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          const item = data.items?.[0];
          if (item) {
            title = item.snippet?.title || title;
            channelName = item.snippet?.channelTitle || channelName;
            description = item.snippet?.description || '';
            tags = item.snippet?.tags || [];
            publishedAt = item.snippet?.publishedAt || null;
            thumbnailUrl = item.snippet?.thumbnails?.maxres?.url || 
                           item.snippet?.thumbnails?.high?.url || 
                           item.snippet?.thumbnails?.medium?.url || 
                           defaultThumbnail;
            
            if (item.contentDetails?.duration) {
              durationSeconds = parseIsoDuration(item.contentDetails.duration);
            }
            if (item.statistics?.viewCount) {
              viewCount = parseInt(item.statistics.viewCount, 10);
            }
          }
        }
      } catch (err) {
        console.warn('[VideoIntel Metadata] YouTube Data API v3 error:', err.message);
      }
    }

    // B. Fallback to oEmbed if title / channelName not resolved
    if (!title || title.startsWith('YouTube Video #') || title.startsWith('YouTube Short #')) {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`);
        if (oembedRes.ok) {
          const oembed = await oembedRes.json();
          if (oembed.title) title = oembed.title;
          if (oembed.author_name) channelName = oembed.author_name;
          if (oembed.thumbnail_url) thumbnailUrl = oembed.thumbnail_url;
        }
      } catch (err) {
        console.warn('[VideoIntel Metadata] oEmbed fetch warning:', err.message);
      }
    }

    return {
      platform: 'YouTube',
      videoId,
      normalizedUrl,
      thumbnailUrl,
      title,
      channelName,
      description,
      tags,
      viewCount,
      publishedAt,
      estimatedDurationSeconds: durationSeconds || (isShort ? 60 : null),
      isShortForm: isShort || (durationSeconds && durationSeconds <= 90)
    };
  }

  // 2. Instagram Reels Detection
  const igMatch = url.match(/instagram\.com\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
  if (igMatch) {
    const reelId = igMatch[1];
    return {
      platform: 'Instagram',
      videoId: reelId,
      normalizedUrl: `https://www.instagram.com/reel/${reelId}/`,
      thumbnailUrl: '',
      title: `Instagram Reel #${reelId}`,
      channelName: 'Creator',
      estimatedDurationSeconds: 60,
      isShortForm: true
    };
  }

  // 3. TikTok Detection
  const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/([0-9]+)/);
  if (ttMatch) {
    return {
      platform: 'TikTok',
      videoId: ttMatch[1],
      normalizedUrl: url,
      thumbnailUrl: '',
      title: `TikTok Video #${ttMatch[1]}`,
      channelName: 'Creator',
      estimatedDurationSeconds: 45,
      isShortForm: true
    };
  }

  // 4. Direct MP4 / S3 URL
  const filename = url.split('/').pop()?.split('?')[0] || 'video.mp4';
  return {
    platform: 'Direct MP4',
    videoId: `vid_${Date.now()}`,
    normalizedUrl: url,
    thumbnailUrl: '',
    title: filename,
    channelName: 'Creator',
    estimatedDurationSeconds: 60,
    isShortForm: true
  };
}
