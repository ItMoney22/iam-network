import { Button } from "@/components/ui/button";
import { 
  Target, 
  PauseCircle, 
  PlayCircle, 
  Dices, 
  HelpCircle, 
  BookOpen, 
  Flame, 
  Snowflake, 
  Coffee,
  Mic
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuickActionsProps {
  onAction: (action: string, payload?: any) => void;
  isAiPaused: boolean;
}

export function QuickActions({ onAction, isAiPaused }: QuickActionsProps) {
  const actions = [
    {
      id: "target_next",
      label: "Target Next",
      icon: Target,
      color: "text-blue-400",
      desc: "Force specific speaker"
    },
    {
      id: "toggle_pause",
      label: isAiPaused ? "Resume AI" : "Pause AI",
      icon: isAiPaused ? PlayCircle : PauseCircle,
      color: isAiPaused ? "text-green-400" : "text-yellow-400",
      desc: "Stop auto-generation"
    },
    {
      id: "random_speaker",
      label: "Random",
      icon: Dices,
      color: "text-purple-400",
      desc: "Pick random speaker"
    },
    {
      id: "ask_question",
      label: "Question",
      icon: HelpCircle,
      color: "text-cyan-400",
      desc: "Insert question template"
    },
    {
      id: "quote_scripture",
      label: "Scripture",
      icon: BookOpen,
      color: "text-amber-400",
      desc: "Quote Bible verse"
    },
    {
      id: "increase_heat",
      label: "Heat Up",
      icon: Flame,
      color: "text-red-500",
      desc: "+10 Debate Heat"
    },
    {
      id: "cool_down",
      label: "Cool Down",
      icon: Snowflake,
      color: "text-blue-300",
      desc: "-10 Debate Heat"
    },
    {
      id: "take_break",
      label: "Break",
      icon: Coffee,
      color: "text-orange-300",
      desc: "Announce break"
    },
    {
      id: "david_mode",
      label: "David Mode",
      icon: Mic,
      color: "text-white",
      desc: "You speak x3 turns"
    }
  ];

  return (
    <div className="flex items-center gap-1 p-2 bg-card/50 backdrop-blur-sm border-t border-border overflow-x-auto">
      <TooltipProvider delayDuration={0}>
        {actions.map((action) => (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-primary/10"
                onClick={() => onAction(action.id)}
              >
                <action.icon className={`w-4 h-4 ${action.color}`} />
                <span className="sr-only">{action.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-semibold">{action.label}</p>
              <p className="text-muted-foreground">{action.desc}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
