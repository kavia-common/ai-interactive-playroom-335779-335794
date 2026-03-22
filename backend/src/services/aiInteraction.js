'use strict';

const crypto = require('crypto');

/**
 * AIInteractionFlow (reusable flow entrypoint).
 *
 * Contract:
 * Inputs:
 *  - request: { prompt: string, playerId?: string, context?: { ... }, mode?: string }
 * Outputs:
 *  - result: {
 *      interactionId: string,
 *      reply: string,
 *      effects: Array<{ type: string, payload: object }>,
 *      meta: { model: string, latencyMs: number }
 *    }
 * Errors:
 *  - throws Error with .status/.code/.expose for client-safe errors (rare here)
 * Side effects:
 *  - none (pure-ish). Any future external calls should be added via adapter injection.
 *
 * Observability:
 *  - logs start/end with interactionId and summarized prompt length.
 */

function nowMs() {
  return Date.now();
}

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function buildReply({ prompt, mode }) {
  // Deterministic-ish “AI style” response without external dependencies.
  // Invariant: reply is non-empty string.
  const normalized = prompt.trim();
  const base = mode === 'hint'
    ? 'Hint'
    : mode === 'narrate'
      ? 'Narration'
      : 'Response';

  // Simple templated transform to feel interactive while remaining predictable for debugging.
  return `${base}: I heard "${normalized}". What do you want to try next?`;
}

// PUBLIC_INTERFACE
async function runAIInteractionFlow(request) {
  /** Canonical flow entrypoint for generating AI-style interaction responses. */
  const started = nowMs();
  const interactionId = generateId();

  console.log('[AIInteractionFlow:start]', {
    interactionId,
    playerId: request.playerId || null,
    mode: request.mode || 'default',
    promptLength: request.prompt.length,
  });

  const reply = buildReply(request);

  const result = {
    interactionId,
    reply,
    effects: [
      {
        type: 'LOG',
        payload: {
          message: 'Interaction processed',
          promptEcho: request.prompt.slice(0, 140),
        },
      },
    ],
    meta: {
      model: 'local-template-v1',
      latencyMs: nowMs() - started,
    },
  };

  console.log('[AIInteractionFlow:success]', {
    interactionId,
    latencyMs: result.meta.latencyMs,
  });

  return result;
}

module.exports = {
  runAIInteractionFlow,
};
