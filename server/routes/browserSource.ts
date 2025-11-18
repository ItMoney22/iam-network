import type { Express } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { chatAggregator, type ChatMessage } from '../services/chatAggregator';

const clients = new Set<WebSocket>();

export function registerBrowserSourceRoutes(app: Express, server: Server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws/chat'
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[BrowserSource] New WebSocket client connected');
    clients.add(ws);

    const recentMessages = chatAggregator.getRecentMessages(20);
    ws.send(JSON.stringify({
      type: 'history',
      messages: recentMessages
    }));

    const status = chatAggregator.getConnectionStatus();
    ws.send(JSON.stringify({
      type: 'status',
      status
    }));

    ws.on('close', () => {
      console.log('[BrowserSource] Client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('[BrowserSource] WebSocket error:', error);
      clients.delete(ws);
    });
  });

  chatAggregator.on('message', (message: ChatMessage) => {
    const payload = JSON.stringify({
      type: 'message',
      message
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (error) {
          console.error('[BrowserSource] Error sending message to client:', error);
          clients.delete(client);
        }
      }
    });
  });

  chatAggregator.on('platform-connected', (platform: string) => {
    const status = chatAggregator.getConnectionStatus();
    const payload = JSON.stringify({
      type: 'status',
      status
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (error) {
          console.error('[BrowserSource] Error sending status to client:', error);
        }
      }
    });
  });

  chatAggregator.on('platform-error', (data: { platform: string; error: any }) => {
    const status = chatAggregator.getConnectionStatus();
    const payload = JSON.stringify({
      type: 'status',
      status
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (error) {
          console.error('[BrowserSource] Error sending status to client:', error);
        }
      }
    });
  });

  app.get('/api/chat/messages', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = chatAggregator.getRecentMessages(limit);
      res.json({ messages });
    } catch (error) {
      console.error('[BrowserSource] Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.get('/api/chat/status', async (req, res) => {
    try {
      const status = chatAggregator.getConnectionStatus();
      res.json({ status });
    } catch (error) {
      console.error('[BrowserSource] Error fetching status:', error);
      res.status(500).json({ error: 'Failed to fetch status' });
    }
  });

  app.post('/api/chat/test-message', async (req, res) => {
    try {
      const { platform, username, message } = req.body;

      if (!platform || !username || !message) {
        return res.status(400).json({
          error: 'Missing required fields: platform, username, message'
        });
      }

      if (!['kick', 'twitch', 'tiktok'].includes(platform)) {
        return res.status(400).json({
          error: 'Invalid platform. Must be: kick, twitch, or tiktok'
        });
      }

      chatAggregator.injectTestMessage(platform, username, message);

      res.json({
        success: true,
        message: 'Test message injected successfully'
      });
    } catch (error) {
      console.error('[BrowserSource] Error injecting test message:', error);
      res.status(500).json({ error: 'Failed to inject test message' });
    }
  });

  app.post('/api/chat/reconnect', async (req, res) => {
    try {
      const { platform } = req.body;

      if (!platform) {
        await chatAggregator.disconnect();
        await chatAggregator.initialize();
        return res.json({
          success: true,
          message: 'All platforms reconnecting...'
        });
      }

      if (!['kick', 'twitch', 'tiktok'].includes(platform)) {
        return res.status(400).json({
          error: 'Invalid platform. Must be: kick, twitch, or tiktok'
        });
      }

      res.json({
        success: true,
        message: `Reconnecting to ${platform}...`,
        note: 'Platform-specific reconnection requires service enhancement'
      });
    } catch (error) {
      console.error('[BrowserSource] Error reconnecting:', error);
      res.status(500).json({ error: 'Failed to reconnect' });
    }
  });

  console.log('[BrowserSource] Routes registered successfully');
  console.log('[BrowserSource] WebSocket server listening on /ws/chat');
  console.log('[BrowserSource] API endpoints:');
  console.log('  - GET  /api/chat/messages - Get recent messages');
  console.log('  - GET  /api/chat/status - Get platform connection status');
  console.log('  - POST /api/chat/test-message - Inject test message');
  console.log('  - POST /api/chat/reconnect - Reconnect to platforms');
}
