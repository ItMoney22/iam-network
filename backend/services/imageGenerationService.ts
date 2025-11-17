/**
 * Image Generation Service
 * Uses Replicate API to generate avatars, logos, icons, and site graphics
 */

import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

export interface ImageGenerationOptions {
  prompt: string;
  model?: 'flux-1.1-pro' | 'flux-schnell' | 'sdxl';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  width?: number;
  height?: number;
  numOutputs?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  seed?: number;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  model: string;
  width: number;
  height: number;
  seed?: number;
}

class ImageGenerationService {
  /**
   * Generate an image using Replicate's FLUX 1.1 Pro (best quality, slower)
   */
  async generateWithFluxPro(options: ImageGenerationOptions): Promise<GeneratedImage> {
    const {
      prompt,
      aspectRatio = '1:1',
      width = 1024,
      height = 1024,
      numInferenceSteps = 50,
      guidanceScale = 7.5,
      seed,
    } = options;

    try {
      const output = await replicate.run(
        "black-forest-labs/flux-1.1-pro",
        {
          input: {
            prompt,
            aspect_ratio: aspectRatio,
            output_format: "png",
            output_quality: 100,
            safety_tolerance: 2,
          }
        }
      );

      const imageUrl = Array.isArray(output) ? output[0] : output as string;

      return {
        url: imageUrl,
        prompt,
        model: 'flux-1.1-pro',
        width,
        height,
        seed,
      };
    } catch (error) {
      console.error('FLUX Pro generation error:', error);
      throw new Error(`Failed to generate image with FLUX Pro: ${error}`);
    }
  }

  /**
   * Generate an image using Replicate's FLUX Schnell (fast, good quality)
   */
  async generateWithFluxSchnell(options: ImageGenerationOptions): Promise<GeneratedImage> {
    const {
      prompt,
      width = 1024,
      height = 1024,
      numOutputs = 1,
      numInferenceSteps = 4,
      seed,
    } = options;

    try {
      const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        {
          input: {
            prompt,
            width,
            height,
            num_outputs: numOutputs,
            num_inference_steps: numInferenceSteps,
            output_format: "png",
            output_quality: 100,
          }
        }
      );

      const imageUrl = Array.isArray(output) ? output[0] : output as string;

      return {
        url: imageUrl,
        prompt,
        model: 'flux-schnell',
        width,
        height,
        seed,
      };
    } catch (error) {
      console.error('FLUX Schnell generation error:', error);
      throw new Error(`Failed to generate image with FLUX Schnell: ${error}`);
    }
  }

  /**
   * Generate an image using Stable Diffusion XL (fallback option)
   */
  async generateWithSDXL(options: ImageGenerationOptions): Promise<GeneratedImage> {
    const {
      prompt,
      width = 1024,
      height = 1024,
      numInferenceSteps = 50,
      guidanceScale = 7.5,
      numOutputs = 1,
      seed,
    } = options;

    try {
      const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt,
            width,
            height,
            num_inference_steps: numInferenceSteps,
            guidance_scale: guidanceScale,
            num_outputs: numOutputs,
            seed,
          }
        }
      );

      const imageUrl = Array.isArray(output) ? output[0] : output as string;

      return {
        url: imageUrl,
        prompt,
        model: 'sdxl',
        width,
        height,
        seed,
      };
    } catch (error) {
      console.error('SDXL generation error:', error);
      throw new Error(`Failed to generate image with SDXL: ${error}`);
    }
  }

  /**
   * Smart generate - automatically selects best model based on use case
   */
  async generate(options: ImageGenerationOptions): Promise<GeneratedImage> {
    const model = options.model || 'flux-schnell'; // Default to fast model

    switch (model) {
      case 'flux-1.1-pro':
        return this.generateWithFluxPro(options);
      case 'flux-schnell':
        return this.generateWithFluxSchnell(options);
      case 'sdxl':
        return this.generateWithSDXL(options);
      default:
        return this.generateWithFluxSchnell(options);
    }
  }

  /**
   * Generate character avatar
   */
  async generateCharacterAvatar(characterName: string, description: string): Promise<GeneratedImage> {
    const prompt = `Portrait of ${characterName}, ${description}, professional headshot, centered composition, cosmic spiritual aesthetic, highly detailed, digital art, dramatic lighting, vibrant colors, 8k quality`;

    return this.generate({
      prompt,
      model: 'flux-1.1-pro',
      aspectRatio: '1:1',
      width: 1024,
      height: 1024,
    });
  }

  /**
   * Generate logo
   */
  async generateLogo(conceptDescription: string): Promise<GeneratedImage> {
    const prompt = `Logo design for "${conceptDescription}", clean, professional, modern, vector style, transparent background, bold colors, memorable, iconic`;

    return this.generate({
      prompt,
      model: 'flux-1.1-pro',
      aspectRatio: '1:1',
      width: 1024,
      height: 1024,
    });
  }

  /**
   * Generate icon
   */
  async generateIcon(iconDescription: string): Promise<GeneratedImage> {
    const prompt = `Icon for ${iconDescription}, simple, clean, minimalist, vector style, bold lines, single concept, professional, modern UI design`;

    return this.generate({
      prompt,
      model: 'flux-schnell', // Icons can use faster model
      width: 512,
      height: 512,
    });
  }

  /**
   * Generate hero/background image
   */
  async generateHeroImage(theme: string): Promise<GeneratedImage> {
    const prompt = `${theme}, cosmic spiritual aesthetic, ethereal, mystical, consciousness, divine light, sacred geometry, ultra detailed, cinematic, 8k wallpaper`;

    return this.generate({
      prompt,
      model: 'flux-1.1-pro',
      aspectRatio: '16:9',
      width: 1920,
      height: 1080,
    });
  }

  /**
   * Generate thumbnail for episode
   */
  async generateEpisodeThumbnail(episodeTheme: string, participants: string[]): Promise<GeneratedImage> {
    const participantList = participants.slice(0, 3).join(', ');
    const prompt = `YouTube thumbnail for episode about "${episodeTheme}" featuring ${participantList}, vibrant, eye-catching, bold text, professional broadcast design, The I AM Network branding`;

    return this.generate({
      prompt,
      model: 'flux-1.1-pro',
      aspectRatio: '16:9',
      width: 1280,
      height: 720,
    });
  }
}

export const imageGenerationService = new ImageGenerationService();
