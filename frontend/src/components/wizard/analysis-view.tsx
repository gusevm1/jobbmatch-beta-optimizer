"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/glass-button";
import type { AnalysisIssue, AnalysisStrength } from "@/types";

interface AnalysisViewProps {
  score: number;
  scoreLabel: string;
  issues: AnalysisIssue[];
  strengths: AnalysisStrength[];
  changesCount: number;
  onContinue: () => void;
}

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
    score >= 70
      ? "text-emerald-500"
      : score >= 40
        ? "text-amber-500"
        : "text-red-400";

  const strokeColor =
    score >= 70
      ? "stroke-emerald-500"
      : score >= 40
        ? "stroke-amber-500"
        : "stroke-red-400";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        {/* Background track */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-foreground/5"
        />
        {/* Score arc */}
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={strokeColor}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`text-3xl font-semibold tabular-nums ${scoreColor}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {animatedScore}
        </motion.span>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">
          / 100
        </span>
      </div>
    </div>
  );
}

const severityConfig = {
  high: { dot: "bg-red-400", text: "text-red-400/80" },
  medium: { dot: "bg-amber-400", text: "text-amber-400/80" },
  low: { dot: "bg-foreground/30", text: "text-foreground/40" },
};

export function AnalysisView({
  score,
  scoreLabel,
  issues,
  strengths,
  changesCount,
  onContinue,
}: AnalysisViewProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-8"
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Score ring */}
      <ScoreRing score={score} />

      <motion.p
        className="text-sm font-medium text-foreground/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {scoreLabel}
      </motion.p>

      {/* Issues & Strengths */}
      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Issues */}
        {issues.length > 0 && (
          <motion.div
            className="flex flex-col gap-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Issues Found
            </h3>
            <ul className="space-y-2">
              {issues.map((issue, i) => {
                const config = severityConfig[issue.severity as keyof typeof severityConfig] || severityConfig.low;
                return (
                  <motion.li
                    key={i}
                    className="flex items-start gap-2 text-xs text-foreground/70 leading-relaxed"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                  >
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${config.dot}`} />
                    {issue.text}
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <motion.div
            className="flex flex-col gap-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Strengths
            </h3>
            <ul className="space-y-2">
              {strengths.map((strength, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-2 text-xs text-foreground/70 leading-relaxed"
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-emerald-400" />
                  {strength.text}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>

      {/* Continue */}
      <motion.div
        className="flex flex-col items-center gap-2 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {changesCount > 0 ? (
          <>
            <GlassButton size="default" onClick={onContinue}>
              View {changesCount} Suggested Change{changesCount !== 1 ? "s" : ""}
            </GlassButton>
            <p className="text-[10px] font-mono text-muted-foreground/60">
              You&apos;ll choose which changes to apply
            </p>
          </>
        ) : (
          <div className="text-center">
            <p className="text-sm text-foreground/60 mb-4">
              Your CV already aligns well with this position.
            </p>
            <GlassButton size="default" onClick={onContinue}>
              Start Over
            </GlassButton>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
