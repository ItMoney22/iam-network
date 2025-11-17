// OpenRouter LLM client using OpenAI-compatible SDK
import OpenAI from "openai";

// Using direct OpenRouter API
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY
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
