import express from 'express';
import { askAI } from '../services/aiService.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const rawMessage = req.body.message || (Array.isArray(req.body.messages) ? req.body.messages[req.body.messages.length - 1]?.content : '');
    const history = req.body.history || (Array.isArray(req.body.messages) ? req.body.messages.slice(0, -1) : []);
    const context = req.body.context || {};

    if (!rawMessage || !rawMessage.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required.'
      });
    }

    const message = rawMessage.trim();

    const aiResult = await askAI(message.trim(), history, context);

    if (!aiResult.success) {
      return res.status(503).json({
        success: false,
        error: aiResult.error || 'AI Assistant is temporarily unavailable. Please check your API configuration.',
        code: aiResult.code || 'AI_UNAVAILABLE'
      });
    }

    return res.json({
      success: true,
      text: aiResult.text,
      reply: aiResult.text,
      message: aiResult.text,
      source: aiResult.source,
      provider: aiResult.provider
    });
  } catch (err) {
    console.error('[AI Chat Route Error]', err);
    return res.status(500).json({
      success: false,
      error: 'AI Assistant is temporarily unavailable. Please check your API configuration.',
      details: err.message
    });
  }
});

export default router;
