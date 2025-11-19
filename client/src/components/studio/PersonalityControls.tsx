import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sliders, RefreshCcw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Character } from "@shared/schema";

interface PersonalityControlsProps {
  activeCharacters: Character[];
}

export function PersonalityControls({ activeCharacters }: PersonalityControlsProps) {
  const [selectedCharId, setSelectedCharId] = useState<string>(activeCharacters[0]?.id || "");
  const [traits, setTraits] = useState({
    engagement: 80,
    depth: 80,
    challenge: 50,
    spirituality: 70,
    humor: 30,
  });
  const [isDirty, setIsDirty] = useState(false);

  const queryClient = useQueryClient();

  const selectedChar = activeCharacters.find(c => c.id === selectedCharId);

  // Initialize traits when character is selected
  useEffect(() => {
    if (selectedChar) {
      setTraits({
        engagement: selectedChar.engagement,
        depth: selectedChar.depth,
        challenge: selectedChar.challenge,
        spirituality: selectedChar.spirituality,
        humor: selectedChar.humor,
      });
      setIsDirty(false);
    } else if (activeCharacters.length > 0 && !selectedCharId) {
        setSelectedCharId(activeCharacters[0].id);
    }
  }, [selectedChar, selectedCharId, activeCharacters]);

  const updateMutation = useMutation({
    mutationFn: async (newTraits: typeof traits) => {
      const res = await apiRequest("PATCH", `/api/characters/${selectedCharId}/personality`, newTraits);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters/active"] });
      setIsDirty(false);
    },
  });

  const handleSliderChange = (key: keyof typeof traits, value: number[]) => {
    setTraits(prev => ({ ...prev, [key]: value[0] }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateMutation.mutate(traits);
  };

  const handleReset = () => {
     if (selectedChar) {
      setTraits({
        engagement: selectedChar.engagement,
        depth: selectedChar.depth,
        challenge: selectedChar.challenge,
        spirituality: selectedChar.spirituality,
        humor: selectedChar.humor,
      });
      setIsDirty(false);
    }
  }

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="px-4 py-3 border-b border-border">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          Personality Tuner
        </CardTitle>
      </CardHeader>
      <div className="p-4 space-y-6">
        {/* Character Selector */}
        <Select value={selectedCharId} onValueChange={setSelectedCharId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Character" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {activeCharacters.map((char) => (
                <SelectItem key={char.id} value={char.id}>
                  {char.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Sliders */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <Label>Engagement (Talkativeness)</Label>
              <span className="text-muted-foreground">{traits.engagement}%</span>
            </div>
            <Slider 
              value={[traits.engagement]} 
              max={100} 
              step={5} 
              onValueChange={(val) => handleSliderChange('engagement', val)} 
              className="[&>.bg-primary]:bg-green-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <Label>Depth (Intellect)</Label>
              <span className="text-muted-foreground">{traits.depth}%</span>
            </div>
            <Slider 
              value={[traits.depth]} 
              max={100} 
              step={5} 
              onValueChange={(val) => handleSliderChange('depth', val)} 
              className="[&>.bg-primary]:bg-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <Label>Challenge (Debate Heat)</Label>
              <span className="text-muted-foreground">{traits.challenge}%</span>
            </div>
            <Slider 
              value={[traits.challenge]} 
              max={100} 
              step={5} 
              onValueChange={(val) => handleSliderChange('challenge', val)}
              className="[&>.bg-primary]:bg-red-500" 
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <Label>Spirituality (Mysticism)</Label>
              <span className="text-muted-foreground">{traits.spirituality}%</span>
            </div>
            <Slider 
              value={[traits.spirituality]} 
              max={100} 
              step={5} 
              onValueChange={(val) => handleSliderChange('spirituality', val)} 
              className="[&>.bg-primary]:bg-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <Label>Humor (Lightness)</Label>
              <span className="text-muted-foreground">{traits.humor}%</span>
            </div>
            <Slider 
              value={[traits.humor]} 
              max={100} 
              step={5} 
              onValueChange={(val) => handleSliderChange('humor', val)} 
              className="[&>.bg-primary]:bg-yellow-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleReset}
            disabled={!isDirty}
          >
            <RefreshCcw className="w-3 h-3 mr-2" />
            Reset
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
