import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scissors, Plus, Clock, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EpisodeClip } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ClipManagerProps {
  episodeId: string;
  elapsedSeconds: number;
}

export function ClipManager({ episodeId, elapsedSeconds }: ClipManagerProps) {
  const [label, setLabel] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clips = [] } = useQuery<EpisodeClip[]>({
    queryKey: [`/api/episodes/${episodeId}/clips`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/episodes/${episodeId}/clips`);
      return res.json();
    },
  });

  const createClipMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/episodes/${episodeId}/clip`, {
        timestampSeconds: elapsedSeconds,
        label: label || "Highlight",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Clip Marked", description: `Marked at ${formatTime(elapsedSeconds)}` });
      setLabel("");
      queryClient.invalidateQueries({ queryKey: [`/api/episodes/${episodeId}/clips`] });
    },
  });

  const deleteClipMutation = useMutation({
    mutationFn: async (clipId: string) => {
      await apiRequest("DELETE", `/api/clips/${clipId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/episodes/${episodeId}/clips`] });
    },
  });

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="px-4 py-3 border-b border-border">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Scissors className="w-4 h-4 text-primary" />
          Clip Markers
        </CardTitle>
      </CardHeader>
      
      <div className="p-4 space-y-4 flex-1 overflow-hidden flex flex-col">
        <div className="flex gap-2">
          <Input 
            value={label} 
            onChange={(e) => setLabel(e.target.value)} 
            placeholder="Clip label (optional)"
            className="h-8 text-xs"
          />
          <Button 
            size="sm" 
            className="h-8 text-xs whitespace-nowrap"
            onClick={() => createClipMutation.mutate()}
            disabled={createClipMutation.isPending}
          >
            <Scissors className="w-3 h-3 mr-1" /> Mark Now
          </Button>
        </div>

        <div className="text-center py-2 bg-secondary/20 rounded border border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Time</p>
          <p className="text-xl font-mono font-bold text-primary">{formatTime(elapsedSeconds)}</p>
        </div>

        <ScrollArea className="flex-1 border rounded-md bg-card/30">
          <div className="p-2 space-y-1">
            {clips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No clips marked yet.
              </div>
            ) : (
              clips.map((clip) => (
                <div key={clip.id} className="flex items-center justify-between p-2 hover:bg-accent/50 rounded group">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {formatTime(clip.timestampSeconds)}
                    </Badge>
                    <span className="text-sm truncate max-w-[120px]">{clip.label}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteClipMutation.mutate(clip.id)}
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
