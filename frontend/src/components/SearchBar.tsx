import { useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Wire up global search once backend endpoints are ready.
    console.info("Searching for", query);
  };

  const handleReset = () => {
    setQuery("");
    setExpanded(false);
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      {expanded && (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200"
        >
          <div className="relative">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects, datasets, commands..."
              autoFocus
              className="w-64 pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={handleReset}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button type="submit" size="sm">
            Run
          </Button>
        </form>
      )}

      {!expanded && (
        <Button variant="ghost" size="icon" onClick={() => setExpanded(true)}>
          <Search className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
