"use client";

import { useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";

interface KeywordSearchProps {
  onSearch: (keywords: string) => void;
}

export function KeywordSearch({ onSearch }: KeywordSearchProps) {
  const [keywords, setKeywords] = useState("");

  return (
    <div className="w-full flex flex-col items-center gap-8">
      <div className="w-full max-w-xl flex flex-col gap-4">
        <label
          htmlFor="keywords"
          className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
        >
          Search keywords
        </label>
        <input
          id="keywords"
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && keywords.trim()) {
              onSearch(keywords.trim());
            }
          }}
          placeholder="e.g. data engineering, Python, cloud, internship..."
          className="w-full rounded-xl border border-border bg-background px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors"
        />
        <p className="text-xs text-muted-foreground/60">
          Enter keywords related to the role you&apos;re looking for
        </p>
      </div>
      <GlassButton
        size="lg"
        onClick={() => onSearch(keywords.trim())}
        disabled={!keywords.trim()}
      >
        Find Jobs
      </GlassButton>
    </div>
  );
}
