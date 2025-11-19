import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ListTodo, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { PreshowPrep } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ShowOutlineProps {
  episodeId: string;
  theme: string;
}

export function ShowOutline({ episodeId, theme }: ShowOutlineProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: prep } = useQuery<PreshowPrep>({
    queryKey: [`/api/preshow/${episodeId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/preshow/${episodeId}`);
      if (res.status === 404) return null;
      return res.json();
    },
  });

  const generatePrepMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/preshow", {
        episodeId,
        theme,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Outline Generated", description: "Show structure is ready." });
      queryClient.invalidateQueries({ queryKey: [`/api/preshow/${episodeId}`] });
    },
  });

  const segments = (prep?.segmentStructure as any)?.segments || [];

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="px-4 py-3 border-b border-border flex flex-row justify-between items-center">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-primary" />
          Show Outline
        </CardTitle>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 w-7 p-0"
          onClick={() => generatePrepMutation.mutate()}
          disabled={generatePrepMutation.isPending}
        >
          <RefreshCw className={`w-3 h-3 ${generatePrepMutation.isPending ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {!prep ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-xs text-muted-foreground">No outline generated yet.</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => generatePrepMutation.mutate()}
                disabled={generatePrepMutation.isPending}
              >
                Generate Outline
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {segments.map((segment: any, idx: number) => (
                <div key={idx} className="flex gap-3 p-3 rounded-lg border border-border bg-card/40 hover:bg-card/60 transition-colors">
                  <div className="mt-0.5 text-primary">
                    <Circle className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium leading-none">{segment.title}</h4>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">{segment.duration}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{segment.description}</p>
                    <div className="pt-1 flex flex-wrap gap-1">
                       {segment.keyPoints?.map((kp: string, kpidx: number) => (
                         <span key={kpidx} className="text-[10px] px-1.5 py-0.5 bg-secondary/50 rounded text-secondary-foreground">
                           • {kp}
                         </span>
                       ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
