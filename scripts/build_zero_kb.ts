#!/usr/bin/env tsx
/**
 * Zero Knowledge Base Builder
 *
 * Reads david_profile.md and zero_principles.md,
 * chunks the text, generates embeddings, and stores in database.
 *
 * Usage: npm run build:zero-kb
 */

import { db } from "../server/db";
import { zeroKnowledge } from "@shared/schema";
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { join } from "path";
import OpenAI from "openai";

const CHUNK_SIZE = 800; // tokens (roughly 500-1000 tokens as requested)
const EMBEDDING_MODEL = "text-embedding-3-small";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TextChunk {
  source: 'david_profile' | 'zero_principles';
  heading: string;
  text: string;
  orderIndex: number;
}

/**
 * Main ingestion process
 */
async function buildZeroKnowledgeBase() {
  console.log("🧠 Building Zero's Knowledge Base...\n");

  try {
    // 1. Read markdown files
    const davidProfile = readMarkdownFile('david_profile.md');
    const zeroPrinciples = readMarkdownFile('zero_principles.md');

    // 2. Chunk text
    console.log("📝 Chunking text...");
    const davidChunks = chunkMarkdown(davidProfile, 'david_profile');
    const zeroChunks = chunkMarkdown(zeroPrinciples, 'zero_principles');
    const allChunks = [...davidChunks, ...zeroChunks];
    console.log(`   Created ${allChunks.length} chunks (${davidChunks.length} from david_profile, ${zeroChunks.length} from zero_principles)\n`);

    // 3. Truncate existing zero_knowledge table
    console.log("🗑️  Clearing existing knowledge base...");
    await db.delete(zeroKnowledge);
    console.log("   Cleared.\n");

    // 4. Generate embeddings and insert
    console.log("🔢 Generating embeddings and inserting...");
    let inserted = 0;

    for (const chunk of allChunks) {
      try {
        // Generate embedding
        const embedding = await generateEmbedding(chunk.text);

        // Insert into database
        await db.insert(zeroKnowledge).values({
          source: chunk.source,
          heading: chunk.heading,
          orderIndex: chunk.orderIndex,
          text: chunk.text,
          embedding: JSON.stringify(embedding),
        });

        inserted++;
        process.stdout.write(`\r   Inserted ${inserted}/${allChunks.length} chunks...`);
      } catch (error: any) {
        console.error(`\n   Error processing chunk ${inserted + 1}:`, error.message);
      }
    }

    console.log(`\n\n✅ Zero Knowledge Base built successfully!`);
    console.log(`   Total chunks: ${inserted}`);
    console.log(`   Sources: david_profile (${davidChunks.length}), zero_principles (${zeroChunks.length})\n`);

  } catch (error: any) {
    console.error("❌ Error building knowledge base:", error.message);
    process.exit(1);
  }
}

/**
 * Read a markdown file from the zero_profile directory
 */
function readMarkdownFile(filename: string): string {
  const filePath = join(__dirname, '../server/data/zero_profile', filename);
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error: any) {
    throw new Error(`Failed to read ${filename}: ${error.message}`);
  }
}

/**
 * Chunk markdown text by headings and size
 */
function chunkMarkdown(
  markdown: string,
  source: 'david_profile' | 'zero_principles'
): TextChunk[] {
  const chunks: TextChunk[] = [];
  const lines = markdown.split('\n');

  let currentHeading = 'Introduction';
  let currentText: string[] = [];
  let orderIndex = 0;

  const flushChunk = () => {
    if (currentText.length > 0) {
      const text = currentText.join('\n').trim();
      if (text.length > 50) { // Minimum chunk size
        chunks.push({
          source,
          heading: currentHeading,
          text,
          orderIndex: orderIndex++,
        });
      }
      currentText = [];
    }
  };

  for (const line of lines) {
    // Detect headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushChunk();
      currentHeading = headingMatch[2].trim();
      continue;
    }

    // Skip empty lines at the start of a chunk
    if (currentText.length === 0 && line.trim() === '') {
      continue;
    }

    // Skip HTML comments
    if (line.trim().startsWith('<!--')) {
      continue;
    }

    currentText.push(line);

    // If chunk gets too large, split it
    const estimatedTokens = currentText.join('\n').length / 4; // Rough estimate
    if (estimatedTokens > CHUNK_SIZE) {
      flushChunk();
    }
  }

  // Flush remaining chunk
  flushChunk();

  return chunks;
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  return response.data[0].embedding;
}

// Run the script
buildZeroKnowledgeBase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
