import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Settings, ChevronLeft, Loader2, Send, Sparkles, PanelLeftClose, PanelRightClose } from "lucide-react";
import { Link } from "wouter";
import {
  fetchActiveCharacters,
  fetchEpisodes,
  fetchEpisodeTurns,
  addConversationTurn,
  routeNextSpeaker,
  generateAIResponse
} from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Turn } from "@shared/schema";

// New Components
import { ChatMonitorPanel } from "@/components/studio/ChatMonitorPanel";
import { QuickActions } from "@/components/studio/QuickActions";
import { MessageTemplates } from "@/components/studio/MessageTemplates";
import { AICoPilotPanel } from "@/components/studio/AICoPilotPanel";
import { PersonalityControls } from "@/components/studio/PersonalityControls";
import { DirectorMode } from "@/components/studio/DirectorMode";
import { PollManager } from "@/components/studio/PollManager";
import { ClipManager } from "@/components/studio/ClipManager";
import { ShowOutline } from "@/components/studio/ShowOutline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import marcusAvatar from "@/assets/generated_images/Marcus_wise_director_portrait_sv5sm1qh.png";
import elenaAvatar from "@/assets/generated_images/Elena_skeptic_portrait_gafo9wcq.png";
import sophiaAvatar from "@/assets/generated_images/Sophia_healer_portrait_yse29t2p.png";
import jamesAvatar from "@/assets/generated_images/James_conspiracy_hunter_portrait_pilvs1nt.png";
import destinyAvatar from "@/assets/generated_images/Destiny_motivation_portrait_87d4qztu.png";
import nathanAvatar from "@/assets/generated_images/Nathan_news_oracle_portrait_a3z0k1xg.png";
import rachelAvatar from "@/assets/generated_images/Rachel_scripture_monk_portrait_e0w6jn7e.png";
import victorAvatar from "@/assets/generated_images/Victor_wealth_architect_portrait_fx52jxr2.png";
import mayaAvatar from "@/assets/generated_images/Maya_style_icon_portrait_mekhvuyi.png";
import isaacAvatar from "@/assets/generated_images/Isaac_future_prophet_portrait_tjnkph47.png";

const avatarMap: Record<string, string> = {
  marcus: marcusAvatar,
  elena: elenaAvatar,
  sophia: sophiaAvatar,
  james: jamesAvatar,
  destiny: destinyAvatar,
  nathan: nathanAvatar,
  rachel: rachelAvatar,
  victor: victorAvatar,
  maya: mayaAvatar,
  isaac: isaacAvatar,
};

