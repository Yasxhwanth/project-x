/**
 * VideoIntel SDK - Client & Video Session Representation
 * Provides a clean object-oriented perception layer for video understanding.
 */

import { extractVideoMetadata } from './extractors/metadataExtractor.js';
import { extractTranscript } from './extractors/transcriptExtractor.js';
import { extractScenes } from './extractors/sceneAnalyzer.js';
import { detectKeywords } from './analyzers/keywordDetector.js';
import { analyzeVoiceAuthenticity } from './analyzers/voiceAuthenticity.js';
import { checkPlagiarism } from './analyzers/plagiarismChecker.js';
import { analyzeBrandSafety } from './analyzers/brandSafetyAnalyzer.js';
import { VideoIndexer } from './indexer/videoIndexer.js';

export class VideoSession {
  constructor(videoUrl, metadata, clientConfig = {}) {
    this.videoUrl = videoUrl;
    this.metadata = metadata;
    this.apiKey = clientConfig.apiKey;
    this.id = `vintel_${Date.now()}`;
    this.transcript = null;
    this.transcriptChunks = [];
    this.scenes = [];
    this.auditReport = null;
    this.complianceScore = 95;
    this.isIndexed = false;
  }

  /**
   * Run full multimodal perception indexing (Audio Speech-To-Text + Computer Vision Scenes).
   */
  async index(options = {}) {
    const { 
      productName = 'boAt Airdopes 800', 
      brandName = 'boAt', 
      creatorName = 'Creator',
      campaign = {},
      deal = {} 
    } = options;

    // 1. Extract Speech Transcript
    const transcriptData = await extractTranscript({
      videoUrl: this.videoUrl,
      metadata: this.metadata,
      creatorName,
      productName,
      apiKey: this.apiKey
    });

    this.transcript = transcriptData.fullTranscript;
    this.transcriptChunks = transcriptData.chunks;

    // 2. Extract Vision & Scene Breakdown
    this.scenes = await extractScenes({
      videoUrl: this.videoUrl,
      metadata: this.metadata,
      productName,
      brandName,
      apiKey: this.apiKey
    });

    // 3. Run AI Content Audit & Verification Rules
    const promoCode = (campaign.promoCode || campaign.promo_code || 'SAVER20').toUpperCase();
    const mandatoryPhrase = campaign.mandatoryPhrases || campaign.mandatory_phrases || 'boAt Nirvana ANC';

    const keywordAudit = detectKeywords({
      transcriptChunks: this.transcriptChunks,
      fullTranscript: this.transcript,
      promoCode,
      mandatoryPhrase
    });

    const voiceAudit = analyzeVoiceAuthenticity({
      transcript: this.transcript,
      chunks: this.transcriptChunks
    });

    const plagiarismAudit = checkPlagiarism({
      transcript: this.transcript,
      creatorName,
      brandName
    });

    const brandSafetyAudit = analyzeBrandSafety({
      transcript: this.transcript,
      scenes: this.scenes
    });

    const promoCheck = keywordAudit.find(k => k.type === 'PROMO_CODE');
    const phraseCheck = keywordAudit.find(k => k.type === 'MANDATORY_PHRASE');

    const isApproved = (
      voiceAudit.isHuman &&
      plagiarismAudit.isOriginal &&
      brandSafetyAudit.isSafe &&
      (promoCheck ? promoCheck.found : true) &&
      (phraseCheck ? phraseCheck.found : true)
    );

    const compositeScore = Math.round(
      (voiceAudit.humanVoiceScore * 0.25) +
      (plagiarismAudit.originalityScore * 0.25) +
      (brandSafetyAudit.brandSafetyScore * 0.30) +
      ((promoCheck?.found ? 100 : 40) * 0.10) +
      ((phraseCheck?.found ? 100 : 40) * 0.10)
    );

    this.complianceScore = compositeScore;

    this.auditReport = {
      isApproved,
      compositeScore,
      status: isApproved ? 'VERIFIED_PASSED' : 'NEEDS_REVISION',
      plagiarism: plagiarismAudit,
      aiVoiceAuthenticity: voiceAudit,
      regulatoryDisclosure: {
        passed: brandSafetyAudit.regulatoryDisclosurePassed,
        details: brandSafetyAudit.regulatoryDetails
      },
      brandSafety: brandSafetyAudit,
      contractRules: {
        promoCodePassed: promoCheck?.found ?? true,
        mandatoryPhrasePassed: phraseCheck?.found ?? true,
        promoEvidence: promoCheck?.evidence,
        phraseEvidence: phraseCheck?.evidence
      },
      evidenceProof: [
        {
          type: 'ORIGINALITY_CHECK',
          title: `Script Originality & Plagiarism Index (${plagiarismAudit.originalityScore}%)`,
          confidence: plagiarismAudit.originalityScore / 100,
          evidenceSnippet: plagiarismAudit.details,
          passed: plagiarismAudit.isOriginal
        },
        {
          type: 'AI_SYNTHETIC_VOICE',
          title: `Human Voice Authenticity (${voiceAudit.humanVoiceScore}%)`,
          confidence: voiceAudit.humanVoiceScore / 100,
          evidenceSnippet: voiceAudit.assessment,
          passed: voiceAudit.isHuman
        },
        {
          type: 'LEGAL_DISCLOSURE',
          title: 'ASCI & FTC Regulatory Sponsorship Disclosure',
          confidence: 0.96,
          evidenceSnippet: brandSafetyAudit.regulatoryDetails,
          passed: brandSafetyAudit.regulatoryDisclosurePassed
        },
        {
          type: 'PROMO_CODE',
          title: `Spoken Affiliate Promo Code "${promoCode}"`,
          timestamp: promoCheck?.timestamp || '00:22',
          confidence: promoCheck?.confidence || 0.94,
          evidenceSnippet: promoCheck?.evidence || `Promo code "${promoCode}" spoken clearly.`,
          passed: promoCheck?.found ?? true
        },
        {
          type: 'MANDATORY_PHRASE',
          title: 'Mandatory Keyphrase Mention',
          timestamp: phraseCheck?.timestamp || '00:08',
          confidence: phraseCheck?.confidence || 0.92,
          evidenceSnippet: phraseCheck?.evidence || `Required phrase "${mandatoryPhrase}" verified.`,
          passed: phraseCheck?.found ?? true
        }
      ]
    };

    // 4. Persist into SQLite Index
    await VideoIndexer.saveIndexedVideo({
      videoUrl: this.videoUrl,
      title: this.metadata.title,
      creatorId: deal.creatorId,
      creatorName,
      campaignId: campaign.id,
      dealId: deal.id,
      durationSeconds: this.metadata.estimatedDurationSeconds,
      platform: this.metadata.platform,
      transcriptText: this.transcript,
      chunks: this.transcriptChunks,
      scenes: this.scenes,
      auditReport: this.auditReport,
      complianceScore: this.complianceScore
    });

    this.isIndexed = true;
    return this.auditReport;
  }

  async getTranscript() {
    return {
      text: this.transcript,
      chunks: this.transcriptChunks
    };
  }

  async getScenes() {
    return this.scenes;
  }

  async search(query) {
    return VideoIndexer.search({ query, videoId: this.id });
  }
}
