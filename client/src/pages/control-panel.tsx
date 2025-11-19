import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Volume2, VolumeX, Play, Pause, Loader2, Sparkles, BookOpen, MessageSquare, Clock, Link as LinkIcon, Send } from "lucide-react";
import { Link } from "wouter";
import { fetchCharacters, toggleCharacterActive, createEpisode, generatePreshowPrep, fetchPreshowPrep, fetchEpisodes } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Character, PreshowPrep, Episode } from "@shared/schema";

import zeroAvatar from "@assets/generated_images/Zero_wise_director_portrait_435ea3ff.png";
import m7Avatar from "@assets/generated_images/M7_skeptic_portrait_1a9bec4a.png";
import synqAvatar from "@assets/generated_images/Synq_healer_portrait_98fc9eec.png";
import fluxAvatar from "@assets/generated_images/Flux_conspiracy_hunter_portrait_f8ccb042.png";
import vibeAvatar from "@assets/generated_images/Vibe_motivation_portrait_ae027adf.png";
import echoPulseAvatar from "@assets/generated_images/EchoPulse_news_oracle_portrait_72673636.png";
import linkAvatar from "@assets/generated_images/Link_scripture_monk_portrait_230035c2.png";
import ledgeAvatar from "@assets/generated_images/Ledge_wealth_architect_portrait_2e555de5.png";
import dripAvatar from "@assets/generated_images/Drip_style_icon_portrait_d6f58477.png";
import horizonAvatar from "@assets/generated_images/Horizon_future_prophet_portrait_90635f7d.png";
import heroImage from "@assets/generated_images/cosmic_spiritual_hero_background_08afb362.png";

const avatarMap: Record<string, string> = {
  zero: zeroAvatar,
  m7: m7Avatar,
  synq: synqAvatar,
  flux: fluxAvatar,
  vibe: vibeAvatar,
  echopulse: echoPulseAvatar,
  link: linkAvatar,
  ledge: ledgeAvatar,
  drip: dripAvatar,
  horizon: horizonAvatar,
};