export default function Studio() {
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [routerReasoning, setRouterReasoning] = useState<string | null>(null);
  const [isAiPaused, setIsAiPaused] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Timer effect
  useEffect(() => {
    // In a real app, fetch start time from server to sync
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: activeCharacters = [], isLoading: loadingCharacters } = useQuery({
    queryKey: ["/api/characters/active"],
    queryFn: fetchActiveCharacters,
    refetchInterval: 5000,
  });

  const { data: episodes = [], isLoading: loadingEpisodes } = useQuery({
    queryKey: ["/api/episodes"],
    queryFn: fetchEpisodes,
  });

  const currentEpisode = episodes[0];

  const { data: turns = [], isLoading: loadingTurns } = useQuery({
    queryKey: ["/api/episodes", currentEpisode?.id, "turns"],
    queryFn: () => currentEpisode ? fetchEpisodeTurns(currentEpisode.id) : Promise.resolve([]),
    enabled: !!currentEpisode,
    refetchInterval: 3000,
  });

  // Calculate stats for Co-Pilot
  const episodeStats = {
    davidTurns: 0,
    aiTurns: 0,
    duration: "00:00",
    currentPacing: "Moderate"
  };

  if (turns.length > 0) {
    const davidCount = turns.filter(t => t.speaker === "david").length;
    const total = turns.length;
    episodeStats.davidTurns = Math.round((davidCount / total) * 100);
    episodeStats.aiTurns = 100 - episodeStats.davidTurns;
    
    // Simple duration estimation (diff between first and last turn)
    const start = new Date(turns[0].timestamp).getTime();
    const end = new Date(turns[turns.length-1].timestamp).getTime();
    const diffMins = Math.floor((end - start) / 60000);
    episodeStats.duration = `${diffMins} min`;
  }

  const sendMessageMutation = useMutation({
    mutationFn: (text: string) => {
      if (!currentEpisode) {
        throw new Error("No active episode");
      }
      return addConversationTurn({
        episodeId: currentEpisode.id,
        speaker: "david",
        text,
        type: "host",
      });
    },
    onSuccess: () => {
      if (currentEpisode) {
        queryClient.invalidateQueries({ queryKey: ["/api/episodes", currentEpisode.id, "turns"] });
      }
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const generateNextAITurn = async () => {
    if (!currentEpisode || isGenerating || isAiPaused) return;

    setIsGenerating(true);
    setRouterReasoning(null);
    try {
      const decision = await routeNextSpeaker({
        episodeId: currentEpisode.id,
        theme: currentEpisode.theme,
        debateHeat: 50,
      });

      const speakerName = decision.nextSpeaker === "david"
        ? "David"
        : activeCharacters.find(c => c.id === decision.nextSpeaker)?.name || decision.nextSpeaker;

      setRouterReasoning(`Marcus selected ${speakerName} to ${decision.intent}: ${decision.reasoning}`);

      await generateAIResponse({
        characterId: decision.nextSpeaker,
        episodeId: currentEpisode.id,
        routerIntent: decision.intent,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/episodes", currentEpisode.id, "turns"] });

      toast({
        title: "AI Response Generated",
        description: `${speakerName} has responded`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI response",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    if (!currentEpisode) {
      toast({
        title: "No Active Episode",
        description: "Please create an episode first",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate(message);
  };

  // Actions Handler
  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case "toggle_pause":
        setIsAiPaused(!isAiPaused);
        toast({ title: isAiPaused ? "AI Resumed" : "AI Paused" });
        break;
      case "target_next":
        toast({ title: "Targeting Mode", description: "Select next speaker (Coming soon)" });
        break;
      case "take_break":
        sendMessageMutation.mutate("**ANNOUNCEMENT:** We are taking a short 5-minute break. Stay tuned!");
        break;
      case "quote_scripture":
        setMessage(prev => prev + " As it is written in John 8:58...");
        break;
      default:
        toast({ title: "Action Triggered", description: actionId });
    }
  };

  // Audio playback
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const lastPlayedTurnIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (turns.length > 0) {
      const lastTurn = turns[turns.length - 1];
      if (lastTurn.id !== lastPlayedTurnIdRef.current && lastTurn.metadata && (lastTurn.metadata as any).audioUrl) {
        const audioUrl = (lastTurn.metadata as any).audioUrl;
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play().catch(e => console.error("Audio play failed:", e));
          setIsPlaying(true);
          lastPlayedTurnIdRef.current = lastTurn.id;
        }
      }
    }
  }, [turns]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length]);

  if (loadingCharacters || loadingEpisodes) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-indigo-950 to-purple-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentEpisode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">No Active Episode</h2>
          <p className="text-muted-foreground mb-6">Create an episode from the Control Panel.</p>
          <Link href="/control"><Button><Settings className="mr-2 h-4 w-4" /> Go to Control Panel</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-bold flex items-center gap-2">
              Studio Pro <Badge variant="outline" className="text-[10px] h-4 px-1">BETA</Badge>
            </h1>
            <p className="text-xs text-muted-foreground truncate max-w-[300px]">{currentEpisode.theme}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setShowLeftPanel(!showLeftPanel)}
          >
            <PanelLeftClose className={`h-4 w-4 ${!showLeftPanel && "rotate-180"}`} />
          </Button>
          <Button 
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setShowRightPanel(!showRightPanel)}
          >
            <PanelRightClose className={`h-4 w-4 ${!showRightPanel && "rotate-180"}`} />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            LIVE
          </Badge>
          <Link href="/control">
            <Button variant="ghost" size="icon" className="h-8 w-8"><Settings className="h-4 w-4" /></Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Co-Pilot */}
        {showLeftPanel && (
          <div className="w-64 shrink-0 border-r border-border hidden md:block">
            <AICoPilotPanel 
              episodeStats={episodeStats}
              suggestions={[
                "Consider asking Elena about her skeptical view.",
                "Pacing is good, but maybe pause for a break soon.",
                "Viewers are asking about the 'I AM' concept."
              ]}
            />
          </div>
        )}

        {/* Center Panel: Conversation */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Router Reasoning */}
          {routerReasoning && (
            <div className="px-4 py-2 bg-primary/5 border-b border-primary/10 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-primary shrink-0" />
              <p className="text-xs text-primary truncate">{routerReasoning}</p>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {turns.map((turn) => {
                const isHost = turn.speaker === "david";
                const character = activeCharacters.find(c => c.id === turn.speaker);
                const displayName = isHost ? "David Trinidad" : character?.name || turn.speaker;
                const avatarUrl = turn.speaker !== "david" ? avatarMap[turn.speaker] : null;

                return (
                  <div key={turn.id} className={`flex gap-3 ${isHost ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover border ring-1 ring-border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary border ring-1 ring-border">DT</div>
                      )}
                    </div>
                    <div className={`flex-1 max-w-xl ${isHost ? "text-right" : "text-left"}`}>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold opacity-70">{displayName}</span>
                        <span className="text-[10px] text-muted-foreground opacity-50">{new Date(turn.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className={`inline-block px-4 py-2 rounded-2xl text-sm ${isHost ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border rounded-tl-sm"}`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{turn.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input & Controls */}
          <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Quick Actions Bar */}
            <QuickActions onAction={handleQuickAction} isAiPaused={isAiPaused} />
            
            <div className="p-4 max-w-4xl mx-auto w-full space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageTemplates onSelect={(text) => setMessage(text)} />
                <div className="flex-1" />
                {!isAiPaused && (
                  <Button
                    onClick={generateNextAITurn}
                    disabled={isGenerating}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {isGenerating ? "Thinking..." : "Generate AI"}
                  </Button>
                )}
              </div>
              
              <div className="relative flex gap-2">
                <Textarea
                  placeholder="Enter message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[50px] resize-none pr-12"
                  rows={2}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  size="icon"
                  className="absolute right-2 bottom-2 h-8 w-8"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Tools & Participants */}
        {showRightPanel && (
          <div className="w-80 shrink-0 border-l border-border flex flex-col hidden lg:flex bg-card/10">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <div className="px-2 pt-2">
                <TabsList className="w-full grid grid-cols-7 h-8">
                  <TabsTrigger value="chat" className="text-xs px-0" title="Chat Monitor">Chat</TabsTrigger>
                  <TabsTrigger value="polls" className="text-xs px-0" title="Polls">Poll</TabsTrigger>
                  <TabsTrigger value="clips" className="text-xs px-0" title="Clips">Clip</TabsTrigger>
                  <TabsTrigger value="outline" className="text-xs px-0" title="Outline">Plan</TabsTrigger>
                  <TabsTrigger value="people" className="text-xs px-0" title="Participants">Ppl</TabsTrigger>
                  <TabsTrigger value="director" className="text-xs px-0" title="Director Mode">Dir</TabsTrigger>
                  <TabsTrigger value="tuner" className="text-xs px-0" title="Personality Tuner">Tune</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="chat" className="flex-1 overflow-hidden mt-0 border-none data-[state=active]:flex flex-col">
                <ChatMonitorPanel onAddressAlert={(text) => setMessage(prev => prev + " " + text)} />
              </TabsContent>

              <TabsContent value="polls" className="flex-1 overflow-hidden mt-0 border-none data-[state=active]:flex flex-col">
                <PollManager episodeId={currentEpisode.id} />
              </TabsContent>

              <TabsContent value="clips" className="flex-1 overflow-hidden mt-0 border-none data-[state=active]:flex flex-col">
                <ClipManager episodeId={currentEpisode.id} elapsedSeconds={elapsedSeconds} />
              </TabsContent>

              <TabsContent value="outline" className="flex-1 overflow-hidden mt-0 border-none data-[state=active]:flex flex-col">
                <ShowOutline episodeId={currentEpisode.id} theme={currentEpisode.theme} />
              </TabsContent>

              <TabsContent value="people" className="flex-1 overflow-hidden mt-0 border-none data-[state=active]:flex flex-col">
                <div className="p-3 border-b border-border bg-card/30">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Participants</h3>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-2">
                     <div className="flex items-center gap-2 p-2 rounded hover:bg-card/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">DT</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">David Trinidad</p>
                        <p className="text-xs text-muted-foreground">Host</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto text-[10px] h-5">Host</Badge>
                    </div>
                    
                    {activeCharacters.map((character) => (
                      <div key={character.id} className="flex items-center gap-2 p-2 rounded hover:bg-card/50 transition-colors">
                        <img src={avatarMap[character.id]} alt={character.name} className="w-8 h-8 rounded-full object-cover" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{character.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{character.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="director" className="flex-1 overflow-hidden mt-0 border-none data-[state=active]:flex flex-col">
                <DirectorMode 
                  activeCharacters={activeCharacters} 
                  onExecutePlan={() => toast({ title: "Director Mode", description: "Sequence executed (Simulated)" })} 
                />
              </TabsContent>

              <TabsContent value="tuner" className="flex-1 overflow-hidden mt-0 border-none data-[state=active]:flex flex-col">
                <PersonalityControls activeCharacters={activeCharacters} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
