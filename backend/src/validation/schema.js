'use strict';

/**
 * Minimal schema validation helpers to avoid one-off parsing logic.
 * This intentionally mimics a tiny subset of Joi/Zod behavior:
 * schema.validate(value) -> { value: sanitized, error?: { message, details? } }
 */

function makeError(message, details) {
  return {
    message,
    details,
  };
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function string({ min, max, optional = false, allowEmpty = false } = {}) {
  return {
    validate(value) {
      if (value === undefined || value === null) {
        if (optional) return { value: undefined };
        return { value, error: makeError('Value is required') };
      }
      if (typeof value !== 'string') {
        return { value, error: makeError('Expected string') };
      }
      const trimmed = value;
      if (!allowEmpty && trimmed.length === 0) {
        return { value, error: makeError('String cannot be empty') };
      }
      if (typeof min === 'number' && trimmed.length < min) {
        return { value, error: makeError(`String must be at least ${min} characters`) };
      }
      if (typeof max === 'number' && trimmed.length > max) {
        return { value, error: makeError(`String must be at most ${max} characters`) };
      }
      return { value: trimmed };
    },
  };
}

function number({ min, max, integer = false, optional = false } = {}) {
  return {
    validate(value) {
      if (value === undefined || value === null || value === '') {
        if (optional) return { value: undefined };
        return { value, error: makeError('Value is required') };
      }
      const n = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(n)) {
        return { value, error: makeError('Expected number') };
      }
      if (integer && !Number.isInteger(n)) {
        return { value, error: makeError('Expected integer') };
      }
      if (typeof min === 'number' && n < min) {
        return { value, error: makeError(`Number must be >= ${min}`) };
      }
      if (typeof max === 'number' && n > max) {
        return { value, error: makeError(`Number must be <= ${max}`) };
      }
      return { value: n };
    },
  };
}

function boolean({ optional = false } = {}) {
  return {
    validate(value) {
      if (value === undefined || value === null || value === '') {
        if (optional) return { value: undefined };
        return { value, error: makeError('Value is required') };
      }
      if (typeof value === 'boolean') return { value };
      if (value === 'true') return { value: true };
      if (value === 'false') return { value: false };
      return { value, error: makeError('Expected boolean') };
    },
  };
}

function object(shape, { allowUnknown = false } = {}) {
  return {
    validate(value) {
      if (!isPlainObject(value)) {
        return { value, error: makeError('Expected object') };
      }
      const out = {};
      const details = [];

      for (const [key, schema] of Object.entries(shape)) {
        const { value: v, error } = schema.validate(value[key]);
        if (error) {
          details.push({ message: error.message, path: [key] });
        } else if (v !== undefined) {
          out[key] = v;
        }
      }

      if (!allowUnknown) {
        for (const key of Object.keys(value)) {
          if (!(key in shape)) {
            details.push({ message: 'Unknown field', path: [key] });
          }
        }
      }

      if (details.length > 0) {
        return { value, error: makeError('Validation error', details) };
      }
      return { value: out };
    },
  };
}

module.exports = {
  string,
  number,
  boolean,
  object,
};
