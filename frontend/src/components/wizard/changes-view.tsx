"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/glass-button";
import type { ChangeProposal } from "@/types";

interface ChangesViewProps {
  changes: ChangeProposal[];
  onContinue: () => void;
  onBack: () => void;
}

const impactConfig = {
  high: { label: "High", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  medium: { label: "Med", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  low: { label: "Low", color: "bg-foreground/5 text-foreground/50" },
};

export function ChangesView({ changes, onContinue, onBack }: ChangesViewProps) {
  // Group changes by section
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
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {changes.length} change{changes.length !== 1 ? "s" : ""} suggested to better align your CV
        </p>
      </div>

      {/* Grouped changes */}
      {grouped.map(([section, sectionChanges], sectionIdx) => (
        <motion.div
          key={section}
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + sectionIdx * 0.1 }}
        >
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {section}
          </h3>

          <div className="space-y-3">
            {sectionChanges.map((change, changeIdx) => {
              const impact = impactConfig[change.impact as keyof typeof impactConfig] || impactConfig.low;
              return (
                <motion.div
                  key={change.id}
                  className="rounded-xl border border-border bg-card/30 p-4 space-y-3"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + sectionIdx * 0.1 + changeIdx * 0.06 }}
                >
                  {/* Header: impact + reason */}
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-foreground/60 leading-relaxed flex-1">
                      {change.reason}
                    </p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono ${impact.color}`}>
                      {impact.label}
                    </span>
                  </div>

                  {/* Diff: original → proposed */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-2.5">
                      <span className="block text-[10px] font-mono text-red-400/60 uppercase tracking-wider mb-1">
                        Original
                      </span>
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        {change.original_text}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2.5">
                      <span className="block text-[10px] font-mono text-emerald-400/60 uppercase tracking-wider mb-1">
                        Proposed
                      </span>
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        {change.proposed_text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Navigation */}
      <motion.div
        className="flex items-center justify-center gap-4 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={onBack}
          className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          Back
        </button>
        <GlassButton size="default" onClick={onContinue}>
          Choose Changes to Apply
        </GlassButton>
      </motion.div>
    </motion.div>
  );
}
