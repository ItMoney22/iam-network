import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Settings, ChevronLeft, Loader2, Send, Sparkles } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: activeCharacters = [], isLoading: loadingCharacters } = useQuery({
    queryKey: ["/api/characters/active"],
    queryFn: fetchActiveCharacters,
    refetchInterval: 5000, // Poll every 5 seconds for participant changes
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
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

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
    if (!currentEpisode || isGenerating) return;
    
    setIsGenerating(true);
    setRouterReasoning(null);
    try {
      // First, route to next speaker
      const decision = await routeNextSpeaker({
        episodeId: currentEpisode.id,
        theme: currentEpisode.theme,
        debateHeat: 50,
      });

      // Show router reasoning
      const speakerName = decision.nextSpeaker === "david"
        ? "David"
        : activeCharacters.find(c => c.id === decision.nextSpeaker)?.name || decision.nextSpeaker;

      setRouterReasoning(`Marcus selected ${speakerName} to ${decision.intent}: ${decision.reasoning}`);

      // Then generate their response
      await generateAIResponse({
        characterId: decision.nextSpeaker,
        episodeId: currentEpisode.id,
        routerIntent: decision.intent,
      });

      // Refresh turns
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length]); // Only scroll when message count changes

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
          <p className="text-muted-foreground mb-6">
            Create an episode from the Control Panel to start a conversation.
          </p>
          <Link href="/control">
            <Button>
              <Settings className="mr-2 h-4 w-4" />
              Go to Control Panel
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold" data-testid="text-studio-title">The Studio</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-episode-theme">{currentEpisode.theme}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30" data-testid="badge-live">
              <span className="mr-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
              LIVE
            </Badge>
            <Link href="/control">
              <Button variant="outline" data-testid="button-control-panel">
                <Settings className="mr-2 h-4 w-4" />
                Host Controls
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Conversation Area */}
        <div className="flex-1 flex flex-col">
          {/* Router Reasoning Display */}
          {routerReasoning && (
            <div className="px-6 py-3 bg-primary/10 border-b border-primary/20">
              <div className="max-w-4xl mx-auto flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-primary" data-testid="text-router-reasoning">{routerReasoning}</p>
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {loadingTurns ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : turns.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <>
                  {turns.map((turn) => {
                  const isHost = turn.speaker === "david";
                  const character = activeCharacters.find(c => c.id === turn.speaker);
                  const displayName = isHost ? "David Trinidad" : character?.name || turn.speaker;
                  const avatarUrl = turn.speaker !== "david" ? avatarMap[turn.speaker] : null;
                  
                  return (
                    <div
                      key={turn.id}
                      className={`flex gap-4 ${isHost ? "flex-row-reverse" : "flex-row"}`}
                      data-testid={`message-${turn.id}`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-10 h-10 rounded-full object-cover border-2"
                            style={{
                              borderColor: character?.auraColor || "hsl(var(--primary))",
                            }}
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2"
                            style={{
                              borderColor: "hsl(280, 70%, 65%)",
                              backgroundColor: "hsl(280, 70%, 20%)",
                            }}
                          >
                            DT
                          </div>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div className={`flex-1 max-w-2xl ${isHost ? "text-right" : "text-left"}`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className={`text-sm font-semibold ${isHost ? "order-2" : "order-1"}`}>
                            {displayName}
                          </span>
                          <span className={`text-xs text-muted-foreground ${isHost ? "order-1" : "order-2"}`}>
                            {new Date(turn.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div
                          className={`inline-block px-4 py-3 rounded-lg ${
                            isHost
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{turn.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
            <div className="max-w-4xl mx-auto space-y-3">
              {/* AI Generate Button */}
              <div className="flex justify-center">
                <Button
                  onClick={generateNextAITurn}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  data-testid="button-generate-ai"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Next AI Response
                    </>
                  )}
                </Button>
              </div>

              {/* David's Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Enter your message as David..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="resize-none"
                  rows={2}
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  size="icon"
                  className="h-full"
                  data-testid="button-send"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Participants Sidebar */}
        <div className="lg:w-80 border-l border-border bg-card/30 p-6">
          <h3 className="text-lg font-semibold mb-4">Active Participants</h3>
          <div className="space-y-4">
            {/* David */}
            <div className="flex items-center gap-3" data-testid="participant-david">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2"
                style={{
                  borderColor: "hsl(280, 70%, 65%)",
                  backgroundColor: "hsl(280, 70%, 20%)",
                }}
              >
                DT
              </div>
              <div>
                <p className="font-semibold">David Trinidad</p>
                <p className="text-xs text-muted-foreground">Host</p>
              </div>
            </div>

            {/* AI Participants */}
            {activeCharacters.map((character) => (
              <div
                key={character.id}
                className="flex items-center gap-3"
                data-testid={`participant-${character.id}`}
              >
                <img
                  src={avatarMap[character.id]}
                  alt={character.name}
                  className="w-12 h-12 rounded-full object-cover border-2"
                  style={{
                    borderColor: character.auraColor,
                  }}
                />
                <div>
                  <p className="font-semibold">{character.name}</p>
                  <p className="text-xs text-muted-foreground">{character.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
