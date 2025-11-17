import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Episodes table - stores show episodes
export const episodes = pgTable("episodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  theme: text("theme").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  participants: text("participants").array().notNull(), // Array of character IDs
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, live, completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Conversation turns table - stores individual messages in episodes
export const turns = pgTable("turns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  episodeId: varchar("episode_id").notNull().references(() => episodes.id, { onDelete: "cascade" }),
  speaker: text("speaker").notNull(), // character ID or "david" or "caller"
  text: text("text").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: varchar("type", { length: 20 }).notNull().default("ai"), // ai, host, caller, chat
  isHighlight: boolean("is_highlight").notNull().default(false),
  metadata: jsonb("metadata"), // For additional data like voice settings, emotion, etc.
});

// Characters table - stores AI personality configurations
export const characters = pgTable("characters", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  llmModel: text("llm_model").notNull(), // e.g., "grok-2", "gpt-4.1", "gemini-2.5-pro"
  llmProvider: text("llm_provider").notNull(), // "openrouter", "openai", "gemini"
  temperature: text("temperature").notNull().default("0.7"),
  role: text("role").notNull(), // e.g., "host_assistant", "skeptic_guest", "healer"
  voiceProvider: text("voice_provider"), // For future TTS integration
  voiceId: text("voice_id"), // For future TTS integration
  disfluencyLevel: varchar("disfluency_level", { length: 10 }).notNull().default("none"), // none, low, medium, high
  avatarImageUrl: text("avatar_image_url").notNull(),
  auraColor: text("aura_color").notNull(), // CSS color for glow effects
  accentTone: text("accent_tone"), // Additional personality notes
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Knowledge base entries - stores book and Bible passages
export const knowledgeBase = pgTable("knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: varchar("source", { length: 20 }).notNull(), // "book" or "bible"
  content: text("content").notNull(),
  reference: text("reference").notNull(), // Chapter/verse or page reference
  embedding: text("embedding"), // JSON string of vector embedding (for future)
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Preshow prep - stores Zero's preparation for episodes
export const preshowPrep = pgTable("preshow_prep", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  episodeId: varchar("episode_id").references(() => episodes.id, { onDelete: "cascade" }),
  theme: text("theme").notNull(),
  segmentStructure: jsonb("segment_structure").notNull(), // Acts/segments
  hostQuestions: text("host_questions").array().notNull(),
  aiPrompts: jsonb("ai_prompts").notNull(), // Character-specific prompts
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

// Relations
export const episodesRelations = relations(episodes, ({ many }) => ({
  turns: many(turns),
  preshowPrep: many(preshowPrep),
}));

export const turnsRelations = relations(turns, ({ one }) => ({
  episode: one(episodes, {
    fields: [turns.episodeId],
    references: [episodes.id],
  }),
}));

export const preshowPrepRelations = relations(preshowPrep, ({ one }) => ({
  episode: one(episodes, {
    fields: [preshowPrep.episodeId],
    references: [episodes.id],
  }),
}));

// Insert schemas
export const insertEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
  createdAt: true,
});

export const insertTurnSchema = createInsertSchema(turns).omit({
  id: true,
  timestamp: true,
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  createdAt: true,
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({
  id: true,
  createdAt: true,
});

export const insertPreshowPrepSchema = createInsertSchema(preshowPrep).omit({
  id: true,
  generatedAt: true,
});

// Types
export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;

export type Turn = typeof turns.$inferSelect;
export type InsertTurn = z.infer<typeof insertTurnSchema>;

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;

export type PreshowPrep = typeof preshowPrep.$inferSelect;
export type InsertPreshowPrep = z.infer<typeof insertPreshowPrepSchema>;
