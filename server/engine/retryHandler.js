import { runDb } from '../database/sqliteDb.js';
import eventBus, { EVENTS } from './eventBus.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Retry Handler with Dead Letter Queue
 *
 * Wraps an async agent action with exponential backoff retries.
 * On exhaustion, writes to dead_letter_queue and emits ACTION_FAILED event.
 */

/**
 * Execute an async action with retry + dead-letter fallback.
 *
 * @param {Function} actionFn        - async function to execute
 * @param {object}   options
 * @param {number}   options.maxRetries   - default 3
 * @param {number}   options.delayMs      - base delay in ms, doubles each retry (default 500)
 * @param {string}   options.dealId
 * @param {string}   options.agentName
 * @param {string}   options.actionType
 * @param {object}   options.payload      - serializable payload for DLQ record
 */
export async function executeWithRetry(actionFn, {
  maxRetries = 3,
  delayMs = 500,
  dealId,
  agentName,
  actionType,
  payload = {}
}) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await actionFn();
      return result; // success
    } catch (err) {
      lastError = err;
      console.warn(`[RetryHandler] Attempt ${attempt}/${maxRetries} failed — ${agentName}/${actionType}: ${err.message}`);

      if (attempt < maxRetries) {
        // Exponential backoff: 500ms → 1000ms → 2000ms
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  // All retries exhausted — write to dead letter queue
  const dlqId = 'dlq_' + uuidv4().substring(0, 8);
  await runDb(
    `INSERT INTO dead_letter_queue (id, agent_name, action_type, deal_id, payload_json, error, retry_count, max_retries)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [dlqId, agentName, actionType, dealId || null,
     JSON.stringify(payload), lastError.message, maxRetries, maxRetries]
  );

  console.error(`[RetryHandler] Dead Letter Queue entry created: ${dlqId} for ${agentName}/${actionType}`);

  // Emit ACTION_FAILED for orchestrator to handle
  eventBus.publish(EVENTS.ACTION_FAILED, {
    dlqId, agentName, actionType, dealId,
    error: lastError.message,
    retryCount: maxRetries,
    maxRetries,
    payload
  });

  throw lastError;
}
