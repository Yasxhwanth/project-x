import { v4 as uuidv4 } from 'uuid';
import { runDb, queryDb, getDbRow } from '../database/sqliteDb.js';

/**
 * Creator Data Provenance Service
 *
 * Every creator attribute carries source, confidence, and timestamp.
 * Prevents the system from making confident autonomous decisions
 * from stale or fabricated-looking numbers.
 *
 * Source values:   "SEED_DATA" | "INSTAGRAM_API" | "YOUTUBE_API" | "MODEL_ESTIMATE"
 * Confidence values: "HIGH" | "MEDIUM" | "LOW"
 */

/**
 * Record (or upsert) a provenance entry for a creator attribute.
 */
export async function recordProvenance(creatorId, attribute, value, source, confidence, expiresInHours = null) {
  const id = `prov_${creatorId.substring(0, 6)}_${attribute}_${Date.now()}`;
  const now = new Date().toISOString();
  const expiresAt = expiresInHours
    ? new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString()
    : null;

  // Upsert: remove stale record for same creator+attribute first
  await runDb(
    `DELETE FROM creator_data_provenance WHERE creator_id = ? AND attribute = ?`,
    [creatorId, attribute]
  );

  await runDb(
    `INSERT INTO creator_data_provenance (id, creator_id, attribute, value, source, confidence, collected_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, creatorId, attribute, String(value), source, confidence, now, expiresAt]
  );
}

/**
 * Get all provenance records for a creator.
 */
export async function getProvenance(creatorId) {
  return queryDb(
    `SELECT * FROM creator_data_provenance WHERE creator_id = ? ORDER BY attribute ASC`,
    [creatorId]
  );
}

/**
 * Get a single attribute with its provenance metadata.
 */
export async function getAttributeWithProvenance(creatorId, attribute) {
  const record = await getDbRow(
    `SELECT * FROM creator_data_provenance WHERE creator_id = ? AND attribute = ?`,
    [creatorId, attribute]
  );
  return record || null;
}

/**
 * Check whether a provenance record is stale.
 */
export function isStale(record, maxAgeHours = 24) {
  if (!record) return true;
  const collectedAt = new Date(record.collected_at).getTime();
  const ageMs = Date.now() - collectedAt;
  return ageMs > maxAgeHours * 3600 * 1000;
}

/**
 * Seed provenance for a creator from seed data (confidence: LOW).
 */
export async function seedCreatorProvenance(creator) {
  const fields = [
    { attr: 'followers',        value: creator.followers_raw,    confidence: 'LOW' },
    { attr: 'engagement_rate',  value: creator.engagement_rate,  confidence: 'LOW' },
    { attr: 'price_per_post',   value: creator.price_per_post,   confidence: 'LOW' },
    { attr: 'location',         value: creator.location,         confidence: 'MEDIUM' },
    { attr: 'niche',            value: creator.niche,            confidence: 'MEDIUM' },
    { attr: 'platform',         value: creator.platform,         confidence: 'HIGH' }
  ];

  for (const { attr, value, confidence } of fields) {
    if (value !== undefined && value !== null) {
      await recordProvenance(creator.id, attr, value, 'SEED_DATA', confidence);
    }
  }
}
