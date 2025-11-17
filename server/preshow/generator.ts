import type { Character } from "@shared/schema";
import { getRelevantPassages } from "../knowledge/knowledge-base";
import { z } from "zod";
import OpenAI from "openai";

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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
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

2. HOST QUESTIONS (MUST generate EXACTLY 12 questions): Generate thoughtful questions for David that:
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

Be specific, thoughtful, and grounded in the actual teachings of Yeshua and the I AM principle.

IMPORTANT: Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
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
}`;

  try {
    console.log("[generatePreshowPrep] Calling OpenAI for prep generation...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Zero, the AI showrunner for The I AM Network. Generate structured prep sheets in valid JSON format only."
        },
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const generatedText = response.choices[0]?.message?.content;
    console.log("[generatePreshowPrep] OpenAI response received, length:", generatedText?.length);

    if (!generatedText) {
      console.error("[generatePreshowPrep] No generated text from OpenAI");
      throw new Error("No response from OpenAI");
    }

    // Parse and validate the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(generatedText);
      console.log("[generatePreshowPrep] Parsed JSON successfully");
      console.log("[generatePreshowPrep] segments count:", parsedData.segments?.length);
      console.log("[generatePreshowPrep] questions count:", parsedData.questions?.length);
      console.log("[generatePreshowPrep] aiPrompts keys:", Object.keys(parsedData.aiPrompts || {}).length);
    } catch (parseError) {
      console.error("Failed to parse OpenAI JSON response:", generatedText);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // Validate against schema
    const validationResult = prepResponseSchema.safeParse(parsedData);
    
    if (!validationResult.success) {
      console.error("[generatePreshowPrep] Validation failed!");
      console.error("[generatePreshowPrep] Validation errors:", JSON.stringify(validationResult.error.format(), null, 2));
      console.error("[generatePreshowPrep] Received data sample:", JSON.stringify({
        segmentsSample: parsedData.segments?.[0],
        questionsSample: parsedData.questions?.slice(0, 2),
        aiPromptsSample: Object.keys(parsedData.aiPrompts || {}).slice(0, 2)
      }, null, 2));
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
