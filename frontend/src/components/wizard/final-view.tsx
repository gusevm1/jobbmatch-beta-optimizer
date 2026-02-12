"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PdfViewer } from "@/components/pdf-viewer";
import { GlassButton } from "@/components/ui/glass-button";
import type { ChangeProposal } from "@/types";

interface FinalViewProps {
  originalUrl: string;
  optimizedUrl: string;
  highlightedUrl: string;
  originalScore: number;
  acceptedChanges: ChangeProposal[];
  onStartOver: () => void;
}

function ScoreImprovement({ from, to }: { from: number; to: number }) {
  const [animatedTo, setAnimatedTo] = useState(from);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedTo(to), 400);
    return () => clearTimeout(timer);
  }, [to]);

  const toColor =
    animatedTo >= 70 ? "text-emerald-500" : animatedTo >= 40 ? "text-amber-500" : "text-red-400";

  return (
    <motion.div
      className="flex items-center justify-center gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <span className="text-2xl font-semibold tabular-nums text-foreground/40">{from}</span>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-foreground/20">
        <path d="M4 10H16M16 10L12 6M16 10L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <motion.span
        className={`text-2xl font-semibold tabular-nums ${toColor}`}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.4, delay: 0.8 }}
      >
        {animatedTo}
      </motion.span>
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
        / 100
      </span>
    </motion.div>
  );
}

export function FinalView({
  originalUrl,
  optimizedUrl,
  highlightedUrl,
  originalScore,
  acceptedChanges,
  onStartOver,
}: FinalViewProps) {
  // Estimate improved score: +2 per high impact, +1 per medium, +0.5 per low, capped at 95
  const estimatedImprovement = acceptedChanges.reduce((sum, c) => {
    if (c.impact === "high") return sum + 4;
    if (c.impact === "medium") return sum + 2;
    return sum + 1;
  }, 0);
  const improvedScore = Math.min(95, originalScore + estimatedImprovement);

  return (
    <motion.div
      className="flex w-full flex-col gap-10"
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Score improvement */}
      <ScoreImprovement from={originalScore} to={improvedScore} />

      {/* Changes summary */}
      {acceptedChanges.length > 0 && (
        <motion.div
          className="max-w-2xl mx-auto w-full rounded-xl border border-border bg-card/30 p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
            What Changed
          </h3>
          <ul className="space-y-1.5">
            {acceptedChanges.map((change) => (
              <li key={change.id} className="flex items-start gap-2 text-xs text-foreground/70 leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-emerald-400" />
                {change.reason}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* PDF Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Original */}
        <div className="flex flex-col gap-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Original
          </span>
          <div className="rounded-2xl border border-border overflow-hidden">
            <PdfViewer url={originalUrl} />
          </div>
        </div>

        {/* Optimized (highlighted) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Optimized
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/60">
              (changes in green)
            </span>
          </div>
          <div className="rounded-2xl border border-border overflow-hidden">
            <PdfViewer url={highlightedUrl} />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <a href={optimizedUrl} download="optimized-cv.pdf">
            <GlassButton size="lg">
              Download Clean CV
            </GlassButton>
          </a>
          <GlassButton size="default" onClick={onStartOver}>
            Start Over
          </GlassButton>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground/60">
          The downloaded version has no highlighting
        </p>
      </div>
    </motion.div>
  );
}
