/**
 * Zero AI Routes
 * Endpoints for chatting with Zero, voice interaction, and dev mode
 */

import type { Express} from 'express';
import multer from 'multer';
import { zeroService, type ZeroMessage } from '../services/zeroService';
import { zeroKB } from '../services/zeroKnowledgeBase';

// Configure multer for audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for audio
  },
});

export function registerZeroRoutes(app: Express) {
  /**
   * POST /api/zero/chat
   * Standard text chat with Zero
   */
  app.post('/api/zero/chat', async (req, res) => {
    try {
      const { messages, mode, model, temperature, source, additionalContext } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          error: 'Messages array is required',
        });
      }

      const response = await zeroService.chat(messages as ZeroMessage[], {
        mode,
        model,
        temperature,
        source: source || 'web',
        additionalContext,
      });

      res.json(response);
    } catch (error) {
      console.error('Zero chat error:', error);
      res.status(500).json({
        error: 'Failed to chat with Zero',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/zero/voice
   * Voice input → Zero → Voice output
   * Accepts audio file, returns transcription + Zero's response + audio response
   */
  app.post('/api/zero/voice', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Audio file is required',
        });
      }

      const { mode, source } = req.body;

      const result = await zeroService.voiceChat(req.file.buffer, {
        mode: mode || 'conversation',
        source: source || 'web',
      });

      // Send back JSON with base64 audio
      res.json({
        transcription: result.text,
        response: result.response.message,
        actions: result.response.actions,
        audio: result.audio.toString('base64'),
        mode: result.response.mode,
      });
    } catch (error) {
      console.error('Zero voice error:', error);
      res.status(500).json({
        error: 'Failed to process voice request',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/zero/voice/stream
   * Voice streaming endpoint - returns audio stream directly
   */
  app.post('/api/zero/voice/stream', upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Audio file is required',
        });
      }

      const { mode, source } = req.body;

      const result = await zeroService.voiceChat(req.file.buffer, {
        mode: mode || 'conversation',
        source: source || 'web',
      });

      // Set headers for audio stream
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('X-Transcription', encodeURIComponent(result.text));
      res.setHeader('X-Response-Text', encodeURIComponent(result.response.message));

      // Stream the audio
      res.send(result.audio);
    } catch (error) {
      console.error('Zero voice stream error:', error);
      res.status(500).json({
        error: 'Failed to process voice stream',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/zero/generate
   * Quick code generation
   */
  app.post('/api/zero/generate', async (req, res) => {
    try {
      const { prompt, model, temperature } = req.body;

      if (!prompt) {
        return res.status(400).json({
          error: 'Prompt is required',
        });
      }

      const response = await zeroService.generate(prompt, {
        model,
        temperature,
      });

      res.json({ response });
    } catch (error) {
      console.error('Zero generate error:', error);
      res.status(500).json({
        error: 'Failed to generate',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/zero/review
   * Code review endpoint
   */
  app.post('/api/zero/review', async (req, res) => {
    try {
      const { code, language } = req.body;

      if (!code) {
        return res.status(400).json({
          error: 'Code is required',
        });
      }

      const review = await zeroService.reviewCode(code, language);

      res.json({ review });
    } catch (error) {
      console.error('Zero review error:', error);
      res.status(500).json({
        error: 'Failed to review code',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/zero/explain
   * Code explanation endpoint
   */
  app.post('/api/zero/explain', async (req, res) => {
    try {
      const { code, language } = req.body;

      if (!code) {
        return res.status(400).json({
          error: 'Code is required',
        });
      }

      const explanation = await zeroService.explainCode(code, language);

      res.json({ explanation });
    } catch (error) {
      console.error('Zero explain error:', error);
      res.status(500).json({
        error: 'Failed to explain code',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/zero/kb/reload
   * Reload Zero's knowledge base (dev only)
   */
  app.post('/api/zero/kb/reload', async (req, res) => {
    try {
      await zeroKB.reload();
      res.json({ message: 'Zero knowledge base reloaded successfully' });
    } catch (error) {
      console.error('Zero KB reload error:', error);
      res.status(500).json({
        error: 'Failed to reload knowledge base',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/zero/status
   * Check Zero's status and configuration
   */
  app.get('/api/zero/status', async (req, res) => {
    try {
      const knowledge = await zeroKB.getKnowledge();

      res.json({
        status: 'active',
        lastUpdated: knowledge.lastUpdated,
        hasSystemPrompt: !!knowledge.systemPrompt,
        hasDavidProfile: !!knowledge.davidProfile,
        hasBookContent: !!knowledge.bookContent,
        openaiConfigured: !!process.env.OPENAI_API_KEY,
      });
    } catch (error) {
      console.error('Zero status error:', error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
