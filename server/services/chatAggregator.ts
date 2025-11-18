import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  platform: 'kick' | 'twitch' | 'tiktok';
  timestamp: Date;
  userAvatar?: string;
  badges?: string[];
  color?: string;
}

export interface PlatformConfig {
  enabled: boolean;
  credentials: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    channelName?: string;
  };
}

class ChatAggregatorService extends EventEmitter {
  private kickWs: WebSocket | null = null;
  private twitchWs: WebSocket | null = null;
  private tiktokWs: WebSocket | null = null;

  private messageBuffer: ChatMessage[] = [];
  private readonly maxBufferSize = 100;

  private reconnectAttempts: Map<string, number> = new Map();
  private readonly maxReconnectAttempts = 5;
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  private isConnecting: Map<string, boolean> = new Map();
  private connectionStatus: Map<string, 'connected' | 'disconnected' | 'connecting' | 'error'> = new Map();

  constructor() {
    super();
    this.connectionStatus.set('kick', 'disconnected');
    this.connectionStatus.set('twitch', 'disconnected');
    this.connectionStatus.set('tiktok', 'disconnected');
  }

  async initialize() {
    console.log('[ChatAggregator] Initializing chat aggregation service...');

    const kickConfig: PlatformConfig = {
      enabled: !!process.env.KICK_API_KEY,
      credentials: {
        apiKey: process.env.KICK_API_KEY,
        channelName: process.env.KICK_CHANNEL_NAME || 'iamnetwork',
      }
    };

    const twitchConfig: PlatformConfig = {
      enabled: !!(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET),
      credentials: {
        clientId: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
        channelName: process.env.TWITCH_CHANNEL_NAME || 'iamnetwork',
      }
    };

    const tiktokConfig: PlatformConfig = {
      enabled: !!process.env.TIKTOK_API_KEY,
      credentials: {
        apiKey: process.env.TIKTOK_API_KEY,
        channelName: process.env.TIKTOK_CHANNEL_NAME || 'iamnetwork',
      }
    };

    if (kickConfig.enabled) {
      await this.connectKick(kickConfig);
    } else {
      console.log('[ChatAggregator] Kick integration disabled - no API key found');
    }

    if (twitchConfig.enabled) {
      await this.connectTwitch(twitchConfig);
    } else {
      console.log('[ChatAggregator] Twitch integration disabled - no credentials found');
    }

    if (tiktokConfig.enabled) {
      await this.connectTikTok(tiktokConfig);
    } else {
      console.log('[ChatAggregator] TikTok integration disabled - no API key found');
    }

    console.log('[ChatAggregator] Service initialized');
  }

