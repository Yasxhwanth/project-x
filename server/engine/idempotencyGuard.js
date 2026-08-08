import { getDbRow, runDb } from '../database/sqliteDb.js';

/**
 * Idempotency Guard — Correction 3
 *
 * Prevents double-execution of financial and state-changing operations.
 * Critical before any real money moves.
 *
 * Same execution key → same result (no re-execution).
 */

/**
 * Build a deterministic idempotency key.
 * @param {string} actionType - e.g. 'PAYMENT', 'STATE_TRANSITION'
 * @param {string} dealId
 * @param {string} [suffix]   - optional discriminator (e.g. date, stage)
 */
export function buildKey(actionType, dealId, suffix = '') {
  const base = `${actionType}_${dealId}`;
  return suffix ? `${base}_${suffix}` : base;
}

/**
 * Execute an action idempotently.
 * - If key already exists in DB: return cached result without re-executing.
 * - If key is new: execute actionFn, store result, return result.
 *
 * @param {string} key          - idempotency key (use buildKey())
 * @param {string} actionType   - for DB record
 * @param {string|null} dealId  - for DB record
 * @param {Function} actionFn   - async function to execute; must return serializable result
 * @returns {Promise<{ result: any, isReplay: boolean }>}
 */
export async function ensureIdempotent(key, actionType, dealId, actionFn) {
  const existing = await getDbRow(
    `SELECT * FROM idempotency_keys WHERE key = ?`,
    [key]
  );

  if (existing) {
    console.log(`[IdempotencyGuard] Replay detected for key ${key}. Returning cached result.`);
    return {
      result: JSON.parse(existing.result_json),
      isReplay: true
    };
  }

  // Execute the action
  const result = await actionFn();

  // Store the key + result
  await runDb(
    `INSERT INTO idempotency_keys (key, action_type, deal_id, result_json) VALUES (?, ?, ?, ?)`,
    [key, actionType, dealId || null, JSON.stringify(result)]
  );

  return { result, isReplay: false };
}
