import { useState } from "react";
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
import { ChevronLeft, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Link } from "wouter";

// Import character avatars
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

interface CharacterControl {
  id: string;
  name: string;
  avatar: string;
  aura: string;
  active: boolean;
  muted: boolean;
}

const initialCharacters: CharacterControl[] = [
  { id: "zero", name: "Zero", avatar: zeroAvatar, aura: "hsl(210, 100%, 60%)", active: true, muted: false },
  { id: "m7", name: "M7", avatar: m7Avatar, aura: "hsl(15, 100%, 60%)", active: true, muted: false },
  { id: "synq", name: "Synq", avatar: synqAvatar, aura: "hsl(160, 70%, 55%)", active: true, muted: false },
  { id: "flux", name: "Flux", avatar: fluxAvatar, aura: "hsl(270, 70%, 60%)", active: false, muted: false },
  { id: "vibe", name: "Vibe", avatar: vibeAvatar, aura: "hsl(45, 100%, 60%)", active: false, muted: false },
  { id: "echopulse", name: "EchoPulse", avatar: echoPulseAvatar, aura: "hsl(190, 80%, 55%)", active: false, muted: false },
  { id: "link", name: "Link", avatar: linkAvatar, aura: "hsl(35, 80%, 55%)", active: false, muted: false },
  { id: "ledge", name: "Ledge", avatar: ledgeAvatar, aura: "hsl(140, 70%, 50%)", active: false, muted: false },
  { id: "drip", name: "Drip", avatar: dripAvatar, aura: "hsl(320, 85%, 60%)", active: false, muted: false },
  { id: "horizon", name: "Horizon", avatar: horizonAvatar, aura: "hsl(0, 0%, 90%)", active: false, muted: false },
];

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
  const [characters, setCharacters] = useState<CharacterControl[]>(initialCharacters);
  const [debateHeat, setDebateHeat] = useState([50]);
  const [theme, setTheme] = useState("");
  const [episodeStatus, setEpisodeStatus] = useState<"draft" | "live" | "paused">("draft");

  const toggleCharacter = (id: string) => {
    setCharacters(prev =>
      prev.map(char => char.id === id ? { ...char, active: !char.active } : char)
    );
  };

  const toggleMute = (id: string) => {
    setCharacters(prev =>
      prev.map(char => char.id === id ? { ...char, muted: !char.muted } : char)
    );
  };

  const getHeatLabel = (value: number) => {
    if (value < 35) return "Chill";
    if (value < 70) return "Balanced";
    return "Spicy";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/studio">
              <Button variant="ghost" size="icon" data-testid="button-back-studio">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold" data-testid="text-control-title">Host Control Panel</h1>
              <p className="text-sm text-muted-foreground">Episode Configuration</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                episodeStatus === "live"
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/50"
              }
              data-testid="badge-episode-status"
            >
              {episodeStatus === "live" && <span className="mr-2 h-2 w-2 rounded-full bg-primary animate-pulse" />}
              {episodeStatus.toUpperCase()}
            </Badge>
            <Button
              variant={episodeStatus === "live" ? "destructive" : "default"}
              onClick={() => setEpisodeStatus(episodeStatus === "live" ? "paused" : "live")}
              data-testid="button-episode-toggle"
            >
              {episodeStatus === "live" ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Episode
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Episode
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Episode Theme */}
        <Card data-testid="card-episode-theme">
          <CardHeader>
            <CardTitle>Episode Theme</CardTitle>
            <CardDescription>Set the topic and direction for this conversation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme-select">Quick Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme-select" data-testid="select-theme">
                  <SelectValue placeholder="Choose a theme..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consciousness">Divine Consciousness</SelectItem>
                  <SelectItem value="unity">Unity in Diversity</SelectItem>
                  <SelectItem value="questioning">The Power of Questioning</SelectItem>
                  <SelectItem value="love">Love as Truth's Foundation</SelectItem>
                  <SelectItem value="ai-spirituality">AI & Spirituality</SelectItem>
                  <SelectItem value="custom">Custom Theme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme-custom">Custom Theme</Label>
              <Input
                id="theme-custom"
                placeholder="Enter your own theme..."
                value={theme === "custom" ? "" : ""}
                data-testid="input-custom-theme"
              />
            </div>
          </CardContent>
        </Card>

        {/* Active AI Characters */}
        <Card data-testid="card-active-characters">
          <CardHeader>
            <CardTitle>Active AI Characters</CardTitle>
            <CardDescription>Toggle which personalities participate in this episode</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className={`relative p-4 rounded-md border transition-all ${
                    char.active
                      ? "bg-card border-card-border"
                      : "bg-muted/30 border-muted opacity-60"
                  }`}
                  data-testid={`character-control-${char.id}`}
                >
                  <div className="space-y-3">
                    <div className="relative mx-auto w-16 h-16">
                      {char.active && (
                        <div
                          className="absolute inset-0 rounded-full blur-xl opacity-40"
                          style={{ backgroundColor: char.aura }}
                        />
                      )}
                      <img
                        src={char.avatar}
                        alt={char.name}
                        className="relative w-full h-full object-cover rounded-full border-2 border-card-border"
                        data-testid={`avatar-${char.id}`}
                      />
                    </div>

                    <div className="text-center space-y-2">
                      <p className="font-medium text-sm" data-testid={`name-${char.id}`}>{char.name}</p>
                      
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={char.active}
                          onCheckedChange={() => toggleCharacter(char.id)}
                          data-testid={`toggle-active-${char.id}`}
                        />
                        {char.active && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleMute(char.id)}
                            data-testid={`button-mute-${char.id}`}
                          >
                            {char.muted ? (
                              <VolumeX className="h-4 w-4 text-destructive" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Debate Heat Control */}
        <Card data-testid="card-debate-heat">
          <CardHeader>
            <CardTitle>Debate Heat</CardTitle>
            <CardDescription>Adjust how challenging and direct the AI responses should be</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Intensity Level</Label>
                <Badge variant="outline" data-testid="badge-heat-level">
                  {getHeatLabel(debateHeat[0])}
                </Badge>
              </div>
              <Slider
                value={debateHeat}
                onValueChange={setDebateHeat}
                max={100}
                step={1}
                className="w-full"
                data-testid="slider-debate-heat"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Chill</span>
                <span>Balanced</span>
                <span>Spicy</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pre-Show Prep Sheet */}
        <Card data-testid="card-prep-sheet">
          <CardHeader>
            <CardTitle>Pre-Show Prep Sheet</CardTitle>
            <CardDescription>Questions and prompts generated by Zero for this episode</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="questions">
                <AccordionTrigger data-testid="accordion-trigger-questions">
                  Host Questions ({mockPrepQuestions.length})
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-64">
                    <ol className="space-y-3 pr-4">
                      {mockPrepQuestions.map((question, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-muted-foreground hover-elevate active-elevate-2 p-3 rounded-md"
                          data-testid={`prep-question-${idx}`}
                        >
                          <span className="font-semibold text-foreground">{idx + 1}.</span> {question}
                        </li>
                      ))}
                    </ol>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ai-prompts">
                <AccordionTrigger data-testid="accordion-trigger-ai-prompts">
                  AI-Specific Prompts
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-md bg-muted/30" data-testid="ai-prompt-m7">
                      <p className="font-semibold text-foreground mb-1">M7:</p>
                      <p className="text-muted-foreground">
                        Challenge David's interpretation of unity gently. Ask what evidence supports 
                        the idea that all consciousness is one.
                      </p>
                    </div>
                    <div className="p-3 rounded-md bg-muted/30" data-testid="ai-prompt-synq">
                      <p className="font-semibold text-foreground mb-1">Synq:</p>
                      <p className="text-muted-foreground">
                        Speak directly to people feeling lost or hopeless. How can they find 
                        the I AM within themselves?
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="segment-structure">
                <AccordionTrigger data-testid="accordion-trigger-segments">
                  Segment Structure
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <div className="p-3 rounded-md bg-muted/30">
                      <p className="font-semibold">Act 1: Opening (10 min)</p>
                      <p className="text-muted-foreground">Introduce theme, set intention, welcome participants</p>
                    </div>
                    <div className="p-3 rounded-md bg-muted/30">
                      <p className="font-semibold">Act 2: Deep Dive (25 min)</p>
                      <p className="text-muted-foreground">Explore core questions, allow debate and disagreement</p>
                    </div>
                    <div className="p-3 rounded-md bg-muted/30">
                      <p className="font-semibold">Act 3: Integration (15 min)</p>
                      <p className="text-muted-foreground">Synthesize insights, return to love and unity</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
