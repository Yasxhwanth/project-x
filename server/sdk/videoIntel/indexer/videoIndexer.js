/**
 * VideoIntel SDK - Video Indexer & Search Engine
 * Persists multimodal video intelligence into SQLite and provides semantic search.
 */

import { runDb, getDbRow, queryDb } from '../../../database/sqliteDb.js';
import { v4 as uuidv4 } from 'uuid';

export class VideoIndexer {
  /**
   * Persist a fully indexed video with its transcript chunks and scene breakdown.
   */
  static async saveIndexedVideo({
    id,
    videoUrl,
    title,
    creatorId,
    creatorName,
    campaignId,
    dealId,
    durationSeconds = 60,
    platform = 'Instagram',
    transcriptText = '',
    chunks = [],
    scenes = [],
    auditReport = {},
    complianceScore = 95
  }) {
    const videoId = id || `vintel_${Date.now()}_${uuidv4().substring(0, 6)}`;

    // 1. Insert main video record
    await runDb(`
      INSERT INTO indexed_videos (
        id, video_url, title, creator_id, creator_name, campaign_id, deal_id,
        duration_seconds, platform, status, transcript_text, scenes_json,
        audit_report_json, compliance_score, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'INDEXED', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      videoId,
      videoUrl,
      title || `${creatorName} - ${platform} Video`,
      creatorId || null,
      creatorName || 'Creator',
      campaignId || null,
      dealId || null,
      durationSeconds,
      platform,
      transcriptText,
      JSON.stringify(scenes),
      JSON.stringify(auditReport),
      complianceScore
    ]);

    // 2. Insert transcript chunks
    for (const chunk of chunks) {
      const chunkId = `chunk_${uuidv4().substring(0, 8)}`;
      await runDb(`
        INSERT INTO video_transcript_chunks (
          id, video_id, start_time, end_time, start_seconds, end_seconds, speaker, text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        chunkId,
        videoId,
        chunk.start || '00:00',
        chunk.end || '00:05',
        chunk.startSeconds || 0,
        chunk.endSeconds || 5,
        chunk.speaker || creatorName || 'Creator',
        chunk.text || ''
      ]).catch(e => console.warn('[VideoIntel Indexer] Chunk save error:', e.message));
    }

    // 3. Insert visual scenes
    for (const scene of scenes) {
      const sceneId = `scene_${uuidv4().substring(0, 8)}`;
      await runDb(`
        INSERT INTO video_scenes (
          id, video_id, start_time, end_time, start_seconds, end_seconds,
          scene_type, visual_description, detected_elements_json, ocr_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sceneId,
        videoId,
        scene.startTime || '00:00',
        scene.endTime || '00:05',
        scene.startSeconds || 0,
        scene.endSeconds || 5,
        scene.sceneType || 'SHOT',
        scene.visualDescription || '',
        JSON.stringify(scene.detectedElements || []),
        scene.ocrText || ''
      ]).catch(e => console.warn('[VideoIntel Indexer] Scene save error:', e.message));
    }

    return {
      videoId,
      videoUrl,
      title,
      status: 'INDEXED',
      complianceScore,
      chunksCount: chunks.length,
      scenesCount: scenes.length
    };
  }

  /**
   * Search indexed videos for spoken phrases, promo codes, or visual scenes.
   */
  static async search({ query, videoId = null, limit = 10 }) {
    if (!query) return [];
    const cleanQuery = `%${query.trim().toLowerCase()}%`;

    let chunksQuery = `
      SELECT c.*, v.video_url, v.title, v.creator_name, v.platform
      FROM video_transcript_chunks c
      JOIN indexed_videos v ON c.video_id = v.id
      WHERE LOWER(c.text) LIKE ?
    `;
    const params = [cleanQuery];

    if (videoId) {
      chunksQuery += ` AND c.video_id = ?`;
      params.push(videoId);
    }

    chunksQuery += ` ORDER BY c.start_seconds ASC LIMIT ?`;
    params.push(limit);

    const matches = await queryDb(chunksQuery, params);
    return matches.map(m => ({
      videoId: m.video_id,
      videoUrl: m.video_url,
      title: m.title,
      creatorName: m.creator_name,
      timestamp: m.start_time,
      startSeconds: m.start_seconds,
      endSeconds: m.end_seconds,
      speaker: m.speaker,
      matchingText: m.text
    }));
  }

  /**
   * Get full video intelligence record by ID.
   */
  static async getVideoById(videoId) {
    const video = await getDbRow(`SELECT * FROM indexed_videos WHERE id = ?`, [videoId]);
    if (!video) return null;

    const chunks = await queryDb(`SELECT * FROM video_transcript_chunks WHERE video_id = ? ORDER BY start_seconds ASC`, [videoId]);
    const scenes = await queryDb(`SELECT * FROM video_scenes WHERE video_id = ? ORDER BY start_seconds ASC`, [videoId]);

    return {
      ...video,
      scenes: scenes.map(s => ({
        ...s,
        detectedElements: s.detected_elements_json ? JSON.parse(s.detected_elements_json) : []
      })),
      transcriptChunks: chunks,
      auditReport: video.audit_report_json ? JSON.parse(video.audit_report_json) : null
    };
  }
}
