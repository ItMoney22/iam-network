/**
 * Zero Chat Monitor Service
 * Monitors incoming chat messages from all platforms and analyzes them
 * to alert David when important questions or topics arise
 */

import { EventEmitter } from 'events';
import { chatAggregator, type ChatMessage } from './chatAggregator';
import { zeroService } from '../../backend/services/zeroService';

export interface ChatAlert {
  id: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'question' | 'topic_request' | 'concern' | 'appreciation' | 'other';
  summary: string;
  messages: ChatMessage[];
  zeroAnalysis: string;
  actionSuggestion?: string;
}

interface MonitoringConfig {
  enabled: boolean;
  analysisInterval: number; // how often to analyze messages (ms)
  batchSize: number; // number of messages to analyze at once
  alertThreshold: 'low' | 'medium' | 'high'; // minimum priority to create alerts
}

class ZeroChatMonitorService extends EventEmitter {
  private config: MonitoringConfig = {
    enabled: false,
    analysisInterval: 30000, // 30 seconds
    batchSize: 10,
    alertThreshold: 'medium',
  };

  private analysisTimer: NodeJS.Timeout | null = null;
  private lastAnalyzedMessageId: string | null = null;
  private alerts: ChatAlert[] = [];
  private readonly maxAlertsStored = 50;

  constructor() {
    super();

    // Listen to chat messages
    chatAggregator.on('message', (message: ChatMessage) => {
      this.onMessage(message);
    });
  }

  /**
   * Start monitoring chat messages
   */
  async startMonitoring(config?: Partial<MonitoringConfig>) {
    if (this.config.enabled) {
      console.log('[ZeroChatMonitor] Already monitoring');
      return;
    }

    this.config = { ...this.config, ...config, enabled: true };
    console.log('[ZeroChatMonitor] Starting chat monitoring...');
    console.log(`[ZeroChatMonitor] Analysis interval: ${this.config.analysisInterval}ms`);
    console.log(`[ZeroChatMonitor] Alert threshold: ${this.config.alertThreshold}`);

    // Start periodic analysis
    this.scheduleAnalysis();

    this.emit('monitoring-started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    console.log('[ZeroChatMonitor] Stopping chat monitoring...');
    this.config.enabled = false;

    if (this.analysisTimer) {
      clearTimeout(this.analysisTimer);
      this.analysisTimer = null;
    }

    this.emit('monitoring-stopped');
  }

  /**
   * Handle incoming chat message
   */
  private onMessage(message: ChatMessage) {
    if (!this.config.enabled) return;

    // Log the message
    console.log(`[ZeroChatMonitor] New message: [${message.platform}] ${message.username}: ${message.message}`);

    // Check for urgent keywords that require immediate attention
    const urgentKeywords = [
      'emergency',
      'urgent',
      'help needed',
      'important question',
      'david please',
      'need answer now'
    ];

    const messageText = message.message.toLowerCase();
    const hasUrgentKeyword = urgentKeywords.some(keyword => messageText.includes(keyword));

    if (hasUrgentKeyword) {
      console.log('[ZeroChatMonitor] Urgent keyword detected! Triggering immediate analysis...');
      this.analyzeMessagesImmediately([message]);
    }

    // Also check for donations/events which should always alert
    if (message.hasDonation || message.event) {
      console.log('[ZeroChatMonitor] Donation/Event detected! Creating alert...');
      this.createSimpleAlert(message, 'high', 'appreciation');
    }
  }

  /**
   * Schedule periodic analysis
   */
  private scheduleAnalysis() {
    if (!this.config.enabled) return;

    this.analysisTimer = setTimeout(() => {
      this.performScheduledAnalysis();
      this.scheduleAnalysis(); // Reschedule
    }, this.config.analysisInterval);
  }

  /**
   * Perform scheduled batch analysis
   */
  private async performScheduledAnalysis() {
    try {
      const messages = chatAggregator.getRecentMessages(this.config.batchSize);

      if (messages.length === 0) {
        console.log('[ZeroChatMonitor] No new messages to analyze');
        return;
      }

      // Filter out messages we've already analyzed
      const newMessages = this.lastAnalyzedMessageId
        ? messages.filter(m => m.id !== this.lastAnalyzedMessageId &&
            messages.findIndex(msg => msg.id === m.id) < messages.findIndex(msg => msg.id === this.lastAnalyzedMessageId))
        : messages;

      if (newMessages.length === 0) {
        console.log('[ZeroChatMonitor] No new messages since last analysis');
        return;
      }

      console.log(`[ZeroChatMonitor] Analyzing ${newMessages.length} new messages...`);

      // Update last analyzed ID
      if (newMessages.length > 0) {
        this.lastAnalyzedMessageId = newMessages[0].id;
      }

      // Analyze the messages with Zero
      await this.analyzeMessagesWithZero(newMessages);

    } catch (error) {
      console.error('[ZeroChatMonitor] Error during scheduled analysis:', error);
    }
  }

  /**
   * Analyze messages immediately (for urgent cases)
   */
  private async analyzeMessagesImmediately(messages: ChatMessage[]) {
    try {
      console.log(`[ZeroChatMonitor] Performing immediate analysis of ${messages.length} message(s)...`);
      await this.analyzeMessagesWithZero(messages);
    } catch (error) {
      console.error('[ZeroChatMonitor] Error during immediate analysis:', error);
    }
  }

  /**
   * Use Zero to analyze a batch of messages
   */
  private async analyzeMessagesWithZero(messages: ChatMessage[]) {
    // Build context for Zero
    const chatContext = messages.map(m =>
      `[${m.platform}] ${m.username}: ${m.message}${m.hasDonation ? ` (Donation: ${m.hasDonation})` : ''}`
    ).reverse().join('\n');

    const analysisPrompt = `You are monitoring live stream chat for David Trinidad's "The I AM Network" show.

Analyze these recent chat messages and identify:
1. Important questions that David should answer
2. Topics that viewers want discussed
3. Any concerns or confusion that needs addressing
4. Appreciation/donations that should be acknowledged

Chat messages:
${chatContext}

Respond in JSON format:
{
  "hasImportantContent": boolean,
  "priority": "low" | "medium" | "high" | "urgent",
  "category": "question" | "topic_request" | "concern" | "appreciation" | "other",
  "summary": "Brief summary of what needs attention",
  "analysis": "Your detailed analysis",
  "actionSuggestion": "What David should do (optional)"
}

If there's nothing requiring attention, set hasImportantContent to false.`;

    try {
      const response = await zeroService.chat(
        [{ role: 'user', content: analysisPrompt }],
        {
          mode: 'show',
          temperature: 0.3,
          source: 'chat_monitor',
        }
      );

      // Parse Zero's response
      const jsonMatch = response.message.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('[ZeroChatMonitor] Could not parse Zero analysis');
        return;
      }

      const analysis = JSON.parse(jsonMatch[0]);

      if (analysis.hasImportantContent) {
        const meetsThreshold = this.checkAlertThreshold(analysis.priority);

        if (meetsThreshold) {
          const alert = this.createAlert(messages, analysis);
          console.log(`[ZeroChatMonitor] 🚨 Alert created: ${alert.priority.toUpperCase()} - ${alert.summary}`);
          this.emit('alert', alert);
        } else {
          console.log(`[ZeroChatMonitor] Content detected but below threshold (${analysis.priority} < ${this.config.alertThreshold})`);
        }
      } else {
        console.log('[ZeroChatMonitor] No important content detected in this batch');
      }

    } catch (error) {
      console.error('[ZeroChatMonitor] Error analyzing with Zero:', error);
    }
  }

