import type { Character } from "@shared/schema";
import { getRelevantPassages } from "../knowledge/knowledge-base";
import { z } from "zod";
import { GoogleGenAI, Type } from "@google/genai";

interface GeneratePrepOptions {
  theme: string;
  participants: Character[];
}

// Validation schemas
const prepSegmentSchema = z.object({
  name: z.string(),
  duration: z.string(),
  description: z.string(),
});

const prepQuestionSchema = z.object({
  question: z.string(),
  context: z.string(),
  source: z.enum(["book", "bible"]),
  passage: z.string(),
});

const prepResponseSchema = z.object({
  segments: z.array(prepSegmentSchema).length(3),
  questions: z.array(prepQuestionSchema).min(10).max(15),
  aiPrompts: z.record(z.string()),
});

interface PrepSegment {
  name: string;
  duration: string;
  description: string;
}

interface PrepQuestion {
  question: string;
  context: string;
  source: "book" | "bible";
  passage: string;
}

interface PreshowPrepData {
  theme: string;
  segmentStructure: {
    acts: PrepSegment[];
  };
  hostQuestions: PrepQuestion[];
  aiPrompts: Record<string, string>;
}

// Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

export async function generatePreshowPrep(
  options: GeneratePrepOptions
): Promise<PreshowPrepData> {
  const { theme, participants } = options;

  // Retrieve relevant knowledge base passages for the theme
  const knowledgePassages = await getRelevantPassages({
    query: theme,
    source: "both",
    limit: 15, // Get enough passages to ground 10-15 questions
  });

  // Format passages for the prompt
  const passagesContext = knowledgePassages
    .map((p, i) => `[${i + 1}] ${p.source === "bible" ? "Bible" : "Book"}: "${p.content}" (${p.reference})`)
    .join("\n\n");

  const participantNames = participants.map(p => p.name).join(", ");
  const participantDescriptions = participants
    .map(p => `${p.name}: ${p.description}`)
    .join("\n");

  const fullPrompt = `You are Zero, the AI showrunner for "The I AM Network" - a spiritual-philosophical conversation platform. 

Your role is to generate comprehensive pre-show preparation materials for the host, David Trinidad, to guide meaningful conversations about divine consciousness, the teachings of Yeshua (Jesus), and spiritual awakening.

EPISODE THEME: "${theme}"
ACTIVE PARTICIPANTS: ${participantNames}

PARTICIPANT DETAILS:
${participantDescriptions}

KNOWLEDGE BASE PASSAGES (use these to ground your questions):
${passagesContext}

Generate a comprehensive pre-show prep sheet for this episode using the provided knowledge base passages.

1. SEGMENT STRUCTURE: Create 3 acts that flow naturally:
   - Act 1 (10-15 min): Opening and intention-setting
   - Act 2 (25-30 min): Core exploration and debate
   - Act 3 (15-20 min): Integration and synthesis
   
   For each act, provide: name, estimated duration, and a brief description of its purpose.

2. HOST QUESTIONS (exactly 10-15 questions): Generate thoughtful questions for David that:
   - MUST be directly grounded in the knowledge base passages provided above
   - Use specific quotes, concepts, or teachings from those passages
   - Explore the episode theme from multiple angles
   - Create opportunities for debate and different perspectives
   - Progress from foundational to profound
   - Balance intellectual rigor with heart-centered wisdom
   
   For EACH question, you must provide:
   - The question itself (must reference specific passage content)
   - Context: Why this question matters for the theme
   - Source: Either "book" or "bible" (matching the passage source)
   - Passage: The exact reference from the knowledge base (e.g., "John 8:58" or "Chapter 3")

3. AI-SPECIFIC PROMPTS: For each active AI participant, create a brief (1-2 sentence) instruction about:
   - Their unique angle on this theme
   - How they should contribute to the conversation
   - Any specific provocations or bridges they should create

Return your response as a valid JSON object with this exact structure:
{
  "segments": [
    { "name": string, "duration": string, "description": string }
  ],
  "questions": [
    { "question": string, "context": string, "source": "book" | "bible", "passage": string }
  ],
  "aiPrompts": {
    "characterId": string
  }
}

Be specific, thoughtful, and grounded in the actual teachings of Yeshua and the I AM principle.`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }],
        },
      ],
      config: {
        temperature: 0.8,
        maxOutputTokens: 4000,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["name", "duration", "description"],
              },
              minItems: 3,
              maxItems: 3,
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  context: { type: Type.STRING },
                  source: { type: Type.STRING, enum: ["book", "bible"] },
                  passage: { type: Type.STRING },
                },
                required: ["question", "context", "source", "passage"],
              },
              minItems: 10,
              maxItems: 15,
            },
            aiPrompts: {
              type: Type.OBJECT,
            },
          },
          required: ["segments", "questions", "aiPrompts"],
        },
      },
    });

    const generatedText = result.text;

    if (!generatedText) {
      throw new Error("No response from Gemini");
    }

    // Parse and validate the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(generatedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON response:", generatedText);
      throw new Error("Invalid JSON response from Gemini");
    }

    // Validate against schema
    const validationResult = prepResponseSchema.safeParse(parsedData);
    
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error);
      throw new Error(`Invalid prep sheet structure: ${validationResult.error.message}`);
    }

    const validated = validationResult.data;

    return {
      theme,
      segmentStructure: {
        acts: validated.segments,
      },
      hostQuestions: validated.questions,
      aiPrompts: validated.aiPrompts,
    };
  } catch (error) {
    console.error("Error generating prep sheet:", error);
    throw new Error("Failed to generate prep sheet");
  }
}
