'use strict';

const { object, string } = require('./schema');

const aiInteractBodySchema = object(
  {
    prompt: string({ min: 1, max: 2000 }),
    playerId: string({ optional: true, max: 128, allowEmpty: false }),
    mode: string({ optional: true, max: 32, allowEmpty: false }), // e.g. hint|narrate|default
    context: object({}, { allowUnknown: true }), // optional free-form context object
  },
  { allowUnknown: false }
);

module.exports = {
  aiInteractBodySchema,
};