  /**
   * Create an alert from Zero's analysis
   */
  private createAlert(messages: ChatMessage[], analysis: any): ChatAlert {
    const alert: ChatAlert = {
      id: `alert-${Date.now()}`,
      timestamp: new Date(),
      priority: analysis.priority || 'medium',
      category: analysis.category || 'other',
      summary: analysis.summary || 'Chat activity requires attention',
      messages,
      zeroAnalysis: analysis.analysis || '',
      actionSuggestion: analysis.actionSuggestion,
    };

    // Store alert
    this.alerts.unshift(alert);
    if (this.alerts.length > this.maxAlertsStored) {
      this.alerts = this.alerts.slice(0, this.maxAlertsStored);
    }

    return alert;
  }

  /**
   * Create a simple alert (for donations/events)
   */
  private createSimpleAlert(message: ChatMessage, priority: ChatAlert['priority'], category: ChatAlert['category']) {
    const alert: ChatAlert = {
      id: `alert-${Date.now()}`,
      timestamp: new Date(),
      priority,
      category,
      summary: message.hasDonation
        ? `${message.username} sent ${message.hasDonation}!`
        : `${message.username}: ${message.event || 'Event'}`,
      messages: [message],
      zeroAnalysis: message.hasDonation
        ? 'A viewer has made a donation. This should be acknowledged and thanked.'
        : 'A special event has occurred in chat.',
      actionSuggestion: message.hasDonation
        ? `Thank ${message.username} for their generous donation of ${message.hasDonation}`
        : `Acknowledge ${message.username}'s ${message.event}`,
    };

    this.alerts.unshift(alert);
    if (this.alerts.length > this.maxAlertsStored) {
      this.alerts = this.alerts.slice(0, this.maxAlertsStored);
    }

    console.log(`[ZeroChatMonitor] 🚨 Simple alert created: ${alert.summary}`);
    this.emit('alert', alert);
  }

  /**
   * Check if priority meets threshold
   */
  private checkAlertThreshold(priority: string): boolean {
    const priorityLevels = { 'low': 1, 'medium': 2, 'high': 3, 'urgent': 4 };
    const messagePriority = priorityLevels[priority as keyof typeof priorityLevels] || 1;
    const threshold = priorityLevels[this.config.alertThreshold];
    return messagePriority >= threshold;
  }

  /**
   * Get all alerts
   */
  getAlerts(limit: number = 20): ChatAlert[] {
    return this.alerts.slice(0, limit);
  }

  /**
   * Get alerts by priority
   */
  getAlertsByPriority(priority: ChatAlert['priority']): ChatAlert[] {
    return this.alerts.filter(a => a.priority === priority);
  }

  /**
   * Clear an alert
   */
  clearAlert(alertId: string) {
    this.alerts = this.alerts.filter(a => a.id !== alertId);
    this.emit('alert-cleared', alertId);
  }

  /**
   * Clear all alerts
   */
  clearAllAlerts() {
    this.alerts = [];
    this.emit('all-alerts-cleared');
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(config: Partial<MonitoringConfig>) {
    this.config = { ...this.config, ...config };
    console.log('[ZeroChatMonitor] Configuration updated:', this.config);

    // Restart analysis timer with new interval
    if (this.config.enabled && config.analysisInterval) {
      if (this.analysisTimer) {
        clearTimeout(this.analysisTimer);
      }
      this.scheduleAnalysis();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      alertCount: this.alerts.length,
      urgentAlerts: this.alerts.filter(a => a.priority === 'urgent').length,
      highAlerts: this.alerts.filter(a => a.priority === 'high').length,
      lastAnalyzedMessageId: this.lastAnalyzedMessageId,
      config: this.config,
    };
  }
}

export const zeroChatMonitor = new ZeroChatMonitorService();
