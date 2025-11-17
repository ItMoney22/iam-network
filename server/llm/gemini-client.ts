// Gemini LLM client using Google Generative AI SDK
import { GoogleGenAI } from "@google/genai";

// Using direct Google Generative AI API
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!,
});

export interface GeminiChatMessage {
  role: "user" | "model";
  content: string;
}

export async function generateGeminiResponse(
  messages: GeminiChatMessage[],
  model: string = "gemini-2.5-flash",
  temperature: number = 0.7
): Promise<string> {
  const contents = messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      temperature,
      maxOutputTokens: 8192,
    },
  });

  return response.text || "";
}
