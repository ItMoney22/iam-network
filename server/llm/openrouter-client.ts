// OpenRouter LLM client using blueprint:javascript_openrouter_ai_integrations
import OpenAI from "openai";

// This is using Replit's AI Integrations service for OpenRouter access
const openrouter = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY
});

export interface OpenRouterChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function generateOpenRouterResponse(
  messages: OpenRouterChatMessage[],
  model: string = "meta-llama/llama-3.3-70b-instruct",
  temperature: number = 0.7
): Promise<string> {
  const response = await openrouter.chat.completions.create({
    model,
    messages,
    max_tokens: 8192,
    temperature,
  });

  return response.choices[0]?.message?.content || "";
}
