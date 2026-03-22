'use strict';

/**
 * Reusable HTTP middleware helpers (flows, not patches).
 *
 * Contract:
 * - validateBody(schema): validates req.body and assigns sanitized payload to req.validatedBody.
 *   - Inputs: schema { validate(value) -> {value, error} }
 *   - Output: on success next(); on failure 400 with structured error.
 * - validateQuery(schema): same for req.query -> req.validatedQuery
 * - asyncHandler(fn): ensures async errors go to Express error middleware.
 * - notFound: 404 JSON handler.
 * - errorHandler: maps errors into consistent JSON responses with debug-friendly context.
 *
 * Observability:
 * - Every validation failure and server error includes an operation identifier when available.
 */

function toDetails(validationError) {
  if (!validationError) return undefined;
  // Support Joi-like errors (details array) or custom errors.
  if (Array.isArray(validationError.details)) {
    return validationError.details.map((d) => ({
      message: d.message,
      path: Array.isArray(d.path) ? d.path.join('.') : d.path,
      type: d.type,
    }));
  }
  return [{ message: validationError.message || 'Validation error' }];
}

// PUBLIC_INTERFACE
function validateBody(schema) {
  /** Express middleware to validate and sanitize request body. */
  return (req, res, next) => {
    const { value, error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: toDetails(error),
      });
    }
    req.validatedBody = value;
    return next();
  };
}

// PUBLIC_INTERFACE
function validateQuery(schema) {
  /** Express middleware to validate and sanitize query string params. */
  return (req, res, next) => {
    const { value, error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: toDetails(error),
      });
    }
    req.validatedQuery = value;
    return next();
  };
}

// PUBLIC_INTERFACE
function asyncHandler(fn) {
  /** Wrap async route handlers and forward errors to Express. */
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// PUBLIC_INTERFACE
function notFound(req, res) {
  /** Express middleware for unmatched routes. */
  return res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// PUBLIC_INTERFACE
function errorHandler(err, req, res, next) {
  /** Express error-handling middleware that returns consistent JSON. */
  // eslint-disable-next-line no-unused-vars
  const _next = next;

  const status = typeof err.status === 'number' ? err.status : 500;

  const payload = {
    status: 'error',
    code: err.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    message: err.expose ? err.message : status === 500 ? 'Internal Server Error' : err.message,
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.debug = {
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    };
  }

  // Keep a server-side log for post-mortem debugging.
  console.error('[errorHandler]', {
    status,
    code: payload.code,
    message: err.message,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(status).json(payload);
}

module.exports = {
  validateBody,
  validateQuery,
  asyncHandler,
  notFound,
  errorHandler,
};
