"use client";

import { useState, useRef, useCallback } from "react";

interface KeywordSearchProps {
  chips: string[];
  onChipsChange: (chips: string[]) => void;
  disabled?: boolean;
}

const SUGGESTIONS = [
  "data engineering",
  "Python",
  "cloud",
  "SQL",
  "machine learning",
  "Java",
  "CI/CD",
  "Kubernetes",
  "DevOps",
  "deep learning",
];

export function KeywordSearch({ chips, onChipsChange, disabled }: KeywordSearchProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addChip = useCallback((value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;
    if (chips.includes(trimmed)) {
      setInputValue("");
      return;
    }
    onChipsChange([...chips, trimmed]);
    setInputValue("");
  }, [chips, onChipsChange]);

  const removeChip = useCallback((index: number) => {
    onChipsChange(chips.filter((_, i) => i !== index));
  }, [chips, onChipsChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        addChip(inputValue);
      } else if (e.key === "Backspace" && !inputValue && chips.length > 0) {
        removeChip(chips.length - 1);
      }
    },
    [inputValue, chips, addChip, removeChip]
  );

  // Filter out suggestions that are already added as chips
  const availableSuggestions = SUGGESTIONS.filter(
    (s) => !chips.includes(s.toLowerCase())
  );

  return (
    <div className={`w-full flex flex-col gap-4 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Input field — clean, clear text box */}
      <div className="glass-input-container px-4 py-3.5">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. data engineering, Python, cloud..."
          disabled={disabled}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground/50">
        Press Enter to add &middot; click suggestions below
      </p>

      {/* Active chips — glass bubbles below the input */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip, i) => (
            <span key={`${chip}-${i}`} className="keyword-chip">
              <span className="keyword-chip-text">
                {chip}
                <button
                  type="button"
                  onClick={() => removeChip(i)}
                  className="ml-1.5 opacity-50 hover:opacity-100 transition-opacity leading-none"
                >
                  &times;
                </button>
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="flex flex-col gap-2.5">
        <p className="text-xs text-muted-foreground/50">
          Suggested keywords based on your CV &middot; click to add
        </p>
        <div className="flex flex-wrap gap-2">
          {availableSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addChip(suggestion)}
              className="keyword-suggestion"
            >
              {suggestion}
            </button>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}
