"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/glass-button";
import type { ChangeProposal } from "@/types";

interface ReviewViewProps {
  changes: ChangeProposal[];
  acceptedIds: Set<string>;
  selectedKeywords: string[];
  onToggle: (id: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onFinalize: () => void;
  onBack: () => void;
}

const impactConfig = {
  high: { label: "High", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  medium: { label: "Med", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  low: { label: "Low", color: "bg-foreground/5 text-foreground/50" },
};

export function ReviewView({
  changes,
  acceptedIds,
  selectedKeywords,
  onToggle,
  onAcceptAll,
  onRejectAll,
  onFinalize,
  onBack,
}: ReviewViewProps) {
  const acceptedCount = acceptedIds.size;
  const totalCount = changes.length;

  const grouped = useMemo(() => {
    const groups: Record<string, ChangeProposal[]> = {};
    for (const change of changes) {
      const section = change.section || "Other";
      if (!groups[section]) groups[section] = [];
      groups[section].push(change);
    }
    return Object.entries(groups);
  }, [changes]);

  return (
    <motion.div
      className="flex flex-col gap-8 w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {acceptedCount} of {totalCount} changes selected
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onAcceptAll}
            className="text-xs font-mono text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            Accept All
          </button>
          <span className="text-foreground/10">|</span>
          <button
            onClick={onRejectAll}
            className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors"
          >
            Reject All
          </button>
        </div>
      </div>

      {/* Keyword info banner */}
      {selectedKeywords.length > 0 && (
        <motion.div
          className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1.5 font-medium">
            Keywords to inject
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-600 dark:text-amber-400"
              >
                {kw}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Changes with toggles */}
      {grouped.map(([section, sectionChanges], sectionIdx) => (
        <motion.div
          key={section}
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 + sectionIdx * 0.08 }}
        >
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {section}
          </h3>

          <div className="space-y-2">
            {sectionChanges.map((change) => {
              const isAccepted = acceptedIds.has(change.id);
              const impact = impactConfig[change.impact as keyof typeof impactConfig] || impactConfig.low;
              return (
                <button
                  key={change.id}
                  onClick={() => onToggle(change.id)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all duration-200 ${
                    isAccepted
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-border/50 bg-card/20 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Toggle indicator */}
                    <div
                      className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
                        isAccepted
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-foreground/20"
                      }`}
                    >
                      {isAccepted && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path
                            d="M1.5 4L3.2 5.7L6.5 2.3"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-foreground/60 leading-relaxed flex-1">
                          {change.reason}
                        </p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono ${impact.color}`}>
                          {impact.label}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-[11px]">
                        <span className="text-red-400/60 line-through leading-relaxed flex-1">
                          {change.original_text.length > 80
                            ? change.original_text.slice(0, 80) + "\u2026"
                            : change.original_text}
                        </span>
                        <span className="text-foreground/10 shrink-0">{"\u2192"}</span>
                        <span className="text-emerald-500/70 leading-relaxed flex-1">
                          {change.proposed_text.length > 80
                            ? change.proposed_text.slice(0, 80) + "\u2026"
                            : change.proposed_text}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Navigation */}
      <motion.div
        className="flex flex-col items-center gap-3 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            Back
          </button>
          <GlassButton
            size="default"
            onClick={onFinalize}
            disabled={acceptedCount === 0}
          >
            Finalize ({acceptedCount} change{acceptedCount !== 1 ? "s" : ""})
          </GlassButton>
        </div>
        {acceptedCount === 0 && (
          <p className="text-[10px] font-mono text-red-400/60">
            Select at least one change to continue
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
