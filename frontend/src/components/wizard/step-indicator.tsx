"use client";

import { motion } from "framer-motion";

const STEPS = [
  { label: "See Your Difference", number: 1 },
  { label: "Review Changes", number: 2 },
  { label: "Your Optimized CV", number: 3 },
];

interface StepIndicatorProps {
  current: 1 | 2 | 3;
}

export function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      {STEPS.map((step, i) => {
        const isActive = step.number === current;
        const isDone = step.number < current;
        return (
          <div key={step.number} className="flex items-center gap-3">
            {i > 0 && (
              <div
                className={`h-px w-8 transition-colors duration-300 ${
                  isDone ? "bg-foreground/40" : "bg-foreground/10"
                }`}
              />
            )}
            <div className="flex items-center gap-2">
              <motion.div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-mono transition-colors duration-300 ${
                  isActive
                    ? "bg-foreground text-background"
                    : isDone
                      ? "bg-foreground/20 text-foreground"
                      : "bg-foreground/5 text-foreground/30"
                }`}
                animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                {isDone ? "\u2713" : step.number}
              </motion.div>
              <span
                className={`hidden sm:block text-xs font-mono tracking-tight transition-colors duration-300 ${
                  isActive
                    ? "text-foreground"
                    : isDone
                      ? "text-foreground/50"
                      : "text-foreground/25"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