  private async connectKick(config: PlatformConfig) {
    if (this.isConnecting.get('kick')) {
      console.log('[Kick] Already connecting...');
      return;
    }

    this.isConnecting.set('kick', true);
    this.connectionStatus.set('kick', 'connecting');

    try {
      console.log('[Kick] Connecting to Kick.com chat...');

      const channelName = config.credentials.channelName;
      const wsUrl = `wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0&flash=false`;

      this.kickWs = new WebSocket(wsUrl);

      this.kickWs.on('open', () => {
        console.log('[Kick] WebSocket connection established');
        this.connectionStatus.set('kick', 'connected');
        this.reconnectAttempts.set('kick', 0);

        const subscribeMessage = JSON.stringify({
          event: 'pusher:subscribe',
          data: {
            auth: '',
            channel: `chatrooms.${channelName}.v2`
          }
        });

        this.kickWs?.send(subscribeMessage);
        this.emit('platform-connected', 'kick');
      });

      this.kickWs.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.event === 'App\\Events\\ChatMessageEvent') {
            const chatData = JSON.parse(message.data);
            this.handleKickMessage(chatData);
          }
        } catch (error) {
          console.error('[Kick] Error parsing message:', error);
        }
      });

      this.kickWs.on('error', (error) => {
        console.error('[Kick] WebSocket error:', error);
        this.connectionStatus.set('kick', 'error');
        this.emit('platform-error', { platform: 'kick', error });
      });

      this.kickWs.on('close', () => {
        console.log('[Kick] WebSocket connection closed');
        this.connectionStatus.set('kick', 'disconnected');
        this.isConnecting.set('kick', false);
        this.scheduleReconnect('kick', config);
      });

      this.isConnecting.set('kick', false);
    } catch (error) {
      console.error('[Kick] Connection error:', error);
      this.connectionStatus.set('kick', 'error');
      this.isConnecting.set('kick', false);
      this.scheduleReconnect('kick', config);
    }
  }

  private async connectTwitch(config: PlatformConfig) {
    if (this.isConnecting.get('twitch')) {
      console.log('[Twitch] Already connecting...');
      return;
    }

    this.isConnecting.set('twitch', true);
    this.connectionStatus.set('twitch', 'connecting');

    try {
      console.log('[Twitch] Connecting to Twitch chat...');

      const wsUrl = 'wss://irc-ws.chat.twitch.tv:443';
      this.twitchWs = new WebSocket(wsUrl);

      this.twitchWs.on('open', () => {
        console.log('[Twitch] WebSocket connection established');

        this.twitchWs?.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
        this.twitchWs?.send('PASS SCHMOOPIIE');
        this.twitchWs?.send('NICK justinfan12345');
        this.twitchWs?.send(`JOIN #${config.credentials.channelName}`);

        this.connectionStatus.set('twitch', 'connected');
        this.reconnectAttempts.set('twitch', 0);
        this.emit('platform-connected', 'twitch');
      });

      this.twitchWs.on('message', (data: Buffer) => {
        try {
          const message = data.toString();

          if (message.includes('PING')) {
            this.twitchWs?.send('PONG :tmi.twitch.tv');
            return;
          }

          if (message.includes('PRIVMSG')) {
            this.handleTwitchMessage(message);
          }
        } catch (error) {
          console.error('[Twitch] Error parsing message:', error);
        }
      });

      this.twitchWs.on('error', (error) => {
        console.error('[Twitch] WebSocket error:', error);
        this.connectionStatus.set('twitch', 'error');
        this.emit('platform-error', { platform: 'twitch', error });
      });

      this.twitchWs.on('close', () => {
        console.log('[Twitch] WebSocket connection closed');
        this.connectionStatus.set('twitch', 'disconnected');
        this.isConnecting.set('twitch', false);
        this.scheduleReconnect('twitch', config);
      });

      this.isConnecting.set('twitch', false);
    } catch (error) {
      console.error('[Twitch] Connection error:', error);
      this.connectionStatus.set('twitch', 'error');
      this.isConnecting.set('twitch', false);
      this.scheduleReconnect('twitch', config);
    }
  }

  private async connectTikTok(config: PlatformConfig) {
    if (this.isConnecting.get('tiktok')) {
      console.log('[TikTok] Already connecting...');
      return;
    }

    this.isConnecting.set('tiktok', true);
    this.connectionStatus.set('tiktok', 'connecting');

    try {
      console.log('[TikTok] Connecting to TikTok Live chat...');

      console.log('[TikTok] Note: TikTok Live WebSocket connection requires official API access');
      console.log('[TikTok] Using mock connection for demonstration purposes');

      this.connectionStatus.set('tiktok', 'connected');
      this.reconnectAttempts.set('tiktok', 0);
      this.emit('platform-connected', 'tiktok');
      this.isConnecting.set('tiktok', false);

    } catch (error) {
      console.error('[TikTok] Connection error:', error);
      this.connectionStatus.set('tiktok', 'error');
      this.isConnecting.set('tiktok', false);
      this.scheduleReconnect('tiktok', config);
    }
  }

  private handleKickMessage(data: any) {
    try {
      const message: ChatMessage = {
        id: `kick-${data.id || Date.now()}`,
        username: data.sender?.username || 'Anonymous',
        message: data.content || '',
        platform: 'kick',
        timestamp: new Date(),
        userAvatar: data.sender?.identity?.badges?.[0]?.image_url,
        badges: data.sender?.identity?.badges?.map((b: any) => b.type) || [],
        color: data.sender?.identity?.color,
      };

      this.addMessage(message);
    } catch (error) {
      console.error('[Kick] Error handling message:', error);
    }
  }

  private handleTwitchMessage(rawMessage: string) {
    try {
      const parts = rawMessage.split('PRIVMSG');
      if (parts.length < 2) return;

      const tagsPart = parts[0];
      const messagePart = parts[1];

      const tags: Record<string, string> = {};
      const tagPattern = /([^=;]+)=([^;]*)/g;
      let match;
      while ((match = tagPattern.exec(tagsPart)) !== null) {
        tags[match[1]] = match[2];
      }

      const userMatch = messagePart.match(/#\w+ :(.+)/);
      const usernameMatch = rawMessage.match(/:(\w+)!.+PRIVMSG/);

      if (userMatch && usernameMatch) {
        const message: ChatMessage = {
          id: `twitch-${tags['id'] || Date.now()}`,
          username: tags['display-name'] || usernameMatch[1] || 'Anonymous',
          message: userMatch[1],
          platform: 'twitch',
          timestamp: new Date(),
          color: tags['color'] || '#9147FF',
          badges: tags['badges']?.split(',') || [],
        };

        this.addMessage(message);
      }
    } catch (error) {
      console.error('[Twitch] Error handling message:', error);
    }
  }

  private addMessage(message: ChatMessage) {
    this.messageBuffer.unshift(message);

    if (this.messageBuffer.length > this.maxBufferSize) {
      this.messageBuffer = this.messageBuffer.slice(0, this.maxBufferSize);
    }

    console.log(`[${message.platform.toUpperCase()}] ${message.username}: ${message.message}`);

    this.emit('message', message);
  }

  private scheduleReconnect(platform: string, config: PlatformConfig) {
    const attempts = this.reconnectAttempts.get(platform) || 0;

    if (attempts >= this.maxReconnectAttempts) {
      console.error(`[${platform.toUpperCase()}] Max reconnect attempts reached. Giving up.`);
      return;
    }

    const existingTimer = this.reconnectTimers.get(platform);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
    console.log(`[${platform.toUpperCase()}] Scheduling reconnect in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);

    const timer = setTimeout(() => {
      this.reconnectAttempts.set(platform, attempts + 1);

      switch (platform) {
        case 'kick':
          this.connectKick(config);
          break;
        case 'twitch':
          this.connectTwitch(config);
          break;
        case 'tiktok':
          this.connectTikTok(config);
          break;
      }
    }, delay);

    this.reconnectTimers.set(platform, timer);
  }

  getRecentMessages(limit: number = 50): ChatMessage[] {
    return this.messageBuffer.slice(0, limit);
  }

  getConnectionStatus() {
    return {
      kick: this.connectionStatus.get('kick') || 'disconnected',
      twitch: this.connectionStatus.get('twitch') || 'disconnected',
      tiktok: this.connectionStatus.get('tiktok') || 'disconnected',
    };
  }

  async disconnect() {
    console.log('[ChatAggregator] Disconnecting all platforms...');

    this.reconnectTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.reconnectTimers.clear();

    if (this.kickWs) {
      this.kickWs.close();
      this.kickWs = null;
    }

    if (this.twitchWs) {
      this.twitchWs.close();
      this.twitchWs = null;
    }

    if (this.tiktokWs) {
      this.tiktokWs.close();
      this.tiktokWs = null;
    }

    this.connectionStatus.set('kick', 'disconnected');
    this.connectionStatus.set('twitch', 'disconnected');
    this.connectionStatus.set('tiktok', 'disconnected');
  }

  injectTestMessage(platform: 'kick' | 'twitch' | 'tiktok', username: string, message: string) {
    const testMessage: ChatMessage = {
      id: `${platform}-test-${Date.now()}`,
      username,
      message,
      platform,
      timestamp: new Date(),
      color: platform === 'kick' ? '#00FF00' : platform === 'twitch' ? '#9147FF' : '#FF0050',
    };

    this.addMessage(testMessage);
  }
}

export const chatAggregator = new ChatAggregatorService();
