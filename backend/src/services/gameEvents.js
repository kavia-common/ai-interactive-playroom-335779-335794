'use strict';

const crypto = require('crypto');

/**
 * GameEventsService
 *
 * Contract:
 * - publish(event): stores event in a ring buffer and notifies subscribers.
 *   event: { type: string, payload: object, playerId?: string }
 * - subscribe(listener): listener(eventEnvelope) -> void ; returns unsubscribe()
 * - listRecent({ limit }): returns last N event envelopes (newest last)
 *
 * Invariants:
 * - Every published event has: id, type, timestamp, payload (object)
 *
 * Observability:
 * - publish logs event id/type.
 */

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

class GameEventsService {
  constructor({ maxBufferSize = 200 } = {}) {
    this.maxBufferSize = maxBufferSize;
    this.buffer = [];
    this.listeners = new Set();
  }

  // PUBLIC_INTERFACE
  publish(event) {
    /** Publish a game event envelope and notify subscribers. */
    const envelope = {
      id: generateId(),
      type: event.type,
      payload: event.payload || {},
      playerId: event.playerId || null,
      timestamp: new Date().toISOString(),
    };

    this.buffer.push(envelope);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.splice(0, this.buffer.length - this.maxBufferSize);
    }

    console.log('[GameEvents:publish]', { id: envelope.id, type: envelope.type });

    for (const listener of this.listeners) {
      try {
        listener(envelope);
      } catch (e) {
        console.error('[GameEvents:listener_error]', e);
      }
    }

    return envelope;
  }

  // PUBLIC_INTERFACE
  listRecent({ limit = 50 } = {}) {
    /** List recent events (newest last). */
    const n = Math.max(0, Math.min(limit, this.buffer.length));
    return this.buffer.slice(this.buffer.length - n);
  }

  // PUBLIC_INTERFACE
  subscribe(listener) {
    /** Subscribe to published events. Returns an unsubscribe function. */
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

module.exports = new GameEventsService();
