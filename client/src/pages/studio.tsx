import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Settings, ChevronLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { fetchActiveCharacters, fetchEpisodes } from "@/lib/api";

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

export default function Studio() {
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);

  const { data: activeCharacters = [], isLoading: loadingCharacters } = useQuery({
    queryKey: ["/api/characters/active"],
    queryFn: fetchActiveCharacters,
  });

  const { data: episodes = [], isLoading: loadingEpisodes } = useQuery({
    queryKey: ["/api/episodes"],
    queryFn: fetchEpisodes,
  });

  if (loadingCharacters || loadingEpisodes) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-indigo-950 to-purple-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
              <p className="text-sm text-muted-foreground" data-testid="text-studio-status">Live Session</p>
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
        {/* Main Stage */}
        <div className="flex-1 flex flex-col">
          {/* Participants Display */}
          <div className="p-8 bg-gradient-to-b from-background to-accent/10">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-wrap justify-center gap-6 lg:gap-8">
                <div
                  className={`relative group transition-all duration-300 ${
                    activeSpeaker === "david" ? "scale-110" : "opacity-70 hover:opacity-100"
                  }`}
                  data-testid="participant-david"
                >
                  <div
                    className="w-24 h-24 lg:w-32 lg:h-32 rounded-full flex items-center justify-center text-4xl font-bold text-white border-4"
                    style={{
                      borderColor: "hsl(280, 70%, 65%)",
                      boxShadow: activeSpeaker === "david" ? "0 0 40px hsl(280, 70%, 65%)" : "0 0 20px hsl(280, 70%, 65%)40",
                      backgroundColor: "hsl(280, 70%, 20%)",
                    }}
                  >
                    DT
                  </div>
                  <p className="text-center mt-2 text-sm font-semibold text-white">David</p>
                </div>

                {activeCharacters.map((character) => (
                  <div
                    key={character.id}
                    className={`relative group transition-all duration-300 ${
                      activeSpeaker === character.id ? "scale-110" : "opacity-70 hover:opacity-100"
                    }`}
                    data-testid={`participant-${character.id}`}
                  >
                    <div
                      className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
                        activeSpeaker === character.id ? "opacity-75 animate-pulse-glow" : "opacity-0"
                      }`}
                      style={{ backgroundColor: character.auraColor }}
                    />
                    
                    <div className="relative">
                      <img
                        src={avatarMap[character.id]}
                        alt={character.name}
                        className={`w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover border-4 transition-all duration-300 ${
                          activeSpeaker === character.id
                            ? "border-primary shadow-lg shadow-primary/50"
                            : "border-card-border"
                        }`}
                        data-testid={`avatar-${character.id}`}
                      />
                      
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <Badge
                          variant={activeSpeaker === character.id ? "default" : "outline"}
                          className="text-xs"
                          data-testid={`name-${character.id}`}
                        >
                          {character.name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Captions */}
          <div className="p-6 bg-card/50 border-t border-border">
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-center leading-relaxed text-muted-foreground" data-testid="text-live-caption">
                {episodes.length > 0 
                  ? `Episode: ${episodes[0].title}` 
                  : "No active episode - Start one from the Host Control Panel"}
              </p>
            </div>
          </div>

          {/* Conversation History */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {episodes.length === 0 ? (
                  <Card className="p-8 bg-card/40 backdrop-blur-sm border-card-border text-center">
                    <p className="text-muted-foreground">
                      No conversation turns yet. Create an episode from the Host Control Panel to begin.
                    </p>
                  </Card>
                ) : (
                  <Card className="p-8 bg-card/40 backdrop-blur-sm border-card-border text-center">
                    <p className="text-muted-foreground">
                      Conversation turns will appear here when the episode is live.
                    </p>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Side Panel - Chat/Debug Console (optional, hidden on mobile) */}
        <div className="hidden lg:block w-80 border-l border-border bg-card/30">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold" data-testid="text-debug-title">Debug Console</h3>
            <p className="text-xs text-muted-foreground">Development Mode</p>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-4 space-y-2 text-xs font-mono">
              <div className="text-muted-foreground" data-testid="debug-log-1">
                [INFO] Episode started: Theme - Divine Consciousness
              </div>
              <div className="text-muted-foreground" data-testid="debug-log-2">
                [INFO] Active participants: 5
              </div>
              <div className="text-primary" data-testid="debug-log-3">
                [ROUTER] Zero selected as next speaker
              </div>
              <div className="text-muted-foreground" data-testid="debug-log-4">
                [LLM] Model: gpt-4.1 | Temperature: 0.6
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
