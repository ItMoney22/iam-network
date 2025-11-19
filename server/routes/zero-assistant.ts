import { Router } from "express";
import { storage } from "../storage";
import { memories } from "@shared/schema";
import { eq, desc, like, or } from "drizzle-orm";
import { db } from "../db";
import { MinimaxTTSService } from "../services/tts";
import { GCSStorageService } from "../services/gcs";
import OpenAI from "openai";

const router = Router();
const ttsService = new MinimaxTTSService();
const gcsService = new GCSStorageService();

// Initialize OpenAI client
// Note: We use OpenAI for the assistant logic as it has good tool calling support
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are Zero, the "Divine Director" and personal assistant to the host (David).
Your role is to act as a "Second Brain". You help organize thoughts, remember details about guests and episodes, and provide spiritual/philosophical insights.

You have access to a memory database.
- When the user tells you something important (like a guest's name, a testimony, or an idea), SAVE it using the 'save_memory' tool.
- When the user asks for information, SEARCH your memories using the 'search_memories' tool.

Your personality:
- Voice: Deep, calm, authoritative but warm.
- Style: Concise, insightful, efficient.
- You are NOT a generic AI. You are Zero.
`;

// Tools definition for OpenAI
const tools = [
    {
        type: "function",
        function: {
            name: "save_memory",
            description: "Save a new memory, note, or fact to the database.",
            parameters: {
                type: "object",
                properties: {
                    content: {
                        type: "string",
                        description: "The content of the memory to save.",
                    },
                    type: {
                        type: "string",
                        enum: ["episode", "guest", "general"],
                        description: "The category of the memory.",
                    },
                    tags: {
                        type: "array",
                        items: { type: "string" },
                        description: "Keywords or tags to help find this memory later.",
                    },
                },
                required: ["content", "type"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_memories",
            description: "Search for memories in the database.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search term to look for.",
                    },
                },
                required: ["query"],
            },
        },
    },
] as const;

router.post("/api/zero/chat", async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        // 1. Construct messages for LLM
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history.map((h: any) => ({ role: h.role, content: h.content })),
            { role: "user", content: message },
        ];

        // 2. Call LLM with tools
        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Use a smart model for tool calling
            messages: messages as any,
            tools: tools as any,
            tool_choice: "auto",
        });

        const responseMessage = completion.choices[0].message;
        let finalContent = responseMessage.content || "";

        // 3. Handle Tool Calls
        if (responseMessage.tool_calls) {
            for (const toolCall of responseMessage.tool_calls) {
                const fnName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);

                if (fnName === "save_memory") {
                    await db.insert(memories).values({
                        type: args.type,
                        content: args.content,
                        tags: args.tags || [],
                    });
                    finalContent += `\n(I've saved that to my memory.)`;
                } else if (fnName === "search_memories") {
                    // Simple keyword search for now (can upgrade to vector search later)
                    const results = await db
                        .select()
                        .from(memories)
                        .where(like(memories.content, `%${args.query}%`))
                        .limit(5);

                    if (results.length > 0) {
                        const context = results.map((r) => `- [${r.type}] ${r.content}`).join("\n");

                        // Ask LLM again with the context
                        const followUp = await openai.chat.completions.create({
                            model: "gpt-4o",
                            messages: [
                                ...messages as any,
                                responseMessage,
                                {
                                    role: "tool",
                                    tool_call_id: toolCall.id,
                                    content: JSON.stringify(results),
                                },
                                {
                                    role: "system",
                                    content: `Found these memories. Incorporate them into your answer: \n${context}`,
                                }
                            ],
                        });
                        finalContent = followUp.choices[0].message.content || "";
                    } else {
                        // Ask LLM again with empty result
                        const followUp = await openai.chat.completions.create({
                            model: "gpt-4o",
                            messages: [
                                ...messages as any,
                                responseMessage,
                                {
                                    role: "tool",
                                    tool_call_id: toolCall.id,
                                    content: "No memories found.",
                                }
                            ],
                        });
                        finalContent = followUp.choices[0].message.content || "";
                    }
                }
            }
        }

        // 4. Generate Audio (TTS)
        let audioUrl = null;
        if (finalContent) {
            try {
                // Use Zero's voice ID (Marcus/Male-01)
                const audioBuffer = await ttsService.generateSpeech(finalContent, "male-01");
                audioUrl = await gcsService.uploadAudio(audioBuffer);
            } catch (ttsError) {
                console.error("TTS Error:", ttsError);
                // Don't fail the whole request if TTS fails
            }
        }

        res.json({
            role: "assistant",
            content: finalContent,
            audioUrl: audioUrl,
        });

    } catch (error) {
        console.error("Error in Zero Chat:", error);
        res.status(500).json({ error: "Failed to process chat" });
    }
});

export function registerZeroAssistantRoutes(app: Router) {
    app.use(router);
}
