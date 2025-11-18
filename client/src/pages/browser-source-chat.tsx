import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiKick, SiTwitch, SiTiktok } from 'react-icons/si';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  platform: 'kick' | 'twitch' | 'tiktok';
  timestamp: Date;
  userAvatar?: string;
  badges?: string[];
  color?: string;
}

interface PlatformStatus {
  kick: 'connected' | 'disconnected' | 'connecting' | 'error';
  twitch: 'connected' | 'disconnected' | 'connecting' | 'error';
  tiktok: 'connected' | 'disconnected' | 'connecting' | 'error';
}

const PlatformIcon = ({ platform, status }: { platform: 'kick' | 'twitch' | 'tiktok'; status: string }) => {
  const iconClass = `w-5 h-5 ${status === 'connected' ? 'opacity-100' : 'opacity-40'}`;

  switch (platform) {
    case 'kick':
      return <SiKick className={iconClass} style={{ color: '#53FC18' }} />;
    case 'twitch':
      return <SiTwitch className={iconClass} style={{ color: '#9147FF' }} />;
    case 'tiktok':
      return <SiTiktok className={iconClass} style={{ color: '#FF0050' }} />;
  }
};

const ChatMessageComponent = ({ message }: { message: ChatMessage }) => {
  const platformColors = {
    kick: 'border-l-green-500',
    twitch: 'border-l-purple-500',
    tiktok: 'border-l-pink-500'
  };

  const platformBg = {
    kick: 'bg-green-500/10',
    twitch: 'bg-purple-500/10',
    tiktok: 'bg-pink-500/10'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex items-start gap-3 p-3 mb-2 rounded-lg border-l-4 ${platformColors[message.platform]} ${platformBg[message.platform]} backdrop-blur-sm bg-gray-900/80`}
    >
      <div className="flex-shrink-0 mt-1">
        <PlatformIcon platform={message.platform} status="connected" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span
            className="font-bold text-sm truncate"
            style={{ color: message.color || '#FFFFFF' }}
          >
            {message.username}
          </span>
          {message.badges && message.badges.length > 0 && (
            <div className="flex gap-1">
              {message.badges.slice(0, 3).map((badge, idx) => (
                <span
                  key={idx}
                  className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
        <p className="text-white text-sm leading-relaxed break-words">
          {message.message}
        </p>
      </div>
    </motion.div>
  );
};

export default function BrowserSourceChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus>({
    kick: 'disconnected',
    twitch: 'disconnected',
    tiktok: 'disconnected'
  });
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxMessages = 8;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

    console.log('[BrowserSource] Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[BrowserSource] WebSocket connected');
      setIsConnected(true);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'message') {
          const newMessage = {
            ...data.message,
            timestamp: new Date(data.message.timestamp)
          };

          setMessages((prev) => {
            const updated = [newMessage, ...prev];
            return updated.slice(0, maxMessages);
          });
        } else if (data.type === 'history') {
          const historyMessages = data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(historyMessages.slice(0, maxMessages));
        } else if (data.type === 'status') {
          setPlatformStatus(data.status);
        }
      } catch (error) {
        console.error('[BrowserSource] Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[BrowserSource] WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('[BrowserSource] WebSocket disconnected');
      setIsConnected(false);
      wsRef.current = null;

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[BrowserSource] Attempting to reconnect...');
        connectWebSocket();
      }, 3000);
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden bg-transparent">
      <div className="max-w-2xl mx-auto h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-3 px-3 py-2 bg-gray-900/60 backdrop-blur-sm rounded-lg border border-purple-500/20">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-300 font-medium">
              {isConnected ? 'Live Chat' : 'Connecting...'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <PlatformIcon platform="kick" status={platformStatus.kick} />
            <PlatformIcon platform="twitch" status={platformStatus.twitch} />
            <PlatformIcon platform="tiktok" status={platformStatus.tiktok} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center text-gray-500">
                  <p className="text-sm">Waiting for messages...</p>
                  <p className="text-xs mt-2">Messages from Kick, Twitch, and TikTok will appear here</p>
                </div>
              </motion.div>
            ) : (
              messages.map((message) => (
                <ChatMessageComponent key={message.id} message={message} />
              ))
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </div>
  );
}
