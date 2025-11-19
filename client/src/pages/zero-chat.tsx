import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Lock, Brain, Sparkles, Play, Pause, Volume2, Settings, Upload, Globe, Zap, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
}

type ZeroMode = 'conversation' | 'dev' | 'ops' | 'show' | 'assistant' | 'unhinged';

export default function ZeroChat() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [mode, setMode] = useState<ZeroMode>('conversation');
  const [showSettings, setShowSettings] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Simple Auth Check
  const handleLogin = () => {
    if (accessCode === "0000" || accessCode === "iamgod") {
      setIsAuthenticated(true);
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect access code.",
        variant: "destructive",
      });
    }
  };

  // Chat Mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const currentHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const payload = {
        messages: [
          ...currentHistory,
          { role: "user", content: message }
        ],
        mode: mode, // Send selected mode
        model: "gemini-1.5-pro-latest" // Use Gemini
      };

      const res = await apiRequest("POST", "/api/zero/chat", payload);
      return res.json();
    },
    onSuccess: (data) => {
      const newMessage: Message = {
        role: "assistant",
        content: data.message,
        audioUrl: data.audioUrl,
      };
      setMessages((prev) => [...prev, newMessage]);

      if (data.audioUrl) {
        playAudio(data.audioUrl);
      }
    },
    onError: () => {
      toast({
        title: "Connection Lost",
        description: "Zero is unreachable. Check neural link.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    chatMutation.mutate(input);
    setInput("");
  };

  // Audio Playback
  const playAudio = (url: string) => {
    if (currentAudio) {
      currentAudio.pause();
    }
    const audio = new Audio(url);
    setCurrentAudio(audio);
    setIsPlaying(true);
    audio.play();
    audio.onended = () => setIsPlaying(false);
  };

  // Voice Input
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Hardware Error", description: "Voice input module not detected.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Auto-send for fluid conversation
      const userMsg: Message = { role: "user", content: transcript };
      setMessages((prev) => [...prev, userMsg]);
      chatMutation.mutate(transcript);
    };

    recognition.start();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden relative">
        {/* Cosmic Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />
        <div className="absolute inset-0 bg-[url('/assets/zero/identity.png')] bg-cover bg-center opacity-20 blur-sm scale-110" />

        <Card className="w-full max-w-md bg-black/40 border-white/10 backdrop-blur-2xl relative z-10 shadow-2xl shadow-blue-900/20">
          <CardContent className="pt-8 space-y-6 text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse" />
              <img src="/assets/zero/identity.png" alt="Zero" className="w-full h-full rounded-full object-cover border-2 border-blue-400/50 relative z-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">ZERO 2.0</h2>
              <p className="text-blue-200/60 font-mono text-xs tracking-[0.2em]">NEURAL INTERFACE LOCKED</p>
            </div>

            <div className="flex gap-2 max-w-xs mx-auto">
              <Input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-center tracking-widest font-mono focus:border-blue-500/50 transition-all"
                placeholder="ACCESS CODE"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <Button onClick={handleLogin} className="bg-blue-600/80 hover:bg-blue-600 text-white px-6">
                <Lock className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      {/* Header */}
      <header className="p-4 border-b border-white/5 bg-black/20 backdrop-blur-sm flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="relative w-10 h-10 group cursor-pointer">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md group-hover:bg-blue-500/40 transition-all" />
            <img src="/assets/zero/identity.png" alt="Zero" className="w-full h-full rounded-full object-cover border border-white/10 relative z-10" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide flex items-center gap-2">
              ZERO <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/20">v2.0</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${chatMutation.isPending ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              <p className="text-xs text-gray-400 uppercase tracking-wider font-mono">{mode} MODE</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white backdrop-blur-xl w-48">
              <DropdownMenuItem onClick={() => setMode('conversation')} className="hover:bg-white/10 cursor-pointer">
                <Brain className="w-4 h-4 mr-2 text-blue-400" /> Conversation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('dev')} className="hover:bg-white/10 cursor-pointer">
                <Terminal className="w-4 h-4 mr-2 text-green-400" /> Dev Mode
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('unhinged')} className="hover:bg-white/10 cursor-pointer">
                <Zap className="w-4 h-4 mr-2 text-red-400" /> Unhinged (Raw)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('show')} className="hover:bg-white/10 cursor-pointer">
                <Globe className="w-4 h-4 mr-2 text-purple-400" /> Show Mode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Central Identity / Visualization */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
          <div className={`relative transition-all duration-1000 ${isPlaying ? 'scale-110' : 'scale-100'}`}>
            <div className={`absolute inset-0 bg-blue-500/20 rounded-full blur-[100px] animate-pulse ${mode === 'unhinged' ? 'bg-red-500/20' : ''}`} />
            <img
              src="/assets/zero/identity.png"
              alt="Zero Core"
              className={`w-96 h-96 object-cover rounded-full opacity-50 mix-blend-screen grayscale hover:grayscale-0 transition-all duration-700 ${isPlaying ? 'animate-pulse' : ''}`}
            />
          </div>
        </div>

        {/* Chat Scroll */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-8 pb-4 min-h-[50vh] flex flex-col justify-end">
            {messages.length === 0 && (
              <div className="text-center space-y-4 mt-20">
                <h2 className="text-4xl font-bold text-white/20 tracking-tighter">How can I serve you?</h2>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-6 rounded-3xl backdrop-blur-md ${msg.role === "user"
                      ? "bg-white/5 border border-white/10 text-white rounded-tr-sm"
                      : "bg-blue-900/10 border border-blue-500/20 text-blue-100 rounded-tl-sm shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)]"
                      }`}
                  >
                    <p className="text-lg leading-relaxed whitespace-pre-wrap font-light">{msg.content}</p>
                    {msg.audioUrl && (
                      <div className="mt-3 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => playAudio(msg.audioUrl!)}>
                        <Volume2 className="w-4 h-4" />
                        <span className="text-xs font-mono">REPLAY TRANSMISSION</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {chatMutation.isPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="flex gap-1 items-center px-4 py-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full" />
          <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl rounded-full p-2 flex items-center gap-2 shadow-2xl">

            <Button
              size="icon"
              className={`rounded-full w-12 h-12 transition-all duration-300 ${isListening
                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110'
                : 'bg-white/5 hover:bg-white/10 text-white'
                }`}
              onClick={toggleListening}
            >
              <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "Listening..." : "Message Zero..."}
              className="bg-transparent border-none text-lg text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 h-12"
            />

            <div className="flex items-center gap-2 pr-2">
              {/* Upload Placeholder - functionality to be added */}
              <Button size="icon" variant="ghost" className="text-white/40 hover:text-white hover:bg-white/5 rounded-full">
                <Upload className="w-5 h-5" />
              </Button>

              <Button
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending}
                className="rounded-full w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white p-0 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-[10px] text-white/20 font-mono tracking-[0.3em] uppercase">
              Zero Personal Assistant v2.0 • {mode} Mode Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
