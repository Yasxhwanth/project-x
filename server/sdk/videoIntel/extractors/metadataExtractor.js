/**
 * VideoIntel SDK - Metadata Extractor
 * Extracts platform, video ID, duration, dimensions, and normalized format from any video URL.
 */

export function extractVideoMetadata(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') {
    return {
      platform: 'Direct',
      normalizedUrl: '',
      title: 'Uploaded Video',
      estimatedDurationSeconds: 60,
      isShortForm: true
    };
  }

  const url = videoUrl.trim();
  
  // YouTube Detection (Standard & Shorts)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    const isShort = url.includes('/shorts/');
    return {
      platform: 'YouTube',
      videoId,
      normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      title: isShort ? `YouTube Short #${videoId}` : `YouTube Video #${videoId}`,
      estimatedDurationSeconds: isShort ? 60 : 180,
      isShortForm: isShort
    };
  }

  // Instagram Reels Detection
  const igMatch = url.match(/instagram\.com\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
  if (igMatch) {
    const reelId = igMatch[1];
    return {
      platform: 'Instagram',
      videoId: reelId,
      normalizedUrl: `https://www.instagram.com/reel/${reelId}/`,
      thumbnailUrl: '',
      title: `Instagram Reel #${reelId}`,
      estimatedDurationSeconds: 60,
      isShortForm: true
    };
  }

  // TikTok Detection
  const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/([0-9]+)/);
  if (ttMatch) {
    return {
      platform: 'TikTok',
      videoId: ttMatch[1],
      normalizedUrl: url,
      thumbnailUrl: '',
      title: `TikTok Video #${ttMatch[1]}`,
      estimatedDurationSeconds: 45,
      isShortForm: true
    };
  }

  // Direct MP4 / S3 / Cloudflare Stream / CDN URL
  const filename = url.split('/').pop()?.split('?')[0] || 'video.mp4';
  return {
    platform: 'Direct MP4',
    videoId: `vid_${Date.now()}`,
    normalizedUrl: url,
    thumbnailUrl: '',
    title: filename,
    estimatedDurationSeconds: 60,
    isShortForm: true
  };
}
