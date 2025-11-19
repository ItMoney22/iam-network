/**
 * Zero AI Routes
 * Endpoints for chatting with Zero, voice interaction, and dev mode
 */

import type { Express} from 'express';
import multer from 'multer';
import { zeroService, type ZeroMessage } from '../services/zeroService';
import { zeroKB } from '../services/zeroKnowledgeBase';
import { zeroChatMonitor } from '../../server/services/zeroChatMonitor';

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

      // Send back JSON with base64 audio (optional)
      res.json({
        transcription: result.text,
        response: result.response.message,
        actions: result.response.actions,
        audio: result.audio ? result.audio.toString('base64') : null,
        audioError: result.audioError,
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

      if (!result.audio) {
        return res.status(503).json({
          error: 'Audio generation unavailable',
          details: result.audioError || 'Text-to-speech failed',
        });
      }

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

  /**
   * POST /api/zero/monitor/start
   * Start Zero's chat monitoring
   */
  app.post('/api/zero/monitor/start', async (req, res) => {
    try {
      const { analysisInterval, batchSize, alertThreshold } = req.body;

      await zeroChatMonitor.startMonitoring({
        analysisInterval,
        batchSize,
        alertThreshold,
      });

      res.json({
        message: 'Chat monitoring started',
        status: zeroChatMonitor.getStatus(),
      });
    } catch (error) {
      console.error('Zero monitor start error:', error);
      res.status(500).json({
        error: 'Failed to start monitoring',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/zero/monitor/stop
   * Stop Zero's chat monitoring
   */
  app.post('/api/zero/monitor/stop', async (req, res) => {
    try {
      zeroChatMonitor.stopMonitoring();

      res.json({
        message: 'Chat monitoring stopped',
        status: zeroChatMonitor.getStatus(),
      });
    } catch (error) {
      console.error('Zero monitor stop error:', error);
      res.status(500).json({
        error: 'Failed to stop monitoring',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/zero/monitor/status
   * Get monitoring status
   */
  app.get('/api/zero/monitor/status', async (req, res) => {
    try {
      res.json(zeroChatMonitor.getStatus());
    } catch (error) {
      console.error('Zero monitor status error:', error);
      res.status(500).json({
        error: 'Failed to get monitoring status',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/zero/monitor/alerts
   * Get all alerts
   */
  app.get('/api/zero/monitor/alerts', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const priority = req.query.priority as string | undefined;

      const alerts = priority
        ? zeroChatMonitor.getAlertsByPriority(priority as any)
        : zeroChatMonitor.getAlerts(limit);

      res.json({ alerts });
    } catch (error) {
      console.error('Zero monitor alerts error:', error);
      res.status(500).json({
        error: 'Failed to get alerts',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * DELETE /api/zero/monitor/alerts/:alertId
   * Clear a specific alert
   */
  app.delete('/api/zero/monitor/alerts/:alertId', async (req, res) => {
    try {
      const { alertId } = req.params;
      zeroChatMonitor.clearAlert(alertId);

      res.json({ message: 'Alert cleared', alertId });
    } catch (error) {
      console.error('Zero monitor clear alert error:', error);
      res.status(500).json({
        error: 'Failed to clear alert',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * DELETE /api/zero/monitor/alerts
   * Clear all alerts
   */
  app.delete('/api/zero/monitor/alerts', async (req, res) => {
    try {
      zeroChatMonitor.clearAllAlerts();

      res.json({ message: 'All alerts cleared' });
    } catch (error) {
      console.error('Zero monitor clear all alerts error:', error);
      res.status(500).json({
        error: 'Failed to clear all alerts',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * PUT /api/zero/monitor/config
   * Update monitoring configuration
   */
  app.put('/api/zero/monitor/config', async (req, res) => {
    try {
      zeroChatMonitor.updateConfig(req.body);

      res.json({
        message: 'Configuration updated',
        config: zeroChatMonitor.getConfig(),
      });
    } catch (error) {
      console.error('Zero monitor config error:', error);
      res.status(500).json({
        error: 'Failed to update configuration',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
