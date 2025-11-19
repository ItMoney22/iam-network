import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Clapperboard, Play, Save, Wand2 } from "lucide-react";
import { Character } from "@shared/schema";

interface DirectorModeProps {
  activeCharacters: Character[];
  onExecutePlan: (plan: any) => void;
}

export function DirectorMode({ activeCharacters, onExecutePlan }: DirectorModeProps) {
  const [turns, setTurns] = useState([
    { speaker: "david", intent: "Pose a question about consciousness" },
    { speaker: "marcus", intent: "Selects Elena to challenge the premise" },
    { speaker: "elena", intent: "Provide skeptical scientific viewpoint" }
  ]);

  const handleUpdateTurn = (index: number, field: string, value: string) => {
    const newTurns = [...turns];
    newTurns[index] = { ...newTurns[index], [field]: value };
    setTurns(newTurns);
  };

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="px-4 py-3 border-b border-border">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-primary" />
          Director Mode
        </CardTitle>
      </CardHeader>
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        <p className="text-xs text-muted-foreground">
          Script the next sequence of the conversation. The AI router will attempt to follow this flow.
        </p>
        
        <div className="space-y-3">
          {turns.map((turn, index) => (
            <div key={index} className="p-3 bg-card/50 border border-border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">Turn {index + 1}</Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <Label className="text-[10px]">Speaker</Label>
                  <Select 
                    value={turn.speaker} 
                    onValueChange={(val) => handleUpdateTurn(index, 'speaker', val)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="david">David (You)</SelectItem>
                      {activeCharacters.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-[10px]">Intent / Action</Label>
                  <Input 
                    value={turn.intent} 
                    onChange={(e) => handleUpdateTurn(index, 'intent', e.target.value)}
                    className="h-7 text-xs" 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-2">
            <Wand2 className="w-3 h-3" /> Auto-Generate
          </Button>
          <Button size="sm" className="flex-1 gap-2 bg-primary text-primary-foreground">
            <Play className="w-3 h-3" /> Execute Sequence
          </Button>
        </div>
      </div>
    </Card>
  );
}

import { Badge } from "@/components/ui/badge";
