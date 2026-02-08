"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProcessingStatus } from "@/components/processing-status";
import { ComparisonView } from "@/components/comparison-view";
import { GlassButton } from "@/components/ui/glass-button";
import { useAppState } from "@/lib/app-state";
import { processCV, getOriginalPdfUrl, getOptimizedPdfUrl, getHighlightedPdfUrl } from "@/lib/api-client";

type OptimizeStage = "processing" | "done" | "error";

export default function BetaOptimizePage() {
  const router = useRouter();
  const { cvId, result, setResult, error, setError, reset } = useAppState();
  const [stage, setStage] = useState<OptimizeStage>(result ? "done" : "processing");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    if (result) { setStage("done"); return; }
    if (!cvId) { router.replace("/onboarding"); return; }

    hasStarted.current = true;

    processCV(cvId)
      .then((res) => {
        setResult(res);
        setStage("done");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
        setStage("error");
      });
  }, [cvId, result, router, setResult, setError]);

  const handleStartOver = () => {
    reset();
    router.push("/onboarding");
  };

  const heading = stage === "done"
    ? "Your optimized CV"
    : stage === "error"
      ? "Something went wrong"
      : "Working on it";

  const maxWidth = stage === "done" ? "max-w-6xl" : "max-w-2xl";

  return (
    <AppShell heading={heading} maxWidth={maxWidth}>
      {stage === "processing" && (
        <ProcessingStatus stage="processing" />
      )}

      {stage === "done" && result && (
        <ComparisonView
          originalUrl={getOriginalPdfUrl(result.id)}
          optimizedUrl={getOptimizedPdfUrl(result.id)}
          highlightedUrl={getHighlightedPdfUrl(result.id)}
          changesSummary={result.changes_summary}
          onStartOver={handleStartOver}
        />
      )}

      {stage === "error" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-sm text-destructive">{error}</p>
          <GlassButton size="default" onClick={handleStartOver}>
            Try Again
          </GlassButton>
        </div>
      )}
    </AppShell>
  );
}
