/**
 * Zero AI Service
 * Handles communication with Zero (OpenAI) including voice, dev mode, and standard chat
 */

import OpenAI, { toFile } from 'openai';
import Replicate from 'replicate';
import { zeroKB } from './zeroKnowledgeBase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

export interface ZeroMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ZeroResponse {
  message: string;
  actions?: ZeroAction[];
  mode: 'conversation' | 'dev' | 'ops' | 'show';
}

export interface ZeroAction {
  action: 'apply_patch' | 'run_command' | 'call_metadev' | 'start_service';
  target: string;
  details: any;
  confirmFirst: boolean;
}

export interface ZeroChatOptions {
  mode?: 'conversation' | 'dev' | 'ops' | 'show' | 'assistant';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  source?: 'web' | 'raspberry_pi' | 'codex' | 'direct';
  additionalContext?: string;
}

class ZeroService {
  /**
   * Main chat interface with Zero
   */
  async chat(
    messages: ZeroMessage[],
    options: ZeroChatOptions = {}
  ): Promise<ZeroResponse> {
    const {
      mode = 'conversation',
      model = 'gpt-4-turbo-preview',
      temperature = 0.7,
      maxTokens = 2000,
      source = 'web',
      additionalContext,
    } = options;

    // Build Zero's system context
    let modeContext = '';
    switch (mode) {
      case 'dev':
        modeContext = '\n\n**Current Mode: DEV MODE**\nYou can output dev actions in JSON format for Codex to execute.';
        break;
      case 'ops':
        modeContext = '\n\n**Current Mode: OPS MODE**\nYou are monitoring systems. Report issues clearly and suggest fixes.';
        break;
      case 'show':
        modeContext = '\n\n**Current Mode: SHOW MODE**\nYou are co-hosting The I AM Network. Be engaging and conversational.';
        break;
      case 'assistant':
        modeContext = '\n\n**Current Mode: ASSISTANT MODE** (Raspberry Pi)\nGive shorter, more directive responses. Can output commands.';
        break;
    }

    const systemContext = await zeroKB.buildContext(
      `${modeContext}\n\nSource: ${source}\n${additionalContext || ''}`
    );

    // Prepare messages for OpenAI
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContext },
      ...messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model,
      messages: openaiMessages,
      temperature,
      max_tokens: maxTokens,
    });

    const responseText = completion.choices[0].message.content || '';

    // Parse for dev actions if in dev mode
    const actions = mode === 'dev' ? this.parseDevActions(responseText) : undefined;

    return {
      message: responseText,
      actions,
      mode,
    };
  }

  /**
   * Voice input → Zero → Voice output
   * Full voice conversation loop
   */
  async voiceChat(audioBuffer: Buffer, options: ZeroChatOptions = {}): Promise<{
    text: string;
    audio: Buffer | null;
    response: ZeroResponse;
    audioError?: string;
  }> {
    // Step 1: Speech-to-Text (Whisper)
    const transcription = await this.speechToText(audioBuffer);

    // Step 2: Chat with Zero
    const response = await this.chat(
      [{ role: 'user', content: transcription }],
      options
    );

    // Step 3: Text-to-Speech (non-blocking)
    let audioResponse: Buffer | null = null;
    let audioError: string | undefined;
    try {
      audioResponse = await this.textToSpeech(response.message);
    } catch (error) {
      console.error('Text-to-speech error (non-fatal):', error);
      audioError = 'Text-to-speech unavailable. Configure REPLICATE_API_KEY to enable voice playback.';
    }

    return {
      text: transcription,
      audio: audioResponse,
      response,
      audioError,
    };
  }

  /**
   * Convert speech to text using OpenAI Whisper
   */
  async speechToText(audioBuffer: Buffer): Promise<string> {
    try {
      // Convert Buffer to File-like object for OpenAI SDK
      const file = await toFile(audioBuffer, 'audio.webm', { type: 'audio/webm' });

      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
      });

      return transcription.text;
    } catch (error) {
      console.error('Speech-to-text error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Convert text to speech using Replicate MiniMax Speech 2.6 Turbo
   * Voice options: male_zh (default), female_zh, male_en, female_en
   */
  async textToSpeech(text: string, voice: 'male_zh' | 'female_zh' | 'male_en' | 'female_en' = 'male_en'): Promise<Buffer> {
    try {
      const output = await replicate.run(
        "minimax/speech-2.6-turbo:c33a8267f6fb8cc3e92b5f33bd8abd5d8cc18b1a8e86c78ad90eeb1ae40ff24f",
        {
          input: {
            text: text,
            voice: voice,
            audio_sample_rate: 32000,
            bitrate: 128000,
          }
        }
      );

      // The output is a URL to the audio file
      const audioUrl = output as string;

      // Fetch the audio file
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw new Error('Failed to generate speech');
    }
  }

  /**
   * Parse dev actions from Zero's response
   * Looks for JSON blocks with action commands
   */
  private parseDevActions(text: string): ZeroAction[] | undefined {
    const actions: ZeroAction[] = [];

    // Look for JSON code blocks
    const jsonBlockRegex = /```json\n([\s\S]*?)\n```/g;
    let match;

    while ((match = jsonBlockRegex.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.action) {
          actions.push(parsed as ZeroAction);
        }
      } catch (error) {
        // Not valid JSON or not an action, skip
      }
    }

    return actions.length > 0 ? actions : undefined;
  }

  /**
   * Quick generate - for simple code generation tasks
   */
  async generate(prompt: string, options: {
    model?: string;
    temperature?: number;
  } = {}): Promise<string> {
    const response = await this.chat(
      [{ role: 'user', content: prompt }],
      {
        mode: 'dev',
        model: options.model || 'gpt-4-turbo-preview',
        temperature: options.temperature || 0.4,
      }
    );

    return response.message;
  }

  /**
   * Code review
   */
  async reviewCode(code: string, language?: string): Promise<string> {
    const prompt = `Please review this ${language || ''} code:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``;

    const response = await this.chat(
      [{ role: 'user', content: prompt }],
      {
        mode: 'dev',
        temperature: 0.3,
      }
    );

    return response.message;
  }

  /**
   * Explain code
   */
  async explainCode(code: string, language?: string): Promise<string> {
    const prompt = `Explain this ${language || ''} code:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``;

    const response = await this.chat(
      [{ role: 'user', content: prompt }],
      {
        mode: 'conversation',
        temperature: 0.5,
      }
    );

    return response.message;
  }
}

export const zeroService = new ZeroService();
