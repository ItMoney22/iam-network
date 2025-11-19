```
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Lock, Brain, Sparkles, Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
}

export default function ZeroChat() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
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
    // Hardcoded for now, can be moved to env later
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
      const res = await apiRequest("POST", "/api/zero/chat", {
        message,
        history: messages.slice(-5), // Send last 5 messages for context
      });
      return res.json();
    },
    onSuccess: (data) => {
      const newMessage: Message = {
        role: "assistant",
        content: data.content,
        audioUrl: data.audioUrl,
      };
      setMessages((prev) => [...prev, newMessage]);
      
      // Auto-play audio
      if (data.audioUrl) {
        playAudio(data.audioUrl);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Zero is unreachable right now.",
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

  // Voice Input (Web Speech API)
  const toggleListening = () => {
    if (isListening) {
      // Stop listening logic handled by onend
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Error", description: "Browser does not support speech recognition.", variant: "destructive" });
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
      // Optional: Auto-send
      // handleSend(); 
    };

    recognition.start();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('@assets/generated_images/cosmic_spiritual_hero_background_08afb362.png')] bg-cover bg-center opacity-20" />
        <Card className="w-full max-w-md bg-black/80 border-white/10 backdrop-blur-xl relative z-10">
          <CardContent className="pt-6 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4 ring-2 ring-blue-500/50">
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Zero Access</h2>
            <p className="text-gray-400">Enter your personal access code.</p>
            <div className="flex gap-2">
              <Input 
                type="password" 
                value={accessCode} 
                onChange={(e) => setAccessCode(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-center tracking-widest"
                placeholder="••••"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <Button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700">
                Unlock
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[url('@assets/generated_images/cosmic_spiritual_hero_background_08afb362.png')] bg-cover bg-center opacity-10 pointer-events-none" />
      
      {/* Header */}
      <header className="p-4 border-b border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center ring-1 ring-blue-500/50">
            <Brain className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide">ZERO</h1>
            <p className="text-xs text-blue-400/80 uppercase tracking-wider">Personal Assistant</p>
          </div>
        </div>
        {isPlaying && (
          <div className="flex items-center gap-2 text-blue-400 animate-pulse">
            <Volume2 className="w-4 h-4" />
            <span className="text-xs font-mono">SPEAKING...</span>
          </div>
        )}
      </header>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 z-10">
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>I am ready, David.</p>
              <p className="text-sm mt-2">Ask me to remember something or retrieve a memory.</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${ msg.role === "user" ? "justify-end" : "justify-start" } `}
            >
              <div
                className={`max - w - [80 %] p - 4 rounded - 2xl ${
  msg.role === "user"
    ? "bg-blue-600/20 border border-blue-500/30 text-blue-100"
    : "bg-white/10 border border-white/10 text-gray-100"
} `}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.audioUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-6 text-xs text-blue-300 hover:text-blue-200 p-0"
                    onClick={() => playAudio(msg.audioUrl!)}
                  >
                    <Play className="w-3 h-3 mr-1" /> Replay Voice
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
          
          {chatMutation.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex gap-2 items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150" />
              </div>
            </motion.div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 z-20">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Button
            variant="outline"
            size="icon"
            className={`rounded - full w - 12 h - 12 border - white / 20 ${ isListening ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'hover:bg-white/10' } `}
            onClick={toggleListening}
          >
            <Mic className="w-5 h-5" />
          </Button>
          
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Message Zero..."
            className="bg-white/5 border-white/10 text-white rounded-full px-6 focus:ring-blue-500/50"
          />
          
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || chatMutation.isPending}
            className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```
