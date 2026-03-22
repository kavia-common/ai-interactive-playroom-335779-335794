const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Interactive Playroom - Game Support API',
      version: '1.0.0',
      description:
        'Backend support API for the interactive game frontend: health checks, AI-style interaction responses, and game event streaming.',
    },
  },
  apis: ['./src/routes/*.js'], // Includes index.js and api.js
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
