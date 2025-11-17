// Knowledge base service for book and Bible retrieval
// Note: For MVP, we use simple keyword matching
// Future: implement vector embeddings for semantic search

import { db } from "../db";
import { knowledgeBase } from "@shared/schema";
import { like, or, eq } from "drizzle-orm";

export interface KnowledgeQuery {
  query: string;
  source?: "book" | "bible" | "both";
  limit?: number;
}

export interface KnowledgeResult {
  source: string;
  content: string;
  reference: string;
}

export async function getRelevantPassages(
  queryParams: KnowledgeQuery
): Promise<KnowledgeResult[]> {
  const { query, source = "both", limit = 5 } = queryParams;

  // Extract keywords for simple matching
  const keywords = extractKeywords(query);

  try {
    let dbQuery = db.select().from(knowledgeBase);

    // Filter by source if specified
    if (source !== "both") {
      dbQuery = dbQuery.where(eq(knowledgeBase.source, source)) as any;
    }

    const results = await dbQuery.limit(limit * 3); // Get more for filtering

    // Simple relevance scoring based on keyword matches
    const scored = results.map(result => {
      const contentLower = result.content.toLowerCase();
      const score = keywords.reduce((acc, keyword) => {
        const matches = (contentLower.match(new RegExp(keyword, "gi")) || []).length;
        return acc + matches;
      }, 0);

      return { ...result, score };
    });

    // Sort by score and take top results
    const topResults = scored
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return topResults.map(r => ({
      source: r.source,
      content: r.content,
      reference: r.reference,
    }));
  } catch (error) {
    console.error("Knowledge base query error:", error);
    return [];
  }
}

function extractKeywords(query: string): string[] {
  // Remove common words and extract meaningful terms
  const stopWords = new Set([
    "the", "is", "at", "which", "on", "a", "an", "and", "or", "but",
    "in", "with", "to", "of", "for", "by", "as", "from", "that", "this",
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
}

// Seed sample knowledge base entries
export async function seedKnowledgeBase() {
  const sampleEntries = [
    {
      source: "book" as const,
      content: "In the beginning, I AM. Not was, not will be, but AM. This eternal present is the foundation of all consciousness. When we say 'I Am', we tap into the divine source that connects every living being.",
      reference: "Chapter 1: The Eternal Now",
      metadata: { chapter: 1, page: 1 },
    },
    {
      source: "book" as const,
      content: "God is not separate from you. God is the I AM within you. When Yeshua said 'I AM the way, the truth, and the life,' he was not claiming exclusivity but revealing the divine nature present in all consciousness.",
      reference: "Chapter 3: The Divine Within",
      metadata: { chapter: 3, page: 24 },
    },
    {
      source: "bible" as const,
      content: "And God said unto Moses, I AM THAT I AM: and he said, Thus shalt thou say unto the children of Israel, I AM hath sent me unto you.",
      reference: "Exodus 3:14 (KJV)",
      metadata: { book: "Exodus", chapter: 3, verse: 14 },
    },
    {
      source: "bible" as const,
      content: "Jesus said unto them, Verily, verily, I say unto you, Before Abraham was, I am.",
      reference: "John 8:58 (KJV)",
      metadata: { book: "John", chapter: 8, verse: 58 },
    },
    {
      source: "bible" as const,
      content: "I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
      reference: "John 14:6 (KJV)",
      metadata: { book: "John", chapter: 14, verse: 6 },
    },
    {
      source: "book" as const,
      content: "Love is not a commandment to follow but the natural state of unified consciousness. When we remember we are all I AM, love becomes automatic because there is no 'other' to fear or hate.",
      reference: "Chapter 7: Love Without Division",
      metadata: { chapter: 7, page: 89 },
    },
  ];

  try {
    // Check if already seeded
    const existing = await db.select().from(knowledgeBase).limit(1);
    if (existing.length > 0) {
      console.log("Knowledge base already seeded");
      return;
    }

    await db.insert(knowledgeBase).values(sampleEntries);
    console.log(`Seeded ${sampleEntries.length} knowledge base entries`);
  } catch (error) {
    console.error("Error seeding knowledge base:", error);
  }
}
