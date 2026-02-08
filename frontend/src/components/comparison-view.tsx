"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { PdfViewer } from "@/components/pdf-viewer";
import { GlassButton } from "@/components/ui/glass-button";

interface ComparisonViewProps {
  originalUrl: string;
  optimizedUrl: string;
  highlightedUrl: string;
  changesSummary: string;
  onStartOver: () => void;
}

export function ComparisonView({
  originalUrl,
  optimizedUrl,
  highlightedUrl,
  changesSummary,
  onStartOver,
}: ComparisonViewProps) {
  const [showSummary, setShowSummary] = useState(false);

  return (
    <div className="flex w-full flex-col gap-10 animate-fade-in-up">
      {/* PDF Panels — side by side desktop, stacked mobile */}
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

      {/* Changes Summary — expandable */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <span
            className={`inline-block transition-transform duration-200 ${
              showSummary ? "rotate-90" : ""
            }`}
          >
            ▸
          </span>
          Changes summary
        </button>
        {showSummary && (
          <div className="rounded-xl border border-border bg-card/50 p-4 animate-fade-in-up">
            <div className="prose-summary font-mono text-xs leading-relaxed text-muted-foreground">
              <ReactMarkdown
                components={{
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 space-y-1.5 mt-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 space-y-1.5 mt-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  h1: ({ children }) => (
                    <h3 className="text-sm font-semibold text-foreground mb-2">{children}</h3>
                  ),
                  h2: ({ children }) => (
                    <h3 className="text-sm font-semibold text-foreground mb-2">{children}</h3>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xs font-semibold text-foreground mb-1">{children}</h3>
                  ),
                }}
              >
                {changesSummary}
              </ReactMarkdown>
            </div>
          </div>
        )}
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
    </div>
  );
}
