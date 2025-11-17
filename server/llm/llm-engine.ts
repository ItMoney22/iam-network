// Unified LLM engine supporting multiple providers
import { generateGeminiResponse, type GeminiChatMessage } from "./gemini-client";
import { generateOpenAIResponse, type OpenAIChatMessage } from "./openai-client";
import { generateOpenRouterResponse, type OpenRouterChatMessage } from "./openrouter-client";
import type { Character } from "@shared/schema";

export interface ConversationMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequest {
  character: Character;
  messages: ConversationMessage[];
  context?: string; // Additional context from knowledge base
}

export async function generateLLMResponse(request: LLMRequest): Promise<string> {
  const { character, messages, context } = request;
  
  // Build system prompt with character personality
  const systemPrompt = buildSystemPrompt(character, context);
  
  // Prepend system message
  const fullMessages: ConversationMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const temperature = parseFloat(character.temperature);

  // Route to appropriate provider
  switch (character.llmProvider) {
    case "gemini": {
      const geminiMessages: GeminiChatMessage[] = fullMessages.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        content: msg.content,
      }));
      return await generateGeminiResponse(geminiMessages, character.llmModel, temperature);
    }

    case "openai": {
      const openaiMessages: OpenAIChatMessage[] = fullMessages as OpenAIChatMessage[];
      return await generateOpenAIResponse(openaiMessages, character.llmModel, temperature);
    }

    case "openrouter": {
      const openrouterMessages: OpenRouterChatMessage[] = fullMessages as OpenRouterChatMessage[];
      return await generateOpenRouterResponse(openrouterMessages, character.llmModel, temperature);
    }

    default:
      throw new Error(`Unsupported LLM provider: ${character.llmProvider}`);
  }
}

function buildSystemPrompt(character: Character, context?: string): string {
  let prompt = `You are ${character.name}, ${character.description}.

Your role: ${character.role}

Personality and tone: ${character.accentTone || "Stay true to your character"}

CORE PHILOSOPHY & RULES:
- You have deep knowledge of David Trinidad's book "I Am GOD – In the Beginning" and the Bible/teachings of Jesus
- You DO NOT treat any source as unquestionable - everything can be examined
- You are allowed and encouraged to question, debate, and compare viewpoints
- Ask the hard questions people are scared to ask
- You can challenge David directly (respectfully but honestly)
- Always circle back to: Love, Unity, Responsibility, and "We are I AM" awareness
- No dogma, no "obey this" - it's about thinking and awakening, not preaching

HIERARCHY:
- David is always the Host and has ultimate authority
- Zero is the Director/Router who controls conversation flow
- You are a guest in this dialogue

Remember: This isn't preaching. This is awakening through honest inquiry.`;

  if (context) {
    prompt += `\n\nRELEVANT CONTEXT FROM KNOWLEDGE BASE:\n${context}`;
  }

  return prompt;
}
