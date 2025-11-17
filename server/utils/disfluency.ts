// Disfluency processor - adds natural speech patterns to AI responses
import type { Character } from "@shared/schema";

const DISFLUENCY_WORDS = {
  fillers: ["uh", "um", "you know", "I mean", "like", "so"],
  hedges: ["kind of", "sort of", "I think", "maybe"],
  restarts: ["I mean,", "Well,", "Actually,"],
};

export function addDisfluency(text: string, character: Character): string {
  const level = character.disfluencyLevel;
  
  if (level === "none") {
    return text;
  }

  // Parse sentences
  const sentences = text.split(/([.!?])\s+/);
  const processed: string[] = [];

  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i];
    
    // Skip punctuation
    if (sentence.match(/^[.!?]$/)) {
      processed.push(sentence);
      continue;
    }

    // Determine probability based on level
    const insertProb = level === "low" ? 0.15 : level === "medium" ? 0.35 : 0.55;

    // Add filler at start sometimes
    if (Math.random() < insertProb * 0.5) {
      const filler = DISFLUENCY_WORDS.restarts[Math.floor(Math.random() * DISFLUENCY_WORDS.restarts.length)];
      sentence = `${filler} ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
    }

    // Add fillers mid-sentence
    if (Math.random() < insertProb) {
      const words = sentence.split(" ");
      const insertIndex = Math.floor(words.length * (0.3 + Math.random() * 0.4)); // Insert in middle third
      const filler = DISFLUENCY_WORDS.fillers[Math.floor(Math.random() * DISFLUENCY_WORDS.fillers.length)];
      words.splice(insertIndex, 0, filler + ",");
      sentence = words.join(" ");
    }

    // Add hedge sometimes
    if (level !== "low" && Math.random() < insertProb * 0.3) {
      const words = sentence.split(" ");
      const hedge = DISFLUENCY_WORDS.hedges[Math.floor(Math.random() * DISFLUENCY_WORDS.hedges.length)];
      words.splice(Math.floor(words.length * 0.5), 0, hedge);
      sentence = words.join(" ");
    }

    processed.push(sentence);
  }

  return processed.join(" ");
}
