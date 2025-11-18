// Marcus-powered conversation router
import { generateLLMResponse, type ConversationMessage } from "../llm/llm-engine";
import { addDisfluency } from "../utils/disfluency";
import type { Character, Turn } from "@shared/schema";
import OpenAI from "openai";

// Marcus's routing client using GPT 4.1
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
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

  const prompt = `You are Marcus Chen, the seasoned host and moderator of The I AM Network.

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
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        {
          role: "system",
          content: "You are Marcus Chen, the experienced host and moderator of The I AM Network. You always respond with valid JSON in the format: {\"nextSpeaker\": \"speaker_id\", \"intent\": \"intent_description\", \"reasoning\": \"explanation\"}",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    });

    const generatedText = response.choices[0]?.message?.content || "{}";
    const decision = JSON.parse(generatedText) as RouterDecision;
    
    // Validate the speaker exists
    const speakerIds = ["david", ...activeCharacters.map(c => c.id)];
    if (!speakerIds.includes(decision.nextSpeaker.toLowerCase())) {
      // Default to Marcus if invalid
      decision.nextSpeaker = "marcus";
    }

    return decision;
  } catch (error) {
    console.error("Router error:", error);
    // Fallback: alternate between characters
    const lastSpeaker = recentTurns[recentTurns.length - 1]?.speaker;
    const nextChar = activeCharacters.find(c => c.id !== lastSpeaker) || activeCharacters[0];

    return {
      nextSpeaker: nextChar?.id || "marcus",
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
    content: `[Marcus's guidance: Your intent is to ${routerIntent}. Respond authentically as ${character.name}.]`,
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
