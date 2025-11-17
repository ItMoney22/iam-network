// API client functions for The I AM Network
import { apiRequest } from "@/lib/queryClient";
import type { Character, Episode, Turn } from "@shared/schema";

// Characters API
export async function fetchCharacters(): Promise<Character[]> {
  const response = await fetch("/api/characters");
  if (!response.ok) throw new Error("Failed to fetch characters");
  return response.json();
}

export async function fetchActiveCharacters(): Promise<Character[]> {
  const response = await fetch("/api/characters/active");
  if (!response.ok) throw new Error("Failed to fetch active characters");
  return response.json();
}

export async function toggleCharacterActive(id: string, isActive: boolean): Promise<Character> {
  const response = await apiRequest("PATCH", `/api/characters/${id}/active`, { isActive });
  return await response.json();
}

// Episodes API
export async function fetchEpisodes(): Promise<Episode[]> {
  const response = await fetch("/api/episodes");
  if (!response.ok) throw new Error("Failed to fetch episodes");
  return await response.json();
}

export async function createEpisode(data: {
  title: string;
  theme: string;
  participants: string[];
}): Promise<Episode> {
  const response = await apiRequest("POST", "/api/episodes", data);
  return await response.json();
}

export async function fetchEpisodeTurns(episodeId: string): Promise<Turn[]> {
  const response = await fetch(`/api/episodes/${episodeId}/turns`);
  if (!response.ok) throw new Error("Failed to fetch turns");
  return await response.json();
}

// Conversation API
export async function routeNextSpeaker(data: {
  episodeId: string;
  theme: string;
  debateHeat?: number;
}): Promise<{ nextSpeaker: string; intent: string; reasoning: string }> {
  const response = await apiRequest("POST", "/api/conversation/next", data);
  return await response.json();
}

export async function generateAIResponse(data: {
  characterId: string;
  episodeId: string;
  routerIntent: string;
  query?: string;
}): Promise<Turn> {
  const response = await apiRequest("POST", "/api/conversation/generate", data);
  return await response.json();
}

export async function addConversationTurn(data: {
  episodeId: string;
  speaker: string;
  text: string;
  type: string;
}): Promise<Turn> {
  const response = await apiRequest("POST", "/api/conversation/turn", data);
  return await response.json();
}

// Preshow API
export async function generatePreshowPrep(data: {
  episodeId: string;
  theme: string;
}): Promise<any> {
  return apiRequest("POST", "/api/preshow", data);
}
