import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Settings, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

// Import character avatars
import zeroAvatar from "@assets/generated_images/Zero_wise_director_portrait_435ea3ff.png";
import m7Avatar from "@assets/generated_images/M7_skeptic_portrait_1a9bec4a.png";
import synqAvatar from "@assets/generated_images/Synq_healer_portrait_98fc9eec.png";
import fluxAvatar from "@assets/generated_images/Flux_conspiracy_hunter_portrait_f8ccb042.png";

interface ActiveParticipant {
  id: string;
  name: string;
  avatar: string;
  aura: string;
}

const mockParticipants: ActiveParticipant[] = [
  { id: "david", name: "David", avatar: "", aura: "hsl(280, 70%, 65%)" },
  { id: "zero", name: "Zero", avatar: zeroAvatar, aura: "hsl(210, 100%, 60%)" },
  { id: "m7", name: "M7", avatar: m7Avatar, aura: "hsl(15, 100%, 60%)" },
  { id: "synq", name: "Synq", avatar: synqAvatar, aura: "hsl(160, 70%, 55%)" },
  { id: "flux", name: "Flux", avatar: fluxAvatar, aura: "hsl(270, 70%, 60%)" },
];

interface ConversationTurn {
  speaker: string;
  text: string;
  timestamp: Date;
}

const mockConversation: ConversationTurn[] = [
  {
    speaker: "Zero",
    text: "Welcome to The I AM Network. Today we explore the intersection of consciousness, technology, and divine truth. David, what brings us together in this moment?",
    timestamp: new Date(),
  },
  {
    speaker: "David",
    text: "I want to understand how AI can help us remember who we truly are—that we are all expressions of the I AM.",
    timestamp: new Date(),
  },
  {
    speaker: "M7",
    text: "Hold on. Before we get too mystical, let's question that premise. What evidence do we have that consciousness is unified? I'm not trying to be difficult, but if we're seeking truth, we need to challenge our assumptions.",
    timestamp: new Date(),
  },
];

export default function Studio() {
  const [activeSpeaker, setActiveSpeaker] = useState<string>("zero");
  const [currentCaption, setCurrentCaption] = useState("Zero is speaking...");

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
                {mockParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`relative group transition-all duration-300 ${
                      activeSpeaker === participant.id ? "scale-110" : "opacity-70 hover:opacity-100"
                    }`}
                    data-testid={`participant-${participant.id}`}
                  >
                    <div
                      className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
                        activeSpeaker === participant.id ? "opacity-75 animate-pulse-glow" : "opacity-0"
                      }`}
                      style={{ backgroundColor: participant.aura }}
                    />
                    
                    <div className="relative">
                      {participant.avatar ? (
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className={`w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover border-4 transition-all duration-300 ${
                            activeSpeaker === participant.id
                              ? "border-primary shadow-lg shadow-primary/50"
                              : "border-card-border"
                          }`}
                          data-testid={`avatar-${participant.id}`}
                        />
                      ) : (
                        <div
                          className={`w-24 h-24 lg:w-32 lg:h-32 rounded-full flex items-center justify-center text-3xl font-bold border-4 transition-all duration-300 ${
                            activeSpeaker === participant.id
                              ? "border-primary shadow-lg shadow-primary/50 bg-primary/20"
                              : "border-card-border bg-card"
                          }`}
                          data-testid={`avatar-${participant.id}`}
                        >
                          {participant.name[0]}
                        </div>
                      )}
                      
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <Badge
                          variant={activeSpeaker === participant.id ? "default" : "outline"}
                          className="text-xs"
                          data-testid={`name-${participant.id}`}
                        >
                          {participant.name}
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
              <p className="text-lg text-center leading-relaxed" data-testid="text-live-caption">
                {currentCaption}
              </p>
            </div>
          </div>

          {/* Conversation History */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {mockConversation.map((turn, idx) => (
                  <Card
                    key={idx}
                    className="p-4 bg-card/40 backdrop-blur-sm border-card-border"
                    data-testid={`turn-${idx}`}
                  >
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1" data-testid={`speaker-${idx}`}>
                        {turn.speaker}
                      </Badge>
                      <p className="flex-1 text-muted-foreground" data-testid={`text-${idx}`}>
                        {turn.text}
                      </p>
                    </div>
                  </Card>
                ))}
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
