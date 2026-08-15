import { v4 as uuidv4 } from 'uuid';
import { queryDb, getDbRow, runDb } from '../database/sqliteDb.js';

/**
 * Creator Memory & Episodic Intelligence Service
 * Maintains persistent memory of creator negotiation preferences, pricing history,
 * deliverable performance, and communication habits across campaigns.
 */

export async function getCreatorMemoryProfile(creatorIdOrEmail) {
  if (!creatorIdOrEmail) return { memories: [], stats: null };

  // 1. Fetch structured memories
  const memories = await queryDb(
    `SELECT * FROM creator_memories 
     WHERE creator_id = ? OR LOWER(creator_email) = LOWER(?) 
     ORDER BY updated_at DESC`,
    [creatorIdOrEmail, creatorIdOrEmail]
  );

  // 2. Fetch past deal history across all campaigns
  const pastDeals = await queryDb(
    `SELECT id, campaign_id, offered_price, current_agreed_price, status, created_at, video_analysis_json
     FROM deals 
     WHERE creator_id = ? OR LOWER(creator_email) = LOWER(?)
     ORDER BY created_at DESC`,
    [creatorIdOrEmail, creatorIdOrEmail]
  );

  // 3. Compute episodic performance metrics
  const completedDeals = pastDeals.filter(d => ['COMPLETED', 'PAID', 'AGREED'].includes(d.status));
  const avgAgreedFee = completedDeals.length > 0 
    ? Math.round(completedDeals.reduce((sum, d) => sum + (d.current_agreed_price || d.offered_price || 0), 0) / completedDeals.length)
    : null;

  const videoScores = pastDeals
    .map(d => {
      try { return d.video_analysis_json ? JSON.parse(d.video_analysis_json)?.overallScore : null; } catch(e) { return null; }
    })
    .filter(Boolean);

  const avgComplianceScore = videoScores.length > 0
    ? Math.round(videoScores.reduce((a, b) => a + b, 0) / videoScores.length)
    : 92; // Default benchmark

  return {
    memories,
    stats: {
      totalInteractions: pastDeals.length,
      completedCollaborations: completedDeals.length,
      averageAgreedFee: avgAgreedFee,
      averageComplianceScore: avgComplianceScore,
      reliabilityRating: completedDeals.length > 0 ? 'High' : 'New / Evaluating'
    }
  };
}

export async function recordCreatorMemory({
  creatorId,
  creatorEmail,
  creatorName,
  memoryCategory = 'COMMUNICATION_STYLE',
  memoryKey,
  memoryValue,
  confidence = 1.0,
  sourceDealId = null
}) {
  const id = 'mem_' + uuidv4().substring(0, 8);
  const cleanEmail = (creatorEmail || '').trim().toLowerCase();

  // Check if memory key already exists for this creator
  const existing = await getDbRow(
    `SELECT id FROM creator_memories 
     WHERE (creator_id = ? OR LOWER(creator_email) = ?) AND memory_key = ?`,
    [creatorId, cleanEmail, memoryKey]
  );

  if (existing) {
    await runDb(
      `UPDATE creator_memories 
       SET memory_value = ?, confidence = ?, source_deal_id = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [memoryValue, confidence, sourceDealId, existing.id]
    );
    return { id: existing.id, updated: true };
  }

  await runDb(
    `INSERT INTO creator_memories (
      id, creator_id, creator_email, creator_name, memory_category, memory_key, memory_value, confidence, source_deal_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, creatorId || '', cleanEmail, creatorName || '', memoryCategory, memoryKey, memoryValue, confidence, sourceDealId]
  );

  return { id, created: true };
}

/**
 * Automatically extracts facts & negotiation preferences from message exchanges
 */
export async function autoExtractMemoriesFromThread({ deal, creatorMessage, agreedPrice, newStatus }) {
  if (!deal) return;

  const creatorId = deal.creatorId || deal.creator_id;
  const creatorEmail = deal.creatorEmail || deal.creator_email;
  const creatorName = deal.creatorName || deal.creator_name;

  // 1. Extract Rate Preferences
  if (agreedPrice) {
    await recordCreatorMemory({
      creatorId,
      creatorEmail,
      creatorName,
      memoryCategory: 'PRICING_HISTORY',
      memoryKey: 'last_agreed_rate',
      memoryValue: `₹${agreedPrice.toLocaleString('en-IN')}`,
      sourceDealId: deal.id
    });
  }

  // 2. Extract Deliverable Preferences (e.g. Reels, Stories, YouTube)
  if (/story|stories/i.test(creatorMessage)) {
    await recordCreatorMemory({
      creatorId,
      creatorEmail,
      creatorName,
      memoryCategory: 'DELIVERABLE_PREFERENCE',
      memoryKey: 'bundles_stories',
      memoryValue: 'Frequently offers Instagram Story cross-promotions with Reels',
      sourceDealId: deal.id
    });
  }

  // 3. Extract Communication Traits
  if (/bhai|bro|yaar|namaste/i.test(creatorMessage)) {
    await recordCreatorMemory({
      creatorId,
      creatorEmail,
      creatorName,
      memoryCategory: 'COMMUNICATION_STYLE',
      memoryKey: 'preferred_tone',
      memoryValue: 'Responsive to friendly, Hinglish/Indian conversational greetings',
      sourceDealId: deal.id
    });
  }

  // 4. Logistics / Gifting
  if (/sample|unboxing|unit|address|ship/i.test(creatorMessage)) {
    await recordCreatorMemory({
      creatorId,
      creatorEmail,
      creatorName,
      memoryCategory: 'LOGISTICS_PREFERENCE',
      memoryKey: 'sample_dispatch',
      memoryValue: 'Requires physical product sample unit before commencing shoot',
      sourceDealId: deal.id
    });
  }
}

export const getCreatorMemory = getCreatorMemoryProfile;
export const addCreatorMemory = recordCreatorMemory;
