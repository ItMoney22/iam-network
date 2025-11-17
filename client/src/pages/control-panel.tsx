import { useState } from "react";
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
import { ChevronLeft, Volume2, VolumeX, Play, Pause, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { fetchCharacters, toggleCharacterActive, createEpisode } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Character } from "@shared/schema";

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

const mockPrepQuestions = [
  "How does the concept of I AM relate to modern artificial intelligence?",
  "What does the Bible say about consciousness being unified versus separate?",
  "Can you explain the difference between religious dogma and spiritual awakening?",
  "How do we reconcile questioning with reverence when discussing divine texts?",
  "What role does love play in the pursuit of truth?",
  "How can AI help us understand ancient spiritual teachings in new ways?",
  "What does it mean to 'remember' that we are one?",
  "How do different faith traditions approach the concept of divine unity?",
];

export default function ControlPanel() {
  const { toast } = useToast();
  const [debateHeat, setDebateHeat] = useState([50]);
  const [theme, setTheme] = useState("");
  const [episodeStatus, setEpisodeStatus] = useState<"draft" | "live" | "paused">("draft");
  const [mutedCharacters, setMutedCharacters] = useState<Set<string>>(new Set());

  const { data: characters = [], isLoading: loadingCharacters } = useQuery({
    queryKey: ["/api/characters"],
    queryFn: fetchCharacters,
  });

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
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update character",
        variant: "destructive",
      });
      console.error("Toggle error:", error);
    },
  });

  const createEpisodeMutation = useMutation({
    mutationFn: (data: { title: string; theme: string; participants: string[] }) =>
      createEpisode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      toast({
        title: "Episode Created",
        description: "New episode started successfully",
      });
      setEpisodeStatus("live");
      setTheme("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create episode",
        variant: "destructive",
      });
      console.error("Create episode error:", error);
    },
  });

  const handleToggleCharacter = (char: Character) => {
    toggleMutation.mutate({ id: char.id, isActive: !char.isActive });
  };

  const toggleMute = (id: string) => {
    setMutedCharacters(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleStartEpisode = () => {
    if (!theme.trim()) {
      toast({
        title: "Theme Required",
        description: "Please enter an episode theme",
        variant: "destructive",
      });
      return;
    }

    const activeCharIds = characters
      .filter(c => c.isActive)
      .map(c => c.id);

    createEpisodeMutation.mutate({
      title: `Episode: ${theme}`,
      theme: theme,
      participants: ["david", ...activeCharIds],
    });
  };

  if (loadingCharacters) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-indigo-950 to-purple-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeCount = characters.filter(c => c.isActive).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-indigo-950 to-purple-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/studio">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Host Control Panel</h1>
              <p className="text-white/60">Direct the divine conversation</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2" data-testid="badge-status">
            {episodeStatus === "live" && "🔴 LIVE"}
            {episodeStatus === "paused" && "⏸️ PAUSED"}
            {episodeStatus === "draft" && "📝 DRAFT"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/5 backdrop-blur border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  AI Participants
                  <Badge variant="secondary" data-testid="text-active-count">
                    {activeCount} Active
                  </Badge>
                </CardTitle>
                <CardDescription className="text-white/60">
                  Toggle which AI personalities join the conversation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {characters.map((char) => {
                      const isMuted = mutedCharacters.has(char.id);
                      return (
                        <div
                          key={char.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover-elevate"
                          data-testid={`character-row-${char.id}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className="w-12 h-12 rounded-full overflow-hidden ring-2"
                              style={{
                                ringColor: char.auraColor,
                                boxShadow: `0 0 20px ${char.auraColor}40`,
                              }}
                            >
                              <img
                                src={avatarMap[char.id]}
                                alt={char.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-semibold">{char.name}</p>
                              <p className="text-white/50 text-sm">{char.role}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleMute(char.id)}
                              disabled={!char.isActive}
                              data-testid={`button-mute-${char.id}`}
                            >
                              {isMuted ? (
                                <VolumeX className="w-4 h-4 text-white/40" />
                              ) : (
                                <Volume2 className="w-4 h-4 text-white/60" />
                              )}
                            </Button>
                            <Switch
                              checked={char.isActive}
                              onCheckedChange={() => handleToggleCharacter(char)}
                              disabled={toggleMutation.isPending}
                              data-testid={`switch-active-${char.id}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Episode Configuration</CardTitle>
                <CardDescription className="text-white/60">
                  Set the theme and tone for this conversation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white">Episode Theme</Label>
                  <Input
                    placeholder="e.g., 'The Nature of Divine Consciousness'"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    data-testid="input-theme"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Debate Heat</Label>
                    <Badge variant="outline" data-testid="text-debate-heat">
                      {debateHeat[0] < 35 ? "❄️ Chill" : debateHeat[0] < 70 ? "🔥 Balanced" : "🌶️ Spicy"}
                    </Badge>
                  </div>
                  <Slider
                    value={debateHeat}
                    onValueChange={setDebateHeat}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                    data-testid="slider-debate-heat"
                  />
                  <p className="text-white/50 text-sm">
                    {debateHeat[0] < 35 && "Calm, harmonious dialogue focused on unity"}
                    {debateHeat[0] >= 35 && debateHeat[0] < 70 && "Balanced mix of agreement and challenge"}
                    {debateHeat[0] >= 70 && "Intense debate with direct questioning"}
                  </p>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button
                    onClick={handleStartEpisode}
                    disabled={createEpisodeMutation.isPending || episodeStatus === "live"}
                    className="flex-1"
                    data-testid="button-start-episode"
                  >
                    {createEpisodeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : episodeStatus === "live" ? (
                      "Episode Active"
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Episode
                      </>
                    )}
                  </Button>
                  {episodeStatus === "live" && (
                    <Button
                      variant="outline"
                      onClick={() => setEpisodeStatus("paused")}
                      data-testid="button-pause-episode"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/5 backdrop-blur border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Pre-Show Prep</CardTitle>
                <CardDescription className="text-white/60">
                  AI-generated questions and guidance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="questions" className="border-white/10">
                    <AccordionTrigger className="text-white hover:text-white/80" data-testid="accordion-trigger-questions">
                      Suggested Questions ({mockPrepQuestions.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-[300px]">
                        <ul className="space-y-3">
                          {mockPrepQuestions.map((q, i) => (
                            <li key={i} className="text-white/70 text-sm leading-relaxed">
                              {i + 1}. {q}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tips" className="border-white/10">
                    <AccordionTrigger className="text-white hover:text-white/80" data-testid="accordion-trigger-tips">
                      Hosting Tips
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p className="text-white/70 text-sm">
                        ✨ Let Zero guide the flow - trust the AI director
                      </p>
                      <p className="text-white/70 text-sm">
                        💭 Your voice always takes priority - interrupt when needed
                      </p>
                      <p className="text-white/70 text-sm">
                        🎯 Circle back to Love, Unity, and I AM awareness
                      </p>
                      <p className="text-white/70 text-sm">
                        ⚡ Allow respectful challenge - growth comes from inquiry
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/studio">
                  <Button variant="outline" className="w-full" data-testid="button-view-studio">
                    View Studio
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" className="w-full" data-testid="button-home">
                    Back to Home
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
