/**
 * VideoIntel SDK - Async Job Queue & Perception Poller
 * Handles asynchronous background perception jobs with real-time status & progress updates.
 */

import { v4 as uuidv4 } from 'uuid';
import { videoIntel } from '../index.js';

class VideoJobQueue {
  constructor() {
    this.jobs = new Map();
    this.maxRetentionHours = 24;
  }

  /**
   * Enqueue a new async video indexing job
   */
  enqueueJob({ videoUrl, options = {} }) {
    const jobId = `vjob_${Date.now()}_${uuidv4().substring(0, 6)}`;
    const now = new Date().toISOString();

    const job = {
      jobId,
      videoUrl,
      status: 'QUEUED',
      progress: 0,
      currentStep: 'Job queued in perception backlog',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      error: null,
      result: null
    };

    this.jobs.set(jobId, job);

    // Launch execution asynchronously without blocking caller
    this._executeJob(jobId, videoUrl, options).catch(err => {
      console.error(`[VideoIntel JobQueue] Job ${jobId} failed:`, err);
    });

    return {
      jobId,
      videoUrl,
      status: job.status,
      progress: job.progress,
      pollUrl: `/api/videointel/jobs/${jobId}`
    };
  }

  /**
   * Internal worker execution with progress reporting
   */
  async _executeJob(jobId, videoUrl, options) {
    const updateJob = (updates) => {
      const existing = this.jobs.get(jobId);
      if (existing) {
        this.jobs.set(jobId, {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString()
        });
      }
    };

    try {
      updateJob({
        status: 'PROCESSING',
        progress: 15,
        currentStep: 'Extracting authentic subtitle & speech track'
      });

      const session = videoIntel.upload(videoUrl, { apiKey: options.apiKey });

      updateJob({
        progress: 40,
        currentStep: 'Running Gemini Multimodal Vision on keyframe stills'
      });

      const auditReport = await session.index({
        productName: options.productName,
        brandName: options.brandName,
        creatorName: options.creatorName,
        campaign: options.campaign || {},
        deal: options.deal || {}
      });

      updateJob({
        status: 'COMPLETED',
        progress: 100,
        currentStep: 'Multimodal indexing and compliance verification completed',
        completedAt: new Date().toISOString(),
        result: {
          videoId: session.id,
          videoUrl: session.videoUrl,
          metadata: session.metadata,
          summaryText: session.summaryText,
          complianceScore: session.complianceScore,
          auditReport,
          visualFrames: session.visualFrames,
          sponsorshipSegments: session.sponsorshipSegments,
          scenes: session.scenes,
          transcriptChunksCount: session.transcriptChunks?.length || 0
        }
      });
    } catch (err) {
      updateJob({
        status: 'FAILED',
        progress: 100,
        currentStep: 'Job failed during perception cycle',
        completedAt: new Date().toISOString(),
        error: err.message || 'Perception engine error'
      });
    }
  }

  /**
   * Retrieve job status by ID
   */
  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  /**
   * List recent jobs
   */
  listJobs(limit = 20) {
    const list = Array.from(this.jobs.values());
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list.slice(0, limit);
  }
}

export const videoJobQueue = new VideoJobQueue();
export default videoJobQueue;
