/**
 * Image Generation Routes
 * API endpoints for generating images via Replicate
 */

import type { Express } from 'express';
import { imageGenerationService } from '../services/imageGenerationService';

export function registerImageRoutes(app: Express) {
  /**
   * POST /api/images/generate
   * General purpose image generation
   */
  app.post('/api/images/generate', async (req, res) => {
    try {
      const { prompt, model, aspectRatio, width, height } = req.body;

      if (!prompt) {
        return res.status(400).json({
          error: 'Prompt is required',
        });
      }

      const result = await imageGenerationService.generate({
        prompt,
        model,
        aspectRatio,
        width,
        height,
      });

      res.json(result);
    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/images/avatar
   * Generate character avatar
   */
  app.post('/api/images/avatar', async (req, res) => {
    try {
      const { characterName, description } = req.body;

      if (!characterName || !description) {
        return res.status(400).json({
          error: 'Character name and description are required',
        });
      }

      const result = await imageGenerationService.generateCharacterAvatar(
        characterName,
        description
      );

      res.json(result);
    } catch (error) {
      console.error('Avatar generation error:', error);
      res.status(500).json({
        error: 'Failed to generate avatar',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/images/logo
   * Generate logo
   */
  app.post('/api/images/logo', async (req, res) => {
    try {
      const { concept } = req.body;

      if (!concept) {
        return res.status(400).json({
          error: 'Logo concept description is required',
        });
      }

      const result = await imageGenerationService.generateLogo(concept);

      res.json(result);
    } catch (error) {
      console.error('Logo generation error:', error);
      res.status(500).json({
        error: 'Failed to generate logo',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/images/icon
   * Generate icon
   */
  app.post('/api/images/icon', async (req, res) => {
    try {
      const { description } = req.body;

      if (!description) {
        return res.status(400).json({
          error: 'Icon description is required',
        });
      }

      const result = await imageGenerationService.generateIcon(description);

      res.json(result);
    } catch (error) {
      console.error('Icon generation error:', error);
      res.status(500).json({
        error: 'Failed to generate icon',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/images/hero
   * Generate hero/background image
   */
  app.post('/api/images/hero', async (req, res) => {
    try {
      const { theme } = req.body;

      if (!theme) {
        return res.status(400).json({
          error: 'Theme is required',
        });
      }

      const result = await imageGenerationService.generateHeroImage(theme);

      res.json(result);
    } catch (error) {
      console.error('Hero image generation error:', error);
      res.status(500).json({
        error: 'Failed to generate hero image',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/images/thumbnail
   * Generate episode thumbnail
   */
  app.post('/api/images/thumbnail', async (req, res) => {
    try {
      const { episodeTheme, participants } = req.body;

      if (!episodeTheme) {
        return res.status(400).json({
          error: 'Episode theme is required',
        });
      }

      const result = await imageGenerationService.generateEpisodeThumbnail(
        episodeTheme,
        participants || []
      );

      res.json(result);
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      res.status(500).json({
        error: 'Failed to generate thumbnail',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/images/status
   * Check if image generation service is configured
   */
  app.get('/api/images/status', async (req, res) => {
    try {
      const configured = !!process.env.REPLICATE_API_KEY;

      res.json({
        status: configured ? 'ready' : 'not_configured',
        message: configured
          ? 'Image generation service is ready'
          : 'REPLICATE_API_KEY not configured',
      });
    } catch (error) {
      console.error('Image service status error:', error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
