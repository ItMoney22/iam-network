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
  const iconClass = `w-6 h-6 drop-shadow-lg ${status === 'connected' ? 'opacity-100' : 'opacity-60 grayscale'}`;

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
  return (
    <motion.div
      initial={{ opacity: 0, x: -50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="flex items-start gap-4 mb-4 relative group"
    >
      {/* Platform Indicator Line */}
      <div
        className={`absolute left-0 top-2 bottom-2 w-1 rounded-full opacity-80 shadow-[0_0_10px_rgba(255,255,255,0.3)]`}
        style={{
          backgroundColor: message.platform === 'kick' ? '#53FC18' : message.platform === 'twitch' ? '#9147FF' : '#FF0050'
        }}
      />

      <div className="pl-4 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <PlatformIcon platform={message.platform} status="connected" />
          <span
            className="font-black text-xl tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            style={{
              color: message.color || '#FFFFFF',
              textShadow: '0 0 20px rgba(0,0,0,0.5)'
            }}
          >
            {message.username}
          </span>
          {message.badges && message.badges.length > 0 && (
            <div className="flex gap-1 ml-2">
              {message.badges.slice(0, 2).map((badge, idx) => (
                <span
                  key={idx}
                  className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/80 border border-white/20 backdrop-blur-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-black/40 blur-xl rounded-lg -z-10" />
          <p className="text-white text-2xl font-bold leading-snug drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
            {message.message}
          </p>
        </div>
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
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxMessages = 7; // Keep fewer messages for cleaner stream look

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
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
          setMessages((prev) => [newMessage, ...prev].slice(0, maxMessages));
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
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    };
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden bg-transparent p-8 flex flex-col justify-end pb-12">
      {/* Status Indicators (Only visible if disconnected or error) */}
      <div className="fixed top-4 right-4 flex gap-2 opacity-0 hover:opacity-100 transition-opacity duration-500">
        <PlatformIcon platform="kick" status={platformStatus.kick} />
        <PlatformIcon platform="twitch" status={platformStatus.twitch} />
        <PlatformIcon platform="tiktok" status={platformStatus.tiktok} />
      </div>

      <div className="w-full max-w-[600px]">
        <AnimatePresence initial={false} mode='popLayout'>
          {messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
