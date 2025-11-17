// Database storage implementation using blueprint:javascript_database
import { 
  episodes, characters, turns, knowledgeBase, preshowPrep,
  type Episode, type InsertEpisode,
  type Character, type InsertCharacter,
  type Turn, type InsertTurn,
  type KnowledgeBase, type InsertKnowledgeBase,
  type PreshowPrep, type InsertPreshowPrep,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Episodes
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  getEpisode(id: string): Promise<Episode | undefined>;
  getAllEpisodes(): Promise<Episode[]>;
  updateEpisodeStatus(id: string, status: string): Promise<void>;

  // Turns
  createTurn(turn: InsertTurn): Promise<Turn>;
  getTurnsByEpisode(episodeId: string): Promise<Turn[]>;
  markTurnAsHighlight(id: string): Promise<void>;

  // Characters
  createCharacter(character: InsertCharacter): Promise<Character>;
  getCharacter(id: string): Promise<Character | undefined>;
  getAllCharacters(): Promise<Character[]>;
  getActiveCharacters(): Promise<Character[]>;
  updateCharacterActive(id: string, isActive: boolean): Promise<void>;

  // Preshow Prep
  createPreshowPrep(prep: InsertPreshowPrep): Promise<PreshowPrep>;
  upsertPreshowPrep(prep: InsertPreshowPrep): Promise<PreshowPrep>;
  getPreshowPrepByEpisode(episodeId: string): Promise<PreshowPrep | undefined>;

  // Knowledge Base
  createKnowledgeEntry(entry: InsertKnowledgeBase): Promise<KnowledgeBase>;
  getAllKnowledgeEntries(): Promise<KnowledgeBase[]>;
}

export class DatabaseStorage implements IStorage {
  // Episodes
  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const [episode] = await db
      .insert(episodes)
      .values(insertEpisode)
      .returning();
    return episode;
  }

  async getEpisode(id: string): Promise<Episode | undefined> {
    const [episode] = await db.select().from(episodes).where(eq(episodes.id, id));
    return episode || undefined;
  }

  async getAllEpisodes(): Promise<Episode[]> {
    return await db.select().from(episodes).orderBy(desc(episodes.date));
  }

  async updateEpisodeStatus(id: string, status: string): Promise<void> {
    await db.update(episodes).set({ status }).where(eq(episodes.id, id));
  }

  // Turns
  async createTurn(insertTurn: InsertTurn): Promise<Turn> {
    const [turn] = await db
      .insert(turns)
      .values(insertTurn)
      .returning();
    return turn;
  }

  async getTurnsByEpisode(episodeId: string): Promise<Turn[]> {
    return await db
      .select()
      .from(turns)
      .where(eq(turns.episodeId, episodeId))
      .orderBy(turns.timestamp);
  }

  async markTurnAsHighlight(id: string): Promise<void> {
    await db.update(turns).set({ isHighlight: true }).where(eq(turns.id, id));
  }

  // Characters
  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [character] = await db
      .insert(characters)
      .values(insertCharacter)
      .returning();
    return character;
  }

  async getCharacter(id: string): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character || undefined;
  }

  async getAllCharacters(): Promise<Character[]> {
    return await db.select().from(characters);
  }

  async getActiveCharacters(): Promise<Character[]> {
    return await db.select().from(characters).where(eq(characters.isActive, true));
  }

  async updateCharacterActive(id: string, isActive: boolean): Promise<void> {
    await db.update(characters).set({ isActive }).where(eq(characters.id, id));
  }

  // Preshow Prep
  async createPreshowPrep(insertPrep: InsertPreshowPrep): Promise<PreshowPrep> {
    const [prep] = await db
      .insert(preshowPrep)
      .values(insertPrep)
      .returning();
    return prep;
  }

  async upsertPreshowPrep(insertPrep: InsertPreshowPrep): Promise<PreshowPrep> {
    // Delete existing prep for this episode
    await db
      .delete(preshowPrep)
      .where(eq(preshowPrep.episodeId, insertPrep.episodeId!));
    
    // Insert new prep
    const [prep] = await db
      .insert(preshowPrep)
      .values(insertPrep)
      .returning();
    return prep;
  }

  async getPreshowPrepByEpisode(episodeId: string): Promise<PreshowPrep | undefined> {
    const [prep] = await db
      .select()
      .from(preshowPrep)
      .where(eq(preshowPrep.episodeId, episodeId))
      .orderBy(desc(preshowPrep.generatedAt))
      .limit(1);
    return prep || undefined;
  }

  // Knowledge Base
  async createKnowledgeEntry(insertEntry: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const [entry] = await db
      .insert(knowledgeBase)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async getAllKnowledgeEntries(): Promise<KnowledgeBase[]> {
    return await db.select().from(knowledgeBase);
  }
}

export const storage = new DatabaseStorage();
