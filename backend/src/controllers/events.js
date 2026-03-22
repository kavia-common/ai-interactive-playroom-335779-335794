'use strict';

const gameEvents = require('../services/gameEvents');

class EventsController {
  // PUBLIC_INTERFACE
  emit(req, res) {
    /** Emit a new game event (primarily for dev/testing and frontend integration). */
    const event = req.validatedBody;
    const envelope = gameEvents.publish(event);
    return res.status(201).json({ status: 'ok', event: envelope });
  }

  // PUBLIC_INTERFACE
  list(req, res) {
    /** List recent game events from in-memory buffer. */
    const { limit } = req.validatedQuery;
    const events = gameEvents.listRecent({ limit });
    return res.status(200).json({ status: 'ok', events });
  }

  // PUBLIC_INTERFACE
  streamSSE(req, res) {
    /**
     * Server-Sent Events stream of game events.
     * Note: This is an optional real-time transport in lieu of WebSocket.
     */
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial comment to establish stream.
    res.write(': connected\n\n');

    const unsubscribe = gameEvents.subscribe((event) => {
      // SSE format: "event:" optional, "data:" required, blank line terminator.
      res.write(`event: game_event\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    req.on('close', () => {
      unsubscribe();
    });
  }
}

module.exports = new EventsController();
