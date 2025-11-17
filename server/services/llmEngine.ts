// Unified LLM Engine for The I AM Network
// Supports: OpenAI, OpenRouter, Gemini
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

export type LLMProvider = 'openai' | 'openrouter' | 'gemini';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  temperature: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const MAX_RETRIES = 3;
const TIMEOUT_MS = 60000; // 60 seconds

// Initialize clients
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: TIMEOUT_MS,
});

const openrouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  timeout: TIMEOUT_MS,
});

const geminiClient = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || '',
});

/**
 * Run an LLM request with automatic retries and error handling
 */
export async function runLLM(
  config: LLMConfig,
  messages: LLMMessage[]
): Promise<string> {
  const startTime = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[LLM] ${config.provider}/${config.model} - Attempt ${attempt}/${MAX_RETRIES}`);

      const response = await executeProviderRequest(config, messages);
      const duration = Date.now() - startTime;

      console.log(`[LLM] Success in ${duration}ms - ${config.provider}/${config.model}`);
      return response;

    } catch (error: any) {
      lastError = error;
      const duration = Date.now() - startTime;

      console.error(`[LLM] Attempt ${attempt} failed after ${duration}ms:`, {
        provider: config.provider,
        model: config.model,
        error: error.message,
        status: error.status,
      });

      // Don't retry on certain errors
      if (error.status === 401 || error.status === 403) {
        throw new Error(`Authentication failed for ${config.provider}: ${error.message}`);
      }

      if (error.status === 404) {
        throw new Error(`Model not found: ${config.provider}/${config.model}`);
      }

      // Wait before retry (exponential backoff)
      if (attempt < MAX_RETRIES) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[LLM] Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // All retries failed
  throw new Error(
    `LLM request failed after ${MAX_RETRIES} attempts (${config.provider}/${config.model}): ${lastError?.message}`
  );
}

/**
 * Execute the actual provider-specific request
 */
async function executeProviderRequest(
  config: LLMConfig,
  messages: LLMMessage[]
): Promise<string> {
  switch (config.provider) {
    case 'openai':
      return await runOpenAI(config, messages);

    case 'openrouter':
      return await runOpenRouter(config, messages);

    case 'gemini':
      return await runGemini(config, messages);

    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}

/**
 * OpenAI provider
 */
async function runOpenAI(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
  const response = await openaiClient.chat.completions.create({
    model: config.model,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    temperature: config.temperature,
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty response');
  }

  return content;
}

/**
 * OpenRouter provider
 */
async function runOpenRouter(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
  const response = await openrouterClient.chat.completions.create({
    model: config.model,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    temperature: config.temperature,
    max_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter returned empty response');
  }

  return content;
}

/**
 * Google Gemini provider
 */
async function runGemini(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system') // Gemini handles system in config
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Get system message if present
  const systemMessage = messages.find(m => m.role === 'system');

  const response = await geminiClient.models.generateContent({
    model: config.model,
    contents,
    config: {
      temperature: config.temperature,
      maxOutputTokens: 8192,
      systemInstruction: systemMessage ? {
        role: 'user',
        parts: [{ text: systemMessage.content }],
      } : undefined,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  return text;
}

/**
 * Test LLM connectivity
 */
export async function testLLMProvider(provider: LLMProvider): Promise<{ ok: boolean; error?: string }> {
  try {
    const testConfig: LLMConfig = {
      provider,
      model: getDefaultModel(provider),
      temperature: 0.7,
    };

    const testMessages: LLMMessage[] = [
      { role: 'user', content: 'Say "OK" if you can read this.' }
    ];

    await runLLM(testConfig, testMessages);
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

/**
 * Get default model for each provider
 */
function getDefaultModel(provider: LLMProvider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4.1';
    case 'openrouter':
      return 'meta-llama/llama-3.3-70b-instruct';
    case 'gemini':
      return 'gemini-2.5-flash';
    default:
      return 'gpt-4.1';
  }
}
