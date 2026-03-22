'use strict';

const { object, string, number } = require('./schema');

const emitEventBodySchema = object(
  {
    type: string({ min: 1, max: 64 }),
    playerId: string({ optional: true, max: 128, allowEmpty: false }),
    payload: object({}, { allowUnknown: true }),
  },
  { allowUnknown: false }
);

const listEventsQuerySchema = object(
  {
    limit: number({ optional: true, min: 1, max: 200, integer: true }),
  },
  { allowUnknown: false }
);

module.exports = {
  emitEventBodySchema,
  listEventsQuerySchema,
};
