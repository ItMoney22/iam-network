// Gemini LLM client using blueprint:javascript_gemini_ai_integrations
import { GoogleGenAI } from "@google/genai";

// This is using Replit's AI Integrations service
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
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
