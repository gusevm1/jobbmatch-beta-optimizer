"use client";

import { motion } from "framer-motion";
import { PdfViewer } from "@/components/pdf-viewer";
import { GlassButton } from "@/components/ui/glass-button";

interface FinalViewProps {
  originalUrl: string;
  optimizedUrl: string;
  highlightedUrl: string;
  onStartOver: () => void;
}

export function FinalView({
  originalUrl,
  optimizedUrl,
  highlightedUrl,
  onStartOver,
}: FinalViewProps) {
  return (
    <motion.div
      className="flex w-full flex-col gap-10"
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
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