export default function ControlPanel() {
  const { toast } = useToast();
  const [debateHeat, setDebateHeat] = useState([50]);
  const [theme, setTheme] = useState("");
  const [episodeStatus, setEpisodeStatus] = useState<"draft" | "live" | "paused">("draft");
  const [mutedCharacters, setMutedCharacters] = useState<Set<string>>(new Set());
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Chat Injection State
  const [chatUsername, setChatUsername] = useState("StreamUser");
  const [chatMessage, setChatMessage] = useState("");
  const [chatPlatform, setChatPlatform] = useState<"kick" | "twitch" | "tiktok">("kick");

  const { data: characters = [], isLoading: loadingCharacters } = useQuery({
    queryKey: ["/api/characters"],
    queryFn: fetchCharacters,
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ["/api/episodes"],
    queryFn: fetchEpisodes,
  });

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      toast({
        title: "Time's Up!",
        description: "10-minute episode limit reached.",
        variant: "destructive",
      });
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleCharacterActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters/active"] });
      toast({
        title: "Character Updated",
        description: "Character status changed successfully",
      });
    },
  });

  const createEpisodeMutation = useMutation({
    mutationFn: (data: { title: string; theme: string; participants: string[] }) =>
      createEpisode(data),
    onSuccess: (episode) => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      setCurrentEpisodeId(episode.id);
      toast({
        title: "Episode Created",
        description: "New episode started successfully",
      });
      setEpisodeStatus("live");
      setIsTimerRunning(true);
      setTimeLeft(600); // Reset to 10 mins
    },
  });

  const generatePrepMutation = useMutation({
    mutationFn: (data: { episodeId: string; theme: string }) =>
      generatePreshowPrep(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preshow", currentEpisodeId] });
      toast({
        title: "Prep Generated",
        description: "Zero has prepared your episode questions",
      });
    },
  });

  const chatInjectionMutation = useMutation({
    mutationFn: async (data: { platform: string; username: string; message: string }) => {
      const res = await fetch("/api/chat/test-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      setChatMessage("");
      toast({
        title: "Message Sent",
        description: "Chat message injected successfully",
      });
    },
  });

  const { data: prep, isLoading: loadingPrep } = useQuery({
    queryKey: ["/api/preshow", currentEpisodeId],
    queryFn: () => currentEpisodeId ? fetchPreshowPrep(currentEpisodeId) : Promise.resolve(null),
    enabled: !!currentEpisodeId,
  });

  const handleToggleCharacter = (char: Character) => {
    toggleMutation.mutate({ id: char.id, isActive: !char.isActive });
  };

  const handleStartEpisode = () => {
    if (!theme.trim()) {
      toast({ title: "Theme Required", description: "Please enter an episode theme", variant: "destructive" });
      return;
    }
    const activeCharIds = characters.filter(c => c.isActive).map(c => c.id);
    createEpisodeMutation.mutate({
      title: `Episode: ${theme}`,
      theme: theme,
      participants: ["david", ...activeCharIds],
    });
  };

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    chatInjectionMutation.mutate({
      platform: chatPlatform,
      username: chatUsername,
      message: chatMessage,
    });
  };

  if (loadingCharacters) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = characters.filter(c => c.isActive).length;

  return (
    <div
      className="min-h-screen bg-black p-6 text-white overflow-x-hidden"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(10,10,20,0.95)), url(${heroImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between backdrop-blur-md bg-black/30 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-4">
            <Link href="/studio">
              <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white">
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                Host Control Panel
              </h1>
              <p className="text-white/60 text-sm">Direct the divine conversation</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Timer Display */}
            <div className={`flex items-center gap-3 px-6 py-3 rounded-xl border ${timeLeft < 60 ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-black/40 border-white/10'}`}>
              <Clock className={`w-5 h-5 ${timeLeft < 60 ? 'text-red-400' : 'text-blue-400'}`} />
              <span className="text-2xl font-mono font-bold tracking-wider">
                {formatTime(timeLeft)}
              </span>
            </div>

            <Badge variant="outline" className={`text-lg px-4 py-2 ${episodeStatus === 'live' ? 'bg-red-500/20 text-red-200 border-red-500/50' : 'bg-white/5'}`}>
              {episodeStatus === "live" && "🔴 LIVE"}
              {episodeStatus === "paused" && "⏸️ PAUSED"}
              {episodeStatus === "draft" && "📝 DRAFT"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Controls (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Episode Control */}
            <Card className="bg-black/60 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Episode Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white/80">Episode Theme</Label>
                  <Input
                    placeholder="e.g., 'The Nature of Divine Consciousness'"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleStartEpisode}
                    disabled={createEpisodeMutation.isPending || episodeStatus === "live"}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-none"
                  >
                    {createEpisodeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : episodeStatus === "live" ? (
                      "Episode Active"
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start (10m)
                      </>
                    )}
                  </Button>
                  {episodeStatus === "live" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEpisodeStatus("paused");
                        setIsTimerRunning(false);
                      }}
                      className="border-white/20 hover:bg-white/10 text-white"
                    >
                      <Pause className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat Injection */}
            <Card className="bg-black/60 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  Live Chat Injection
                </CardTitle>
                <CardDescription className="text-white/50">
                  Manually send messages to AI if stream connection is delayed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-white/60">Platform</Label>
                    <Select value={chatPlatform} onValueChange={(v: any) => setChatPlatform(v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kick">Kick</SelectItem>
                        <SelectItem value="twitch">Twitch</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-white/60">Username</Label>
                    <Input
                      value={chatUsername}
                      onChange={(e) => setChatUsername(e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-white/60">Message</Label>
                  <div className="flex gap-2">
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="bg-white/5 border-white/10 text-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    />
                    <Button
                      size="icon"
                      onClick={handleSendChat}
                      disabled={chatInjectionMutation.isPending || !chatMessage.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>Browser Source URL:</span>
                    <Link href="/browser-source-chat" target="_blank" className="flex items-center gap-1 text-blue-400 hover:underline">
                      Open Overlay <LinkIcon className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column: Cast (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-black/60 backdrop-blur-xl border-white/10 shadow-2xl h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>AI Cast</span>
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {activeCount} Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {characters.map((char) => (
                      <div
                        key={char.id}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${char.isActive ? 'bg-white/10 border border-white/20' : 'bg-white/5 border border-transparent opacity-60'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div
                              className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-black"
                              style={{
                                "--tw-ring-color": char.auraColor,
                                boxShadow: char.isActive ? `0 0 15px ${char.auraColor}60` : 'none',
                              } as React.CSSProperties}
                            >
                              <img
                                src={avatarMap[char.id]}
                                alt={char.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {char.isActive && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-bold">{char.name}</p>
                            <p className="text-white/50 text-xs">{char.role}</p>
                          </div>
                        </div>

                        <Switch
                          checked={char.isActive}
                          onCheckedChange={() => handleToggleCharacter(char)}
                          disabled={toggleMutation.isPending}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Prep & Knowledge (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="bg-black/60 backdrop-blur-xl border-white/10 shadow-2xl h-full">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  Zero Prep
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => currentEpisodeId && generatePrepMutation.mutate({ episodeId: currentEpisodeId, theme })}
                  disabled={generatePrepMutation.isPending || !currentEpisodeId}
                  variant="outline"
                  className="w-full border-white/20 hover:bg-white/10 text-white"
                >
                  {generatePrepMutation.isPending ? "Generating..." : "Generate Prep Sheet"}
                </Button>

                {prep && (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Questions</h3>
                        {((prep.hostQuestions as any[]) || []).map((q: any, i: number) => (
                          <div key={i} className="bg-white/5 p-3 rounded-lg text-sm text-white/80 border-l-2 border-blue-500">
                            {q.question}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Structure</h3>
                        {((prep.segmentStructure as any)?.acts || []).map((act: any, i: number) => (
                          <div key={i} className="bg-white/5 p-3 rounded-lg text-sm text-white/80">
                            <div className="flex justify-between mb-1">
                              <span className="font-bold text-blue-300">{act.name}</span>
                              <span className="text-white/40 text-xs">{act.duration}</span>
                            </div>
                            <p className="text-xs text-white/60">{act.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
