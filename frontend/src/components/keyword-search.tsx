"use client";

import { useState, useRef, useCallback } from "react";

interface KeywordSearchProps {
  chips: string[];
  onChipsChange: (chips: string[]) => void;
  disabled?: boolean;
}

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

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        className={`glass-input-container flex flex-wrap items-center gap-2 px-4 py-3 min-h-[52px] cursor-text ${
          disabled ? "opacity-50 pointer-events-none" : ""
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {chips.map((chip, i) => (
          <span key={`${chip}-${i}`} className="glass-chip text-xs font-mono">
            {chip}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeChip(i);
              }}
              className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors leading-none"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={chips.length === 0 ? "Type a keyword and press Enter..." : "Add another..."}
          disabled={disabled}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>
      <p className="text-xs text-muted-foreground/60">
        Press Enter to add keywords &middot; Backspace to remove
      </p>
    </div>
  );
}
