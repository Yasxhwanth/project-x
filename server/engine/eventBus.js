import { EventEmitter } from 'events';

/**
 * Project X Event Bus — Singleton EventEmitter
 *
 * Interface designed so the EventEmitter can be swapped for Redis Streams
 * in production without changing subscriber/publisher code.
 *
 * Named event constants:
 */
export const EVENTS = {
  CREATOR_AGREED:         'CREATOR_AGREED',
  CONTENT_PENDING_ISSUED: 'CONTENT_PENDING_ISSUED',
  CONTENT_SUBMITTED:      'CONTENT_SUBMITTED',
  QA_PASSED:              'QA_PASSED',
  QA_REVISION_REQUIRED:   'QA_REVISION_REQUIRED',
  PAYMENT_PROPOSED:       'PAYMENT_PROPOSED',
  PAYMENT_AUTHORIZED:     'PAYMENT_AUTHORIZED',
  PAYMENT_EXECUTED:       'PAYMENT_EXECUTED',
  ESCALATION_CREATED:     'ESCALATION_CREATED',
  ESCALATION_RESOLVED:    'ESCALATION_RESOLVED',
  ACTION_FAILED:          'ACTION_FAILED'
};

class ProjectXEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  publish(eventName, payload) {
    console.log(`[EventBus] → ${eventName}`, JSON.stringify(payload).substring(0, 120));
    this.emit(eventName, payload);
  }

  subscribe(eventName, handler) {
    this.on(eventName, handler);
  }
}

// Singleton export
const eventBus = new ProjectXEventBus();
export default eventBus;
