import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart2, Plus, Trash, CheckCircle, Lock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Poll, PollOption } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface PollManagerProps {
  episodeId: string;
}

interface PollWithOptions extends Poll {
  options: PollOption[];
}

export function PollManager({ episodeId }: PollManagerProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: polls = [] } = useQuery<PollWithOptions[]>({
    queryKey: [`/api/episodes/${episodeId}/polls`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/episodes/${episodeId}/polls`);
      return res.json();
    },
    refetchInterval: 5000,
  });

  const createPollMutation = useMutation({
    mutationFn: async (data: { question: string; options: string[] }) => {
      const res = await apiRequest("POST", `/api/episodes/${episodeId}/polls`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Poll Created", description: "Poll is now live." });
      setQuestion("");
      setOptions(["", ""]);
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: [`/api/episodes/${episodeId}/polls`] });
    },
  });

  const closePollMutation = useMutation({
    mutationFn: async (pollId: string) => {
      await apiRequest("PATCH", `/api/polls/${pollId}/close`);
    },
    onSuccess: () => {
      toast({ title: "Poll Closed" });
      queryClient.invalidateQueries({ queryKey: [`/api/episodes/${episodeId}/polls`] });
    },
  });

  const handleAddOption = () => {
    if (options.length < 4) setOptions([...options, ""]);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    const validOptions = options.filter(o => o.trim() !== "");
    if (!question.trim() || validOptions.length < 2) return;
    createPollMutation.mutate({ question, options: validOptions });
  };

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="px-4 py-3 border-b border-border flex flex-row justify-between items-center">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          Audience Polls
        </CardTitle>
        {!isCreating && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setIsCreating(true)}>
            <Plus className="w-3 h-3 mr-1" /> New Poll
          </Button>
        )}
      </CardHeader>
      
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {isCreating ? (
          <div className="space-y-4 border border-primary/20 bg-primary/5 p-4 rounded-lg">
            <div className="space-y-2">
              <Label className="text-xs">Question</Label>
              <Input 
                value={question} 
                onChange={(e) => setQuestion(e.target.value)} 
                placeholder="What should we discuss next?"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Options</Label>
              {options.map((opt, idx) => (
                <Input 
                  key={idx}
                  value={opt} 
                  onChange={(e) => handleOptionChange(idx, e.target.value)} 
                  placeholder={`Option ${idx + 1}`}
                  className="h-8 text-xs mb-1"
                />
              ))}
              {options.length < 4 && (
                <Button variant="ghost" size="sm" onClick={handleAddOption} className="h-6 text-xs w-full border border-dashed">
                  + Add Option
                </Button>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" className="flex-1 h-7" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-7" onClick={handleCreate} disabled={createPollMutation.isPending}>Launch Poll</Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {polls.length === 0 && !isCreating ? (
            <div className="text-center text-muted-foreground text-xs py-8">
              No polls yet. Start one to engage the audience!
            </div>
          ) : (
            polls.map(poll => (
              <div key={poll.id} className={`border rounded-lg p-3 ${poll.isActive ? 'border-primary/30 bg-card/40' : 'border-border bg-card/20 opacity-70'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-medium">{poll.question}</h4>
                  {poll.isActive ? (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">LIVE</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">CLOSED</Badge>
                  )}
                </div>
                
                <div className="space-y-2 my-3">
                  {poll.options.map(opt => {
                    const totalVotes = poll.options.reduce((acc, o) => acc + o.votes, 0);
                    const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                    
                    return (
                      <div key={opt.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{opt.text}</span>
                          <span className="font-mono">{percentage}% ({opt.votes})</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {poll.isActive && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full h-7 text-xs"
                    onClick={() => closePollMutation.mutate(poll.id)}
                  >
                    <Lock className="w-3 h-3 mr-2" /> End Poll
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
