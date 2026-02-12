"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/glass-button";
import type { AnalysisIssue, AnalysisStrength, ChangeProposal, SectionScore } from "@/types";

interface AnalysisViewProps {
  score: number;
  scoreLabel: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  sectionScores: SectionScore[];
  issues: AnalysisIssue[];
  strengths: AnalysisStrength[];
  changes: ChangeProposal[];
  onContinue: (selectedSections: string[], selectedKeywords: string[]) => void;
}

/* ── Score Ring ── */
function ScoreRing({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const scoreColor =
    score >= 70 ? "text-emerald-500" : score >= 40 ? "text-amber-500" : "text-red-400";
  const strokeColor =
    score >= 70 ? "stroke-emerald-500" : score >= 40 ? "stroke-amber-500" : "stroke-red-400";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="120" height="120" className="-rotate-90">
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke="currentColor" strokeWidth="5"
          className="text-foreground/5"
        />
        <motion.circle
          cx="60" cy="60" r={radius} fill="none"
          strokeWidth="5" strokeLinecap="round"
          className={strokeColor}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`text-2xl font-semibold tabular-nums ${scoreColor}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {animatedScore}
        </motion.span>
        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">
          / 100
        </span>
      </div>
    </div>
  );
}

/* ── Relevance badge ── */
const relevanceConfig = {
  strong: { label: "Strong", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  moderate: { label: "Moderate", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  weak: { label: "Weak", cls: "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20" },
};

export function AnalysisView({
  score,
  scoreLabel,
  matchedKeywords,
  missingKeywords,
  sectionScores,
  issues,
  strengths,
  changes,
  onContinue,
}: AnalysisViewProps) {
  // Derive available sections from changes
  const availableSections = useMemo(() => {
    const secs = new Set<string>();
    for (const c of changes) secs.add(c.section);
    return Array.from(secs);
  }, [changes]);

  // Section toggles — all enabled by default
  const [enabledSections, setEnabledSections] = useState<Set<string>>(
    () => new Set(availableSections)
  );

  // Missing keyword selection — all selected by default
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(
    () => new Set(missingKeywords)
  );

  const toggleSection = (section: string) => {
    setEnabledSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(kw)) next.delete(kw);
      else next.add(kw);
      return next;
    });
  };

  const handleContinue = () => {
    onContinue(Array.from(enabledSections), Array.from(selectedKeywords));
  };

  // Count changes in enabled sections
  const enabledChangesCount = changes.filter((c) => enabledSections.has(c.section)).length;

  return (
    <motion.div
      className="flex flex-col gap-8 w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Top: Score ring + label */}
      <div className="flex flex-col items-center gap-2">
        <ScoreRing score={score} />
        <motion.p
          className="text-sm font-medium text-foreground/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {scoreLabel}
        </motion.p>
      </div>

      {/* Comparison table */}
      <motion.div
        className="rounded-xl border border-border bg-card/30 overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Keywords row */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Job Keywords
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground/60">
              {matchedKeywords.length}/{matchedKeywords.length + missingKeywords.length} matched
            </span>
          </div>

          {/* Matched keywords */}
          {matchedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {matchedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                    <path d="M2 5.2L4.2 7.4L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Missing keywords (selectable chips) */}
          {missingKeywords.length > 0 && (
            <div>
              <span className="block text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-1.5">
                Missing — click to select for injection
              </span>
              <div className="flex flex-wrap gap-1.5">
                {missingKeywords.map((kw) => {
                  const isSelected = selectedKeywords.has(kw);
                  return (
                    <button
                      key={kw}
                      onClick={() => toggleKeyword(kw)}
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] transition-all duration-200 ${
                        isSelected
                          ? "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "border-border/50 bg-card/20 text-foreground/40 hover:text-foreground/60"
                      }`}
                    >
                      {isSelected && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="mr-1 shrink-0">
                          <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {kw}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Section scores row */}
        {sectionScores.length > 0 && (
          <div className="p-4">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Section Relevance
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sectionScores.map((ss) => {
                const config = relevanceConfig[ss.relevance as keyof typeof relevanceConfig] || relevanceConfig.weak;
                return (
                  <div
                    key={ss.section}
                    className={`rounded-lg border px-3 py-2 text-center ${config.cls}`}
                  >
                    <span className="block text-[10px] font-mono uppercase tracking-wider opacity-60 mb-0.5">
                      {ss.section}
                    </span>
                    <span className="text-xs font-medium">
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* Issues & Strengths — compact */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {issues.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Issues Found
            </h3>
            <ul className="space-y-1.5">
              {issues.slice(0, 4).map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/70 leading-relaxed">
                  <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                    issue.severity === "high" ? "bg-red-400" :
                    issue.severity === "medium" ? "bg-amber-400" : "bg-foreground/30"
                  }`} />
                  {issue.text}
                </li>
              ))}
              {issues.length > 4 && (
                <li className="text-[10px] text-muted-foreground/50 font-mono pl-3.5">
                  +{issues.length - 4} more
                </li>
              )}
            </ul>
          </div>
        )}
        {strengths.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Strengths
            </h3>
            <ul className="space-y-1.5">
              {strengths.slice(0, 4).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/70 leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-emerald-400" />
                  {s.text}
                </li>
              ))}
              {strengths.length > 4 && (
                <li className="text-[10px] text-muted-foreground/50 font-mono pl-3.5">
                  +{strengths.length - 4} more
                </li>
              )}
            </ul>
          </div>
        )}
      </motion.div>

      {/* Section toggles */}
      {availableSections.length > 0 && (
        <motion.div
          className="rounded-xl border border-border bg-card/30 p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Sections to Optimize
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableSections.map((section) => {
              const isEnabled = enabledSections.has(section);
              const count = changes.filter((c) => c.section === section).length;
              return (
                <button
                  key={section}
                  onClick={() => toggleSection(section)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all duration-200 ${
                    isEnabled
                      ? "border-foreground/20 bg-foreground/5 text-foreground"
                      : "border-border/50 bg-card/10 text-foreground/30"
                  }`}
                >
                  <div
                    className={`h-3.5 w-3.5 rounded border flex items-center justify-center transition-all duration-200 ${
                      isEnabled
                        ? "border-foreground/40 bg-foreground text-background"
                        : "border-foreground/15"
                    }`}
                  >
                    {isEnabled && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {section}
                  <span className="text-[10px] font-mono text-muted-foreground/50">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Continue */}
      <motion.div
        className="flex flex-col items-center gap-2 mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {enabledChangesCount > 0 ? (
          <>
            <GlassButton size="default" onClick={handleContinue}>
              Improve My Resume ({enabledChangesCount} change{enabledChangesCount !== 1 ? "s" : ""})
            </GlassButton>
            <p className="text-[10px] font-mono text-muted-foreground/60">
              You&apos;ll review each change before applying
            </p>
          </>
        ) : (
          <div className="text-center">
            <p className="text-sm text-foreground/60 mb-4">
              No sections selected. Enable at least one section to continue.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
