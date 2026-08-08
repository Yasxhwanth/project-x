import { queryDb, runDb } from '../database/sqliteDb.js';
import eventBus from './eventBus.js';

let dispatcherInterval = null;

/**
 * Outbox Dispatcher — Correction 2
 *
 * Polls `outbox_events` table for PENDING events every 2 seconds.
 * Emits each event to eventBus, then marks it DISPATCHED.
 *
 * This is the seam where Redis Streams / BullMQ replaces setInterval in production.
 * The publisher (campaignStateMachine) and the subscribers (orchestrator) don't change.
 */
export function startDispatcher() {
  if (dispatcherInterval) return; // already running

  dispatcherInterval = setInterval(async () => {
    try {
      const pendingEvents = await queryDb(
        `SELECT * FROM outbox_events WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT 10`
      );

      for (const event of pendingEvents) {
        try {
          const payload = JSON.parse(event.payload_json);

          // Emit to in-process event bus
          eventBus.publish(event.event_name, payload);

          // Mark dispatched
          await runDb(
            `UPDATE outbox_events SET status = 'DISPATCHED', dispatched_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [event.id]
          );
        } catch (emitErr) {
          console.error(`[Dispatcher] Failed to emit event ${event.id}:`, emitErr.message);
          await runDb(
            `UPDATE outbox_events SET status = 'FAILED' WHERE id = ?`,
            [event.id]
          );
        }
      }
    } catch (pollErr) {
      console.error('[Dispatcher] Poll error:', pollErr.message);
    }
  }, 2000);

  console.log('[Dispatcher] Outbox dispatcher started (2s interval)');
}

export function stopDispatcher() {
  if (dispatcherInterval) {
    clearInterval(dispatcherInterval);
    dispatcherInterval = null;
  }
}
