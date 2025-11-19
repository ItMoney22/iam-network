import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Activity, Users, Clock } from "lucide-react";

interface AICoPilotPanelProps {
  episodeStats: {
    davidTurns: number;
    aiTurns: number;
    duration: string;
    currentPacing: string;
  };
  suggestions: string[];
}

export function AICoPilotPanel({ episodeStats, suggestions = [] }: AICoPilotPanelProps) {
  return (
    <Card className="h-full flex flex-col border-r rounded-none border-border bg-card/30">
      <CardHeader className="px-4 py-3 border-b border-border">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          AI Co-Pilot
        </CardTitle>
      </CardHeader>
      <div className="p-4 space-y-6">
        {/* Stats */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3 h-3" /> Episode Stats
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-background/50 p-2 rounded border border-border">
              <p className="text-[10px] text-muted-foreground">David</p>
              <p className="text-lg font-bold">{episodeStats.davidTurns}%</p>
            </div>
            <div className="bg-background/50 p-2 rounded border border-border">
              <p className="text-[10px] text-muted-foreground">AI Guests</p>
              <p className="text-lg font-bold">{episodeStats.aiTurns}%</p>
            </div>
            <div className="bg-background/50 p-2 rounded border border-border">
              <p className="text-[10px] text-muted-foreground">Duration</p>
              <p className="text-sm font-bold">{episodeStats.duration}</p>
            </div>
            <div className="bg-background/50 p-2 rounded border border-border">
              <p className="text-[10px] text-muted-foreground">Pacing</p>
              <p className="text-xs font-bold text-primary">{episodeStats.currentPacing}</p>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="w-3 h-3" /> Suggestions
          </h4>
          <div className="space-y-2">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, idx) => (
                <div key={idx} className="text-xs p-2 bg-primary/5 border border-primary/10 rounded text-primary-foreground/80">
                  {suggestion}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">Analyzing conversation flow...</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
