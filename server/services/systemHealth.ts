/**
 * System Health & Alerts Service
 * Monitors subsystems and creates alerts for Zero's watchdog function
 */

import { db } from "../db";
import { systemAlerts, type InsertSystemAlert } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { testLLMProvider } from "./llmEngine";

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';
export type AlertSource = 'backend' | 'llm' | 'tts' | 'stt' | 'db' | 'frontend' | 'api';

/**
 * Create a system alert
 */
export async function createAlert(
  level: AlertLevel,
  source: AlertSource,
  message: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await db.insert(systemAlerts).values({
      level,
      source,
      message,
      details: details || null,
      resolved: false,
    });

    // Log to console for immediate visibility
    const emoji = level === 'critical' ? '🚨' :
                  level === 'error' ? '❌' :
                  level === 'warning' ? '⚠️' : 'ℹ️';

    console.log(`${emoji} [${source}] ${message}`, details || '');
  } catch (error) {
    console.error('[systemHealth] Failed to create alert:', error);
  }
}

/**
 * Get recent alerts
 */
export async function getRecentAlerts(
  limit: number = 20,
  unresolvedOnly: boolean = false
): Promise<typeof systemAlerts.$inferSelect[]> {
  try {
    let query = db.select().from(systemAlerts);

    if (unresolvedOnly) {
      query = query.where(eq(systemAlerts.resolved, false)) as any;
    }

    return await query
      .orderBy(desc(systemAlerts.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('[systemHealth] Failed to get alerts:', error);
    return [];
  }
}

/**
 * Mark alert as resolved
 */
export async function resolveAlert(alertId: string): Promise<void> {
  try {
    await db
      .update(systemAlerts)
      .set({ resolved: true })
      .where(eq(systemAlerts.id, alertId));
  } catch (error) {
    console.error('[systemHealth] Failed to resolve alert:', error);
  }
}

/**
 * Check health of all subsystems
 */
export async function checkSystemHealth(): Promise<{
  ok: boolean;
  subsystems: Record<string, { ok: boolean; error?: string }>;
}> {
  const subsystems: Record<string, { ok: boolean; error?: string }> = {};

  // Check database
  try {
    await db.select().from(systemAlerts).limit(1);
    subsystems.db = { ok: true };
  } catch (error: any) {
    subsystems.db = { ok: false, error: error.message };
    await createAlert('critical', 'db', 'Database connection failed', { error: error.message });
  }

  // Check LLM providers
  const llmProviders: Array<'openai' | 'openrouter' | 'gemini'> = ['openai', 'openrouter', 'gemini'];

  for (const provider of llmProviders) {
    const result = await testLLMProvider(provider);
    subsystems[`llm_${provider}`] = result;

    if (!result.ok) {
      await createAlert(
        'error',
        'llm',
        `${provider.toUpperCase()} LLM provider is not responding`,
        { provider, error: result.error }
      );
    }
  }

  // Overall health is ok if critical systems are ok
  const ok = subsystems.db?.ok ?? false;

  return { ok, subsystems };
}

/**
 * Error hook middleware
 * Automatically creates alerts from unhandled errors
 */
export function errorHook(error: any, context: {
  source: AlertSource;
  operation?: string;
  metadata?: Record<string, any>;
}) {
  const { source, operation, metadata } = context;

  const message = operation
    ? `Error in ${operation}: ${error.message}`
    : error.message;

  const level: AlertLevel = error.status >= 500 || !error.status ? 'error' : 'warning';

  createAlert(level, source, message, {
    ...metadata,
    error: error.message,
    stack: error.stack,
    status: error.status,
  });
}

/**
 * Get system health summary for display
 */
export async function getHealthSummary(): Promise<{
  status: 'healthy' | 'degraded' | 'critical';
  unresolvedAlerts: number;
  criticalAlerts: number;
  recentIssues: string[];
}> {
  const alerts = await getRecentAlerts(50, true);

  const criticalAlerts = alerts.filter(a => a.level === 'critical').length;
  const unresolvedAlerts = alerts.length;

  const recentIssues = alerts
    .slice(0, 5)
    .map(a => `[${a.level}] ${a.source}: ${a.message}`);

  let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
  if (criticalAlerts > 0) {
    status = 'critical';
  } else if (unresolvedAlerts > 5) {
    status = 'degraded';
  }

  return {
    status,
    unresolvedAlerts,
    criticalAlerts,
    recentIssues,
  };
}
