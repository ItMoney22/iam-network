import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MessageTemplatesProps {
  onSelect: (text: string) => void;
}

export function MessageTemplates({ onSelect }: MessageTemplatesProps) {
  const templates = {
    "Host Responses": [
      "That's an excellent point, let's dive deeper into that.",
      "I'd like to hear what the others think about this.",
      "From my book, I Am GOD, we learn that consciousness is fundamental.",
      "Let's verify that with scripture.",
      "Great question from the chat..."
    ],
    "Direction": [
      "Let's shift gears to the next topic.",
      "We're getting a bit off track, let's bring it back to the main theme.",
      "We're running out of time, final thoughts?",
      "I want to challenge that assumption."
    ],
    "Scripture": [
      "As it says in John 8:58 - 'Before Abraham was, I am.'",
      "Consider Psalm 46:10 - 'Be still, and know that I am God.'",
      "Remember Exodus 3:14 - 'I AM WHO I AM.'"
    ]
  };

  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger className="w-[200px] h-8 text-xs bg-background/50 border-dashed">
        <SelectValue placeholder="Select Template..." />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(templates).map(([category, items]) => (
          <SelectGroup key={category}>
            <SelectLabel className="text-xs text-muted-foreground font-normal uppercase tracking-wider">
              {category}
            </SelectLabel>
            {items.map((item, idx) => (
              <SelectItem 
                key={`${category}-${idx}`} 
                value={item}
                className="text-xs cursor-pointer"
              >
                {item.length > 40 ? item.substring(0, 40) + "..." : item}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
