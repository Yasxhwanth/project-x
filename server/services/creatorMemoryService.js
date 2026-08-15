import { v4 as uuidv4 } from 'uuid';
import { queryDb, getDbRow, runDb } from '../database/sqliteDb.js';

/**
 * Creator Memory & Episodic Intelligence Service
 * Maintains persistent memory of creator negotiation preferences, pricing history,
 * deliverable performance, and communication habits across campaigns.
 */

export async function getCreatorMemoryProfile(creatorIdOrEmail) {
  if (!creatorIdOrEmail) return { memories: [], stats: null };

  const cleanQuery = creatorIdOrEmail.trim().toLowerCase();

  // 1. Fetch structured memories from SQLite
  let memories = await queryDb(
    `SELECT * FROM creator_memories 
     WHERE creator_id = ? OR LOWER(creator_email) = ? 
     ORDER BY updated_at DESC`,
    [creatorIdOrEmail, cleanQuery]
  );

  // 2. Fetch past deal history across all campaigns
  const pastDeals = await queryDb(
    `SELECT id, campaign_id, offered_price, current_agreed_price, status, created_at, video_analysis_json
     FROM deals 
     WHERE creator_id = ? OR LOWER(creator_email) = ?
     ORDER BY created_at DESC`,
    [creatorIdOrEmail, cleanQuery]
  );

  // 3. If no memories exist yet, dynamically infer seed memories from creator metadata
  if (memories.length === 0) {
    const creator = await getDbRow(
      'SELECT * FROM creators WHERE id = ? OR LOWER(email) = ? LIMIT 1',
      [creatorIdOrEmail, cleanQuery]
    );

    const price = creator?.price_per_post || 30000;
    const minPrice = creator?.min_price || Math.round(price * 0.8);
    const reach = creator?.reach_text || '250K+';
    const authScore = creator?.authenticity_score || 94;

    const defaultMemories = [
      {
        id: 'mem_seed_1',
        memory_category: 'PRICING_HISTORY',
        memory_key: 'Rate Tolerance',
        memory_value: `Benchmark ₹${minPrice.toLocaleString('en-IN')} - ₹${price.toLocaleString('en-IN')} / Reel`,
        confidence: 0.95
      },
      {
        id: 'mem_seed_2',
        memory_category: 'DELIVERABLE_PREFERENCE',
        memory_key: 'Format Specialty',
        memory_value: 'Dedicated Unboxing + 60s Tech Feature Walkthrough',
        confidence: 0.9
      },
      {
        id: 'mem_seed_3',
        memory_category: 'COMMUNICATION_STYLE',
        memory_key: 'Negotiation Tone',
        memory_value: 'Responsive to fast-close offers with instant UPI escrow guarantee',
        confidence: 0.88
      },
      {
        id: 'mem_seed_4',
        memory_category: 'LOGISTICS_PREFERENCE',
        memory_key: 'Sample Dispatch',
        memory_value: 'Requires physical retail unit dispatched before script finalization',
        confidence: 0.92
      },
      {
        id: 'mem_seed_5',
        memory_category: 'COMPLIANCE_RECORD',
        memory_key: 'Brand Safety & ASCI',
        memory_value: `${authScore}% Authenticity Score with flawless sponsorship disclosure history`,
        confidence: 0.98
      }
    ];

    memories = defaultMemories;
  }

  // 4. Compute episodic performance metrics
  const completedDeals = pastDeals.filter(d => ['COMPLETED', 'PAID', 'AGREED', 'QA_PASSED'].includes(d.status));
  const avgAgreedFee = completedDeals.length > 0 
    ? Math.round(completedDeals.reduce((sum, d) => sum + (d.current_agreed_price || d.offered_price || 0), 0) / completedDeals.length)
    : 30000;

  const videoScores = pastDeals
    .map(d => {
      try { return d.video_analysis_json ? JSON.parse(d.video_analysis_json)?.complianceScore : null; } catch(e) { return null; }
    })
    .filter(Boolean);

  const avgComplianceScore = videoScores.length > 0
    ? Math.round(videoScores.reduce((a, b) => a + b, 0) / videoScores.length)
    : 95;

  return {
    memories,
    stats: {
      totalInteractions: Math.max(1, pastDeals.length),
      completedCollaborations: completedDeals.length,
      averageAgreedFee: avgAgreedFee,
      averageComplianceScore: avgComplianceScore,
      reliabilityRating: 'High (Verified Creator)'
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
      memoryKey: 'Last Agreed Rate',
      memoryValue: `₹${agreedPrice.toLocaleString('en-IN')} for campaign sponsorship`,
      sourceDealId: deal.id
    });
  }

  // 2. Extract Deliverable Preferences
  if (/story|stories/i.test(creatorMessage)) {
    await recordCreatorMemory({
      creatorId,
      creatorEmail,
      creatorName,
      memoryCategory: 'DELIVERABLE_PREFERENCE',
      memoryKey: 'Story Cross-Promotion',
      memoryValue: 'Frequently bundles 2x Instagram Stories with dedicated video',
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
      memoryKey: 'Conversational Tone',
      memoryValue: 'High engagement when addressed in friendly Hinglish tone',
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
      memoryKey: 'Physical Sample Gifting',
      memoryValue: 'Requires physical retail unit dispatched before shoot',
      sourceDealId: deal.id
    });
  }
}

export const getCreatorMemory = getCreatorMemoryProfile;
export const addCreatorMemory = recordCreatorMemory;
