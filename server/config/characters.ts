// Character-specific LLM configurations for The I AM Network
import type { LLMConfig } from "../services/llmEngine";

export const CHARACTER_LLM_CONFIG: Record<string, LLMConfig> = {
  // Zero = OpenAI main brain (GPT 5.1)
  Zero: {
    provider: 'openai',
    model: 'gpt-5.1',
    temperature: 0.4,
  },

  // M7 = Grok unhinged skeptic
  M7: {
    provider: 'openrouter',
    model: 'x-ai/grok-2-1212',
    temperature: 0.9,
  },

  // Synq = Empathic healer (OpenAI mini for consistency)
  Synq: {
    provider: 'openrouter',
    model: 'openai/gpt-4.1-mini',
    temperature: 0.5,
  },

  // Flux = Pattern hunter (Llama for analytical depth)
  Flux: {
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct',
    temperature: 0.8,
  },

  // Vibe = Motivational energy (OpenAI GPT-5)
  Vibe: {
    provider: 'openai',
    model: 'gpt-5',
    temperature: 0.85,
  },

  // EchoPulse = News oracle (Gemini Pro for current events)
  EchoPulse: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    temperature: 0.5,
  },

  // Link = Scripture monk (OpenAI mini for precision)
  Link: {
    provider: 'openai',
    model: 'gpt-4.1-mini',
    temperature: 0.4,
  },

  // Ledge = Wealth architect (Claude Sonnet for strategic thinking)
  Ledge: {
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    temperature: 0.7,
  },

  // Drip = Style icon (OpenAI GPT-5 mini for creativity)
  Drip: {
    provider: 'openai',
    model: 'gpt-5-mini',
    temperature: 0.9,
  },

  // Horizon = Future prophet (Gemini Pro for vision)
  Horizon: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    temperature: 0.75,
  },
};

/**
 * Get LLM config for a character by name or ID
 */
export function getCharacterLLMConfig(characterIdOrName: string): LLMConfig {
  const config = CHARACTER_LLM_CONFIG[characterIdOrName];

  if (!config) {
    console.warn(`No LLM config found for character: ${characterIdOrName}, using default`);
    return {
      provider: 'openai',
      model: 'gpt-4.1',
      temperature: 0.7,
    };
  }

  return config;
}
