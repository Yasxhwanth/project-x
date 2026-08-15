/**
 * VideoIntel SDK - Main Entrypoint
 * Open, sovereign multimodal video perception & indexing engine.
 * Direct self-hosted replacement for VideoDB.
 */

import { extractVideoMetadata } from './extractors/metadataExtractor.js';
import { VideoSession } from './VideoIntelClient.js';
import { VideoIndexer } from './indexer/videoIndexer.js';

export class VideoIntel {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    this.organizationId = config.organizationId || null;
  }

  /**
   * Register or upload a video URL for perception indexing.
   */
  upload(videoUrl, options = {}) {
    const metadata = extractVideoMetadata(videoUrl);
    return new VideoSession(videoUrl, metadata, { apiKey: this.apiKey, ...options });
  }

  /**
   * Search across all indexed videos for speech, scenes, or keywords.
   */
  async search(query, options = {}) {
    return VideoIndexer.search({ query, ...options });
  }

  /**
   * Retrieve an existing indexed video by its ID.
   */
  async getVideo(videoId) {
    return VideoIndexer.getVideoById(videoId);
  }
}

// Singleton convenience export
export const videoIntel = new VideoIntel();
export default VideoIntel;
