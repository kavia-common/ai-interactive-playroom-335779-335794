'use strict';

const express = require('express');
const aiController = require('../controllers/ai');
const eventsController = require('../controllers/events');
const { validateBody, validateQuery, asyncHandler } = require('../middleware/http');
const { aiInteractBodySchema } = require('../validation/aiSchemas');
const { emitEventBodySchema, listEventsQuerySchema } = require('../validation/eventSchemas');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Service health checks
 *   - name: AI
 *     description: AI-style interaction support endpoints
 *   - name: Events
 *     description: Game event emission and streaming
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AIInteractRequest:
 *       type: object
 *       required: [prompt]
 *       additionalProperties: false
 *       properties:
 *         prompt:
 *           type: string
 *           description: Player input prompt to generate an AI-style response.
 *           example: "I open the mysterious door."
 *         playerId:
 *           type: string
 *           description: Optional player identifier.
 *           example: "player-123"
 *         mode:
 *           type: string
 *           description: Optional mode that changes response style.
 *           example: "narrate"
 *         context:
 *           type: object
 *           description: Optional free-form context to help the experience.
 *           additionalProperties: true
 *     AIInteractResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: ok
 *         result:
 *           type: object
 *           properties:
 *             interactionId:
 *               type: string
 *               example: "b3e0e2d4-2d88-4a19-9b87-3d79c8f1c2c1"
 *             reply:
 *               type: string
 *               example: "Response: I heard \"I open the mysterious door.\". What do you want to try next?"
 *             effects:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type: { type: string, example: LOG }
 *                   payload: { type: object, additionalProperties: true }
 *             meta:
 *               type: object
 *               properties:
 *                 model: { type: string, example: "local-template-v1" }
 *                 latencyMs: { type: number, example: 12 }
 *     GameEventEmitRequest:
 *       type: object
 *       required: [type, payload]
 *       additionalProperties: false
 *       properties:
 *         type:
 *           type: string
 *           example: "PLAYER_ACTION"
 *         playerId:
 *           type: string
 *           example: "player-123"
 *         payload:
 *           type: object
 *           additionalProperties: true
 *           example: { action: "jump" }
 *     GameEventEnvelope:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         type: { type: string }
 *         playerId: { type: string, nullable: true }
 *         timestamp: { type: string, format: date-time }
 *         payload: { type: object, additionalProperties: true }
 */

/**
 * @swagger
 * /api/ai/interact:
 *   post:
 *     tags: [AI]
 *     summary: Generate an AI-style interaction response
 *     description: >
 *       Returns a deterministic "AI-style" reply plus optional effects.
 *       This is designed so the frontend can test interaction loops without external model dependencies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIInteractRequest'
 *     responses:
 *       200:
 *         description: AI interaction response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIInteractResponse'
 *       400:
 *         description: Validation error
 */
router.post(
  '/ai/interact',
  validateBody(aiInteractBodySchema),
  asyncHandler(aiController.interact.bind(aiController))
);

/**
 * @swagger
 * /api/events:
 *   post:
 *     tags: [Events]
 *     summary: Emit a game event (in-memory)
 *     description: Emits an event into an in-memory buffer and notifies live subscribers (SSE).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameEventEmitRequest'
 *     responses:
 *       201:
 *         description: Event envelope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 event:
 *                   $ref: '#/components/schemas/GameEventEnvelope'
 *       400:
 *         description: Validation error
 *   get:
 *     tags: [Events]
 *     summary: List recent game events (in-memory)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 200, default: 50 }
 *         description: Max number of events to return.
 *     responses:
 *       200:
 *         description: Recent events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GameEventEnvelope'
 */
router.post('/events', validateBody(emitEventBodySchema), eventsController.emit.bind(eventsController));
router.get('/events', validateQuery(listEventsQuerySchema), eventsController.list.bind(eventsController));

/**
 * @swagger
 * /api/events/stream:
 *   get:
 *     tags: [Events]
 *     summary: Stream game events via Server-Sent Events (SSE)
 *     description: >
 *       Optional real-time event stream. Connect with EventSource from the browser.
 *       Each message is emitted as event "game_event".
 *     responses:
 *       200:
 *         description: SSE stream (text/event-stream)
 */
router.get('/events/stream', eventsController.streamSSE.bind(eventsController));

module.exports = router;
