// OpenAI LLM client using blueprint:javascript_openai_ai_integrations
import OpenAI from "openai";

// This is using Replit's AI Integrations service
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface OpenAIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function generateOpenAIResponse(
  messages: OpenAIChatMessage[],
  model: string = "gpt-4.1",
  temperature: number = 0.7
): Promise<string> {
  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model,
    messages,
    max_completion_tokens: 8192,
    temperature,
  });

  return response.choices[0]?.message?.content || "";
}
