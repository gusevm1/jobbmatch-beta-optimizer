"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProcessingStage } from "@/types";

interface ProcessingStatusProps {
  stage: ProcessingStage;
}

const PROCESSING_STEPS = [
  "Analyzing CV layout",
  "Optimizing for job match",
  "Generating PDF",
];

const ORBIT_DOTS = [
  { size: 6, duration: 4, offset: 0, opacity: 0.7 },
  { size: 4, duration: 5.5, offset: 120, opacity: 0.5 },
  { size: 3, duration: 7, offset: 210, opacity: 0.35 },
  { size: 5, duration: 6, offset: 60, opacity: 0.6 },
  { size: 2.5, duration: 8, offset: 300, opacity: 0.25 },
];

export function ProcessingStatus({ stage }: ProcessingStatusProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setStepIndex(0);
  }, [stage]);

  useEffect(() => {
    if (stage !== "processing") return;
    if (stepIndex >= PROCESSING_STEPS.length - 1) return;

    const timer = setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, PROCESSING_STEPS.length - 1));
    }, 4000);

    return () => clearTimeout(timer);
  }, [stage, stepIndex]);

  const label =
    stage === "uploading"
      ? "Uploading CV"
      : PROCESSING_STEPS[Math.min(stepIndex, PROCESSING_STEPS.length - 1)];

  // Elapsed time display
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (stage !== "processing" && stage !== "uploading") {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [stage]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (stage !== "uploading" && stage !== "processing") return null;

  return (
    <motion.div
      className="flex flex-col items-center gap-10 py-20"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Glass ring with orbiting dots */}
      <div className="processing-ring-container">
        {/* The rotating glass ring */}
        <div className="processing-ring" />

        {/* Inner glow pulse */}
        <motion.div
          className="processing-ring-glow"
          animate={{
            opacity: [0.15, 0.35, 0.15],
            scale: [0.92, 1, 0.92],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Orbiting dots */}
        {ORBIT_DOTS.map((dot, i) => (
          <motion.div
            key={i}
            className="processing-orbit-dot"
            style={
              {
                width: dot.size,
                height: dot.size,
                "--orbit-duration": `${dot.duration}s`,
                "--orbit-offset": `${dot.offset}deg`,
                opacity: dot.opacity,
              } as React.CSSProperties
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: dot.opacity }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
          />
        ))}

        {/* Center content — elapsed timer */}
        <div className="processing-ring-center">
          <motion.span
            className="font-mono text-xs text-muted-foreground tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {formatTime(elapsed)}
          </motion.span>
        </div>
      </div>

      {/* Glass panel with status text */}
      <motion.div
        className="processing-glass-panel"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={label}
            className="font-mono text-sm font-medium text-foreground tracking-tight"
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {label}
          </motion.p>
        </AnimatePresence>

        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          This may take a minute or two
        </p>
      </motion.div>

      {/* Step progress indicators */}
      {stage === "processing" && (
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {PROCESSING_STEPS.map((_, i) => (
            <motion.div
              key={i}
              className="h-[3px] rounded-full"
              initial={{ width: 16, opacity: 0.15 }}
              animate={{
                width: i <= stepIndex ? 32 : 16,
                opacity: i <= stepIndex ? 0.5 : 0.15,
                backgroundColor:
                  i <= stepIndex
                    ? "var(--foreground)"
                    : "var(--foreground)",
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ backgroundColor: "var(--foreground)" }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
