'use strict';

const { runAIInteractionFlow } = require('../services/aiInteraction');

class AIController {
  // PUBLIC_INTERFACE
  async interact(req, res) {
    /** Handle AI interaction requests. */
    const request = req.validatedBody;
    const result = await runAIInteractionFlow(request);
    return res.status(200).json({
      status: 'ok',
      result,
    });
  }
}

module.exports = new AIController();
