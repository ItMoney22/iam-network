import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { CHARACTERS } from "@shared/characters-config";
import { routeNextSpeaker, generateAITurn } from "./conversation/router";
import { getRelevantPassages } from "./knowledge/knowledge-base";
import { seedKnowledgeBase } from "./knowledge/knowledge-base";
import { insertEpisodeSchema, insertTurnSchema, insertPreshowPrepSchema } from "@shared/schema";
import { generatePreshowPrep } from "./preshow/generator";
import { registerSystemRoutes } from "./routes/system";
import { registerClipsRoutes } from "./routes/clips";
import { registerZeroRoutes } from "../backend/routes/zero";
import { registerImageRoutes } from "../backend/routes/images";
import { registerBrowserSourceRoutes } from "./routes/browserSource";
import { chatAggregator } from "./services/chatAggregator";

import { registerZeroAssistantRoutes } from "./routes/zero-assistant";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data on startup
  await initializeData();

  // Initialize chat aggregator
  await chatAggregator.initialize();

  // Register system health & alerts routes
  registerSystemRoutes(app);

  // Register episode clips routes
  registerClipsRoutes(app);

  // Register Zero AI routes (voice + chat)
  registerZeroRoutes(app);

  // Register Zero Personal Assistant (Second Brain)
  registerZeroAssistantRoutes(app);

  // Register image generation routes (Replicate)
  registerImageRoutes(app);

  // GET /api/characters - Get all characters
  app.get("/api/characters", async (req, res) => {
    try {
      const chars = await storage.getAllCharacters();
      res.json(chars);
    } catch (error) {
      console.error("Error fetching characters:", error);
      res.status(500).json({ error: "Failed to fetch characters" });
    }
  });

  // GET /api/characters/active - Get active characters only
  app.get("/api/characters/active", async (req, res) => {
    try {
      const chars = await storage.getActiveCharacters();
      res.json(chars);
    } catch (error) {
      console.error("Error fetching active characters:", error);
      res.status(500).json({ error: "Failed to fetch active characters" });
    }
  });

  // PATCH /api/characters/:id/active - Toggle character active status
  app.patch("/api/characters/:id/active", async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({ error: "isActive must be a boolean" });
      }

      await storage.updateCharacterActive(id, isActive);
      const updated = await storage.getCharacter(id);

      if (!updated) {
        return res.status(404).json({ error: "Character not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating character:", error);
      res.status(500).json({ error: "Failed to update character" });
    }
  });

  // PATCH /api/characters/:id/personality - Update character personality traits
  app.patch("/api/characters/:id/personality", async (req, res) => {
    try {
      const { id } = req.params;
      const { engagement, depth, challenge, spirituality, humor } = req.body;

      const traits: Record<string, any> = {};
      if (engagement !== undefined) traits.engagement = engagement;
      if (depth !== undefined) traits.depth = depth;
      if (challenge !== undefined) traits.challenge = challenge;
      if (spirituality !== undefined) traits.spirituality = spirituality;
      if (humor !== undefined) traits.humor = humor;

      const updated = await storage.updateCharacterPersonality(id, traits);

      if (!updated) {
        return res.status(404).json({ error: "Character not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating character personality:", error);
      res.status(500).json({ error: "Failed to update character personality" });
    }
  });

  // GET /api/episodes - Get all episodes
  app.get("/api/episodes", async (req, res) => {
    try {
      const eps = await storage.getAllEpisodes();
      res.json(eps);
    } catch (error) {
      console.error("Error fetching episodes:", error);
      res.status(500).json({ error: "Failed to fetch episodes" });
    }
  });

  // POST /api/episodes - Create new episode
  app.post("/api/episodes", async (req, res) => {
    try {
      const validated = insertEpisodeSchema.parse(req.body);
      const episode = await storage.createEpisode(validated);
      res.json(episode);
    } catch (error) {
      console.error("Error creating episode:", error);
      res.status(400).json({ error: "Invalid episode data" });
    }
  });

  // GET /api/episodes/:id - Get episode details
  app.get("/api/episodes/:id", async (req, res) => {
    try {
      const episode = await storage.getEpisode(req.params.id);
      if (!episode) {
        return res.status(404).json({ error: "Episode not found" });
      }
      res.json(episode);
    } catch (error) {
      console.error("Error fetching episode:", error);
      res.status(500).json({ error: "Failed to fetch episode" });
    }
  });

  // GET /api/episodes/:id/turns - Get conversation turns for episode
  app.get("/api/episodes/:id/turns", async (req, res) => {
    try {
      const turns = await storage.getTurnsByEpisode(req.params.id);
      res.json(turns);
    } catch (error) {
      console.error("Error fetching turns:", error);
      res.status(500).json({ error: "Failed to fetch turns" });
    }
  });

  // POST /api/conversation/next - Get next speaker via Zero's router
  app.post("/api/conversation/next", async (req, res) => {
    try {
      const { episodeId, theme, debateHeat } = req.body;

      // Get recent turns and active characters
      const recentTurns = await storage.getTurnsByEpisode(episodeId);
      const activeCharacters = await storage.getActiveCharacters();

      const decision = await routeNextSpeaker({
        recentTurns: recentTurns.slice(-10),
        activeCharacters,
        episodeTheme: theme || "Divine Consciousness",
        debateHeat: debateHeat || 50,
      });

      res.json(decision);
    } catch (error) {
      console.error("Error routing next speaker:", error);
      res.status(500).json({ error: "Failed to route conversation" });
    }
  });

  // POST /api/conversation/generate - Generate AI response
  app.post("/api/conversation/generate", async (req, res) => {
    try {
      const { characterId, episodeId, routerIntent, query } = req.body;

      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      const recentTurns = await storage.getTurnsByEpisode(episodeId);

      // Get knowledge base context if query provided
      let knowledgeContext: string | undefined;
      if (query) {
        const passages = await getRelevantPassages({ query, source: "both", limit: 3 });
        if (passages.length > 0) {
          knowledgeContext = passages
            .map(p => `[${p.source}] ${p.reference}: ${p.content}`)
            .join("\n\n");
        }
      }

      const { text, audioUrl } = await generateAITurn(
        character,
        recentTurns.slice(-8),
        routerIntent || "continue_dialogue",
        knowledgeContext
      );

      // Save the turn
      const turn = await storage.createTurn({
        episodeId,
        speaker: character.id,
        text: text,
        type: "ai",
        isHighlight: false,
        metadata: audioUrl ? { audioUrl } : undefined,
      });

      res.json(turn);
    } catch (error) {
      console.error("Error generating AI response:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // POST /api/conversation/turn - Add a turn (from David or system)
  app.post("/api/conversation/turn", async (req, res) => {
    try {
      const validated = insertTurnSchema.parse(req.body);
      const turn = await storage.createTurn(validated);
      res.json(turn);
    } catch (error) {
      console.error("Error creating turn:", error);
      res.status(400).json({ error: "Invalid turn data" });
    }
  });

  // GET /api/preshow/:episodeId - Get pre-show prep by episode ID
  app.get("/api/preshow/:episodeId", async (req, res) => {
    try {
      const { episodeId } = req.params;
      const prep = await storage.getPreshowPrepByEpisode(episodeId);

      if (!prep) {
        return res.status(404).json({ error: "Prep not found" });
      }

      res.json(prep);
    } catch (error) {
      console.error("Error fetching preshow prep:", error);
      res.status(500).json({ error: "Failed to fetch prep" });
    }
  });

  // POST /api/preshow - Generate pre-show prep sheet
  app.post("/api/preshow", async (req, res) => {
    try {
      const { episodeId, theme } = req.body;

      if (!episodeId || !theme) {
        return res.status(400).json({ error: "episodeId and theme are required" });
      }

      // Get active characters for this episode
      const activeCharacters = await storage.getActiveCharacters();

      // Generate prep using Zero
      const prepData = await generatePreshowPrep({
        theme,
        participants: activeCharacters,
      });

      // Validate against insert schema before saving
      const validatedData = insertPreshowPrepSchema.parse({
        episodeId,
        ...prepData,
      });

      // Upsert to database (replace existing prep if present)
      const prep = await storage.upsertPreshowPrep(validatedData);

      res.json(prep);
    } catch (error) {
      console.error("Error creating preshow prep:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
      res.status(500).json({
        error: "Failed to create prep sheet",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // GET /api/knowledge - Search knowledge base
  app.get("/api/knowledge", async (req, res) => {
    try {
      const { query, source, limit } = req.query;

      const passages = await getRelevantPassages({
        query: query as string || "",
        source: source as "book" | "bible" | "both" || "both",
        limit: limit ? parseInt(limit as string) : 5,
      });

      res.json(passages);
    } catch (error) {
      console.error("Error searching knowledge base:", error);
      res.status(500).json({ error: "Failed to search knowledge base" });
    }
  });

  const httpServer = createServer(app);

  // Register browser source routes (must be after httpServer is created)
  registerBrowserSourceRoutes(app, httpServer);

  return httpServer;
}

// Initialize database with character and knowledge data
async function initializeData() {
  try {
    // Seed characters
    // Seed characters (Sync with config)
    console.log("Syncing characters with config...");
    const activeIds = new Set(CHARACTERS.map(c => c.id));

    // 1. Upsert all characters from config
    for (const char of CHARACTERS) {
      await storage.upsertCharacter({
        id: char.id,
        name: char.name,
        description: char.description,
        llmModel: char.llmModel,
        llmProvider: char.llmProvider,
        temperature: char.temperature,
        role: char.role,
        voiceProvider: char.voiceProvider,
        voiceId: char.voiceId,
        disfluencyLevel: char.disfluencyLevel,
        avatarImageUrl: char.avatarImageUrl,
        auraColor: char.auraColor,
        accentTone: char.accentTone,
        isActive: true, // Always active if in config
      });
    }

    // 2. Deactivate characters not in config
    const allChars = await storage.getAllCharacters();
    for (const char of allChars) {
      if (!activeIds.has(char.id) && char.isActive) {
        console.log(`Deactivating old character: ${char.name} (${char.id})`);
        await storage.updateCharacterActive(char.id, false);
      }
    }
    console.log(`Synced ${CHARACTERS.length} characters`);

    // Seed knowledge base
    await seedKnowledgeBase();
  } catch (error) {
    console.error("Error initializing data:", error);
  }
}
