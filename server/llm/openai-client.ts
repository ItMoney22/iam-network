// OpenAI LLM client using official OpenAI SDK
import OpenAI from "openai";

// Using direct OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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
