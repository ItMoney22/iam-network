import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { fetchActiveCharacters, fetchEpisodes, fetchEpisodeTurns } from "@/lib/api";
import type { Character, Turn } from "@shared/schema";

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

interface ParticipantCardProps {
  character?: Character;
  isHost?: boolean;
  isSpeaking: boolean;
  lastSpoke?: Date;
}

function ParticipantCard({ character, isHost, isSpeaking, lastSpoke }: ParticipantCardProps) {
  const name = isHost ? "David Trinidad" : character?.name || "Unknown";
  const role = isHost ? "Host" : character?.role || "";
  const auraColor = isHost ? "hsl(280, 70%, 65%)" : character?.auraColor || "hsl(var(--primary))";
  const avatarUrl = character ? avatarMap[character.id] : null;

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-500 ${
        isSpeaking ? "scale-105" : "scale-100"
      }`}
      style={{
        boxShadow: isSpeaking
          ? `0 0 40px 8px ${auraColor}, 0 0 80px 16px ${auraColor}80`
          : "none",
        borderColor: isSpeaking ? auraColor : "transparent",
        borderWidth: "2px",
      }}
    >
      {/* Animated glow overlay when speaking */}
      {isSpeaking && (
        <div
          className="absolute inset-0 animate-pulse pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${auraColor}40 0%, transparent 70%)`,
          }}
        />
      )}

      <div className="relative p-6 flex flex-col items-center gap-4">
        {/* Avatar */}
        <div
          className={`relative transition-all duration-500 ${
            isSpeaking ? "scale-110" : "scale-100"
          }`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-32 h-32 rounded-full object-cover"
              style={{
                boxShadow: isSpeaking
                  ? `0 0 30px 6px ${auraColor}`
                  : `0 0 10px 2px ${auraColor}40`,
                borderColor: auraColor,
                borderWidth: "3px",
                borderStyle: "solid",
              }}
            />
          ) : (
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold"
              style={{
                backgroundColor: `${auraColor}20`,
                borderColor: auraColor,
                borderWidth: "3px",
                borderStyle: "solid",
                boxShadow: isSpeaking
                  ? `0 0 30px 6px ${auraColor}`
                  : `0 0 10px 2px ${auraColor}40`,
              }}
            >
              DT
            </div>
          )}

          {/* Speaking indicator pulse */}
          {isSpeaking && (
            <div
              className="absolute -inset-4 rounded-full animate-ping opacity-75"
              style={{
                backgroundColor: auraColor,
              }}
            />
          )}
        </div>

        {/* Name and Role */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">{role}</p>
        </div>

        {/* Status Badge */}
        {isSpeaking && (
          <Badge
            className="absolute top-4 right-4 animate-pulse"
            style={{
              backgroundColor: `${auraColor}40`,
              borderColor: auraColor,
              color: auraColor,
            }}
          >
            Speaking
          </Badge>
        )}

        {/* Last spoke timestamp */}
        {lastSpoke && !isSpeaking && (
          <p className="text-xs text-muted-foreground absolute bottom-3 right-3">
            {new Date(lastSpoke).toLocaleTimeString()}
          </p>
        )}
      </div>
    </Card>
  );
}

export default function StudioLive() {
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [lastSpokeMap, setLastSpokeMap] = useState<Record<string, Date>>({});

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

  const { data: turns = [] } = useQuery<Turn[]>({
    queryKey: ["/api/episodes", currentEpisode?.id, "turns"],
    queryFn: () => currentEpisode ? fetchEpisodeTurns(currentEpisode.id) : Promise.resolve([]),
    enabled: !!currentEpisode,
    refetchInterval: 1000, // Fast polling for real-time glow effects
  });

  // Track who's currently speaking based on most recent turn
  useEffect(() => {
    if (turns.length > 0) {
      const latestTurn = turns[turns.length - 1];
      setCurrentSpeaker(latestTurn.speaker);

      // Update last spoke timestamps
      setLastSpokeMap(prev => ({
        ...prev,
        [latestTurn.speaker]: new Date(latestTurn.timestamp),
      }));

      // Clear current speaker after 3 seconds
      const timeout = setTimeout(() => {
        setCurrentSpeaker(null);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [turns.length]);

  if (loadingCharacters || loadingEpisodes) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-950 to-indigo-950">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentEpisode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-950 to-indigo-950">
        <Card className="p-12 text-center max-w-xl bg-black/40 backdrop-blur-md border-primary/30">
          <h2 className="text-4xl font-bold mb-4 text-primary">No Live Episode</h2>
          <p className="text-muted-foreground text-lg">
            Start an episode from the Control Panel to go live
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-indigo-950 p-8">
      {/* Header */}
      <div className="max-w-[1800px] mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
              The I AM Network
            </h1>
            <p className="text-2xl text-muted-foreground">{currentEpisode.theme}</p>
          </div>
          <Badge
            variant="outline"
            className="bg-red-500/20 text-red-400 border-red-400/50 text-xl px-6 py-3"
          >
            <span className="mr-3 h-4 w-4 rounded-full bg-red-500 animate-pulse inline-block" />
            LIVE
          </Badge>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="max-w-[1800px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {/* David (Host) */}
        <ParticipantCard
          isHost
          isSpeaking={currentSpeaker === "david"}
          lastSpoke={lastSpokeMap["david"]}
        />

        {/* AI Participants */}
        {activeCharacters.map((character) => (
          <ParticipantCard
            key={character.id}
            character={character}
            isSpeaking={currentSpeaker === character.id}
            lastSpoke={lastSpokeMap[character.id]}
          />
        ))}
      </div>

      {/* Latest Message Display */}
      {turns.length > 0 && (
        <div className="max-w-[1800px] mx-auto mt-8">
          <Card className="p-6 bg-black/40 backdrop-blur-md border-primary/30">
            <div className="flex items-start gap-4">
              <div
                className="w-3 h-3 rounded-full mt-2 animate-pulse"
                style={{
                  backgroundColor:
                    turns[turns.length - 1].speaker === "david"
                      ? "hsl(280, 70%, 65%)"
                      : activeCharacters.find((c) => c.id === turns[turns.length - 1].speaker)
                          ?.auraColor || "hsl(var(--primary))",
                }}
              />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  {turns[turns.length - 1].speaker === "david"
                    ? "David Trinidad"
                    : activeCharacters.find((c) => c.id === turns[turns.length - 1].speaker)
                        ?.name || turns[turns.length - 1].speaker}
                </p>
                <p className="text-lg">{turns[turns.length - 1].text}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
