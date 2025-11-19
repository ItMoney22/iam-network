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

    } catch (error) {
        console.error("Error in Zero Chat:", error);
        res.status(500).json({ error: "Failed to process chat" });
    }
});

export function registerZeroAssistantRoutes(app: Router) {
    app.use(router);
}
