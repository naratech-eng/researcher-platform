import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FeatureFlag {
  id: string;
  label: string;
  enabled: boolean;
}

export function FeatureFlagPopover() {
  const [features, setFeatures] = useState<FeatureFlag[]>([
    { id: "rag", label: "RAG", enabled: true },
    { id: "literature", label: "Literature", enabled: true },
    { id: "citation", label: "Citation", enabled: false },
    { id: "web_search", label: "Web Search", enabled: false },
  ]);

  const toggleFeature = (id: string) => {
    setFeatures(features.map(f => 
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 bg-popover z-50" align="start">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Feature Flags</h4>
          <div className="space-y-3">
            {features.map((feature) => (
              <div key={feature.id} className="flex items-center space-x-2">
                <Checkbox
                  id={feature.id}
                  checked={feature.enabled}
                  onCheckedChange={() => toggleFeature(feature.id)}
                />
                <Label
                  htmlFor={feature.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {feature.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
