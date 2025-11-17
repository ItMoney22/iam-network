/**
 * System Health & Alerts API Routes
 * For Zero's watchdog function and host panel monitoring
 */

import type { Express } from "express";
import {
  checkSystemHealth,
  getRecentAlerts,
  resolveAlert,
  getHealthSummary,
  createAlert,
} from "../services/systemHealth";

export function registerSystemRoutes(app: Express) {
  /**
   * GET /api/system/health
   * Check health of all subsystems
   */
  app.get("/api/system/health", async (req, res) => {
    try {
      const health = await checkSystemHealth();
      res.json(health);
    } catch (error: any) {
      console.error("[system/health] Error:", error);
      res.status(500).json({ error: "Failed to check system health" });
    }
  });

  /**
   * GET /api/system/alerts
   * Get recent system alerts
   */
  app.get("/api/system/alerts", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const unresolvedOnly = req.query.unresolved === 'true';

      const alerts = await getRecentAlerts(limit, unresolvedOnly);
      res.json(alerts);
    } catch (error: any) {
      console.error("[system/alerts] Error:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  /**
   * GET /api/system/summary
   * Get health summary for display in host panel
   */
  app.get("/api/system/summary", async (req, res) => {
    try {
      const summary = await getHealthSummary();
      res.json(summary);
    } catch (error: any) {
      console.error("[system/summary] Error:", error);
      res.status(500).json({ error: "Failed to get health summary" });
    }
  });

  /**
   * POST /api/system/alerts/:id/resolve
   * Mark an alert as resolved
   */
  app.post("/api/system/alerts/:id/resolve", async (req, res) => {
    try {
      const { id } = req.params;
      await resolveAlert(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[system/alerts/resolve] Error:", error);
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  });

  /**
   * POST /api/system/alerts
   * Manually create an alert (for testing or manual reporting)
   */
  app.post("/api/system/alerts", async (req, res) => {
    try {
      const { level, source, message, details } = req.body;

      if (!level || !source || !message) {
        return res.status(400).json({
          error: "Missing required fields: level, source, message"
        });
      }

      await createAlert(level, source, message, details);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[system/alerts/create] Error:", error);
      res.status(500).json({ error: "Failed to create alert" });
    }
  });
}
