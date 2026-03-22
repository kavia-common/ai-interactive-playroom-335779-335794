const cors = require('cors');
const express = require('express');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');
const { notFound, errorHandler } = require('./middleware/http');

// Initialize express app
const app = express();

/**
 * CORS
 * - Use FRONTEND_ORIGIN when provided (recommended for browser clients).
 * - Fallback to '*' for local/dev tooling and non-browser clients.
 *
 * Note: The frontend uses Vite env vars (VITE_*). Those are not automatically
 * available to the backend, so we use a backend-side env var here.
 *
 * Required env (recommended):
 * - FRONTEND_ORIGIN="http://localhost:5173" (or your deployed frontend origin)
 */
const frontendOrigin = process.env.FRONTEND_ORIGIN;

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no Origin header (curl, server-to-server, etc.)
      if (!origin) return cb(null, true);

      // If not configured, stay permissive for minimal integration.
      if (!frontendOrigin) return cb(null, true);

      // Allow exact match origin (no wildcard parsing).
      if (origin === frontendOrigin) return cb(null, true);

      return cb(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);
app.set('trust proxy', true);

app.use('/docs', swaggerUi.serve, (req, res, next) => {
  const host = req.get('host'); // may or may not include port
  let protocol = req.protocol; // http or https

  const actualPort = req.socket.localPort;
  const hasPort = host.includes(':');

  const needsPort =
    !hasPort &&
    ((protocol === 'http' && actualPort !== 80) ||
      (protocol === 'https' && actualPort !== 443));
  const fullHost = needsPort ? `${host}:${actualPort}` : host;
  protocol = req.secure ? 'https' : protocol;

  const dynamicSpec = {
    ...swaggerSpec,
    servers: [
      {
        url: `${protocol}://${fullHost}`,
      },
    ],
  };
  swaggerUi.setup(dynamicSpec)(req, res, next);
});

// Parse JSON request body
app.use(express.json());

// Mount routes
app.use('/', routes);

// Consistent 404 + error boundary
app.use(notFound);
app.use(errorHandler);

module.exports = app;
