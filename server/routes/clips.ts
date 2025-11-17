/**
 * Episode Clips API Routes
 * For marking moments during live episodes to create shorts later
 */

import type { Express } from "express";
import { db } from "../db";
import { episodeClips, episodes } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export function registerClipsRoutes(app: Express) {
  /**
   * POST /api/episodes/:episodeId/clip
   * Create a clip marker for the current episode
   */
  app.post("/api/episodes/:episodeId/clip", async (req, res) => {
    try {
      const { episodeId } = req.params;
      const { timestampSeconds, label } = req.body;

      if (typeof timestampSeconds !== 'number') {
        return res.status(400).json({
          error: "timestampSeconds must be a number"
        });
      }

      // Verify episode exists
      const episode = await db
        .select()
        .from(episodes)
        .where(eq(episodes.id, episodeId))
        .limit(1);

      if (episode.length === 0) {
        return res.status(404).json({ error: "Episode not found" });
      }

      // Create clip marker
      const clip = await db
        .insert(episodeClips)
        .values({
          episodeId,
          timestampSeconds,
          label: label || null,
        })
        .returning();

      res.json(clip[0]);
    } catch (error: any) {
      console.error("[clips/create] Error:", error);
      res.status(500).json({ error: "Failed to create clip marker" });
    }
  });

  /**
   * GET /api/episodes/:episodeId/clips
   * Get all clip markers for an episode
   */
  app.get("/api/episodes/:episodeId/clips", async (req, res) => {
    try {
      const { episodeId } = req.params;

      const clips = await db
        .select()
        .from(episodeClips)
        .where(eq(episodeClips.episodeId, episodeId))
        .orderBy(episodeClips.timestampSeconds);

      res.json(clips);
    } catch (error: any) {
      console.error("[clips/list] Error:", error);
      res.status(500).json({ error: "Failed to fetch clips" });
    }
  });

  /**
   * GET /api/clips
   * Get all clips across all episodes (for review page)
   */
  app.get("/api/clips", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      const clips = await db
        .select({
          id: episodeClips.id,
          episodeId: episodeClips.episodeId,
          episodeTitle: episodes.title,
          episodeTheme: episodes.theme,
          label: episodeClips.label,
          timestampSeconds: episodeClips.timestampSeconds,
          createdAt: episodeClips.createdAt,
        })
        .from(episodeClips)
        .leftJoin(episodes, eq(episodeClips.episodeId, episodes.id))
        .orderBy(desc(episodeClips.createdAt))
        .limit(limit);

      res.json(clips);
    } catch (error: any) {
      console.error("[clips/all] Error:", error);
      res.status(500).json({ error: "Failed to fetch all clips" });
    }
  });

  /**
   * DELETE /api/clips/:clipId
   * Delete a clip marker
   */
  app.delete("/api/clips/:clipId", async (req, res) => {
    try {
      const { clipId } = req.params;

      await db
        .delete(episodeClips)
        .where(eq(episodeClips.id, clipId));

      res.json({ success: true });
    } catch (error: any) {
      console.error("[clips/delete] Error:", error);
      res.status(500).json({ error: "Failed to delete clip" });
    }
  });

  /**
   * GET /api/episodes/:episodeId/elapsed
   * Get elapsed time for current episode (in seconds)
   */
  app.get("/api/episodes/:episodeId/elapsed", async (req, res) => {
    try {
      const { episodeId } = req.params;

      const episode = await db
        .select()
        .from(episodes)
        .where(eq(episodes.id, episodeId))
        .limit(1);

      if (episode.length === 0) {
        return res.status(404).json({ error: "Episode not found" });
      }

      const ep = episode[0];

      if (!ep.episodeStartTime) {
        return res.json({ elapsed: 0, isLive: false });
      }

      const elapsed = Math.floor(
        (Date.now() - ep.episodeStartTime.getTime()) / 1000
      );

      res.json({
        elapsed,
        isLive: ep.status === 'live',
        startTime: ep.episodeStartTime,
      });
    } catch (error: any) {
      console.error("[episodes/elapsed] Error:", error);
      res.status(500).json({ error: "Failed to get elapsed time" });
    }
  });

  /**
   * POST /api/episodes/:episodeId/start
   * Mark episode as live and set start time
   */
  app.post("/api/episodes/:episodeId/start", async (req, res) => {
    try {
      const { episodeId } = req.params;

      const updated = await db
        .update(episodes)
        .set({
          status: 'live',
          episodeStartTime: new Date(),
        })
        .where(eq(episodes.id, episodeId))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Episode not found" });
      }

      res.json(updated[0]);
    } catch (error: any) {
      console.error("[episodes/start] Error:", error);
      res.status(500).json({ error: "Failed to start episode" });
    }
  });
}

/**
 * Helper: Format timestamp as HH:MM:SS
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
