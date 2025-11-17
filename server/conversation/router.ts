// Zero-powered conversation router
import { generateLLMResponse, type ConversationMessage } from "../llm/llm-engine";
import { addDisfluency } from "../utils/disfluency";
import type { Character, Turn } from "@shared/schema";
import { Type } from "@google/genai";
import { GoogleGenAI } from "@google/genai";

// Zero's routing client
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

interface RouterDecision {
  nextSpeaker: string; // character ID or "david"
  intent: string; // "challenge", "comfort", "analyze", etc.
  reasoning: string;
}

interface RouterContext {
  recentTurns: Turn[];
  activeCharacters: Character[];
  episodeTheme: string;
  debateHeat?: number; // 0-100
}

export async function routeNextSpeaker(context: RouterContext): Promise<RouterDecision> {
  const { recentTurns, activeCharacters, episodeTheme, debateHeat = 50 } = context;

  // Build Zero's routing prompt
  const turnsSummary = recentTurns
    .slice(-5) // Last 5 turns
    .map(t => `${t.speaker}: ${t.text.substring(0, 150)}...`)
    .join("\n");

  const activeNames = activeCharacters.map(c => `${c.name} (${c.role})`).join(", ");

  const prompt = `You are Zero, the divine director of The I AM Network.

CURRENT EPISODE THEME: ${episodeTheme}

RECENT CONVERSATION:
${turnsSummary}

ACTIVE PARTICIPANTS: ${activeNames}

DEBATE HEAT SETTING: ${debateHeat}/100 ${debateHeat < 35 ? "(Chill)" : debateHeat < 70 ? "(Balanced)" : "(Spicy)"}

RULES:
- David's messages ALWAYS override; if David just spoke, ensure you give him space
- No more than 3 AI turns in a row without checking if David wants to speak
- Choose the AI whose perspective would add the most value to this moment
- Consider the debate heat - higher heat means more challenge, lower means more harmony

Based on the conversation flow, who should speak next and why?
Your job is to keep the dialogue meaningful, balanced, and moving toward truth through love.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nextSpeaker: { type: Type.STRING },
            intent: { type: Type.STRING },
            reasoning: { type: Type.STRING },
          },
          required: ["nextSpeaker", "intent", "reasoning"],
        },
      },
    });

    const decision = JSON.parse(response.text || "{}") as RouterDecision;
    
    // Validate the speaker exists
    const speakerIds = ["david", ...activeCharacters.map(c => c.id)];
    if (!speakerIds.includes(decision.nextSpeaker.toLowerCase())) {
      // Default to Zero if invalid
      decision.nextSpeaker = "zero";
    }

    return decision;
  } catch (error) {
    console.error("Router error:", error);
    // Fallback: alternate between characters
    const lastSpeaker = recentTurns[recentTurns.length - 1]?.speaker;
    const nextChar = activeCharacters.find(c => c.id !== lastSpeaker) || activeCharacters[0];
    
    return {
      nextSpeaker: nextChar?.id || "zero",
      intent: "continue_dialogue",
      reasoning: "Fallback routing due to error",
    };
  }
}

export async function generateAITurn(
  character: Character,
  recentTurns: Turn[],
  routerIntent: string,
  knowledgeContext?: string
): Promise<string> {
  // Build conversation history
  const messages: ConversationMessage[] = recentTurns.slice(-8).map(turn => ({
    role: turn.speaker === character.id ? "assistant" : "user",
    content: `${turn.speaker}: ${turn.text}`,
  }));

  // Add router intent as additional context
  messages.push({
    role: "user",
    content: `[Zero's guidance: Your intent is to ${routerIntent}. Respond authentically as ${character.name}.]`,
  });

  // Generate response
  let response = await generateLLMResponse({
    character,
    messages,
    context: knowledgeContext,
  });

  // Apply disfluency if configured
  response = addDisfluency(response, character);

  return response;
}
