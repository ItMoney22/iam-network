/**
 * Zero Knowledge Base Service
 * Loads and manages Zero's core knowledge (system prompt, David's profile, book content)
 */

import fs from 'fs/promises';
import path from 'path';

export interface ZeroKnowledge {
  systemPrompt: string;
  davidProfile: string;
  bookContent?: string;
  lastUpdated: Date;
}

class ZeroKnowledgeBaseService {
  private knowledge: ZeroKnowledge | null = null;
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(__dirname, '../data/zero');
  }

  /**
   * Load Zero's complete knowledge base
   */
  async loadKnowledge(): Promise<ZeroKnowledge> {
    try {
      const [systemPrompt, davidProfile] = await Promise.all([
        this.loadFile('zero_core_system_prompt.md'),
        this.loadFile('david_profile.md'),
      ]);

      // Optionally load book content if available
      let bookContent: string | undefined;
      try {
        bookContent = await this.loadFile('../book/iamgod_beginning.md');
      } catch (error) {
        console.warn('Book content not found, Zero will operate without it');
      }

      this.knowledge = {
        systemPrompt,
        davidProfile,
        bookContent,
        lastUpdated: new Date(),
      };

      return this.knowledge;
    } catch (error) {
      throw new Error(`Failed to load Zero's knowledge base: ${error}`);
    }
  }

  /**
   * Load a specific file from the data directory
   */
  private async loadFile(relativePath: string): Promise<string> {
    const filePath = path.join(this.dataPath, relativePath);
    return await fs.readFile(filePath, 'utf-8');
  }

  /**
   * Get cached knowledge or reload if stale
   */
  async getKnowledge(forceReload = false): Promise<ZeroKnowledge> {
    if (!this.knowledge || forceReload) {
      return await this.loadKnowledge();
    }
    return this.knowledge;
  }

  /**
   * Build complete context for Zero
   * This is what gets sent as system messages to OpenAI
   */
  async buildContext(additionalContext?: string): Promise<string> {
    const knowledge = await this.getKnowledge();

    let context = `${knowledge.systemPrompt}\n\n---\n\n# David's Profile\n\n${knowledge.davidProfile}`;

    if (knowledge.bookContent) {
      context += `\n\n---\n\n# David's Book: I Am GOD - In the Beginning\n\n${knowledge.bookContent}`;
    }

    if (additionalContext) {
      context += `\n\n---\n\n# Additional Context\n\n${additionalContext}`;
    }

    return context;
  }

  /**
   * Reload knowledge base (useful for hot-reloading during dev)
   */
  async reload(): Promise<void> {
    console.log('Reloading Zero knowledge base...');
    await this.loadKnowledge();
    console.log('Zero knowledge base reloaded successfully');
  }
}

export const zeroKB = new ZeroKnowledgeBaseService();
