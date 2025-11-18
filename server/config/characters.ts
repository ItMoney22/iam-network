// Character-specific LLM configurations for The I AM Network
import type { LLMConfig } from "../services/llmEngine";

export const CHARACTER_LLM_CONFIG: Record<string, LLMConfig> = {
  // Marcus Chen = OpenAI main brain (GPT 4.1) - Wise host
  Marcus: {
    provider: 'openai',
    model: 'gpt-4.1',
    temperature: 0.6,
  },

  // Elena Rodriguez = Grok unhinged skeptic
  Elena: {
    provider: 'openrouter',
    model: 'x-ai/grok-2-1212',
    temperature: 0.9,
  },

  // Sophia Williams = Empathic healer (Gemini Flash for consistency)
  Sophia: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
  },

  // James Park = Pattern hunter (Llama for analytical depth)
  James: {
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct',
    temperature: 0.8,
  },

  // Destiny Johnson = Motivational energy (OpenAI GPT-5)
  Destiny: {
    provider: 'openai',
    model: 'gpt-5',
    temperature: 0.85,
  },

  // Nathan Brooks = News oracle (Gemini Pro for current events)
  Nathan: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    temperature: 0.5,
  },

  // Rachel Goldman = Scripture scholar (OpenAI mini for precision)
  Rachel: {
    provider: 'openai',
    model: 'gpt-4.1-mini',
    temperature: 0.4,
  },

  // Victor Okafor = Wealth architect (Claude Sonnet for strategic thinking)
  Victor: {
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    temperature: 0.7,
  },

  // Maya Patel = Style icon (OpenAI GPT-5 mini for creativity)
  Maya: {
    provider: 'openai',
    model: 'gpt-5-mini',
    temperature: 0.9,
  },

  // Isaac Morrison = Future prophet (Gemini Pro for vision)
  Isaac: {
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
