"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { ProcessingStatus } from "@/components/processing-status";
import { StepIndicator } from "@/components/wizard/step-indicator";
import { AnalysisView } from "@/components/wizard/analysis-view";
import { ChangesView } from "@/components/wizard/changes-view";
import { ReviewView } from "@/components/wizard/review-view";
import { FinalView } from "@/components/wizard/final-view";
import { GlassButton } from "@/components/ui/glass-button";
import { useAppState } from "@/lib/app-state";
import {
  analyzeCV,
  applyChanges,
  getOriginalPdfUrl,
  getOptimizedPdfUrl,
  getHighlightedPdfUrl,
} from "@/lib/api-client";
import type { WizardStep, CVAnalyzeResponse, CVApplyResponse } from "@/types";

export default function BetaOptimizePage() {
  const router = useRouter();
  const { cvId, selectedJob, reset } = useAppState();

  const [step, setStep] = useState<WizardStep>("analyzing");
  const [analysis, setAnalysis] = useState<CVAnalyzeResponse | null>(null);
  const [applyResult, setApplyResult] = useState<CVApplyResponse | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  // Start analysis on mount
  useEffect(() => {
    if (hasStarted.current) return;
    if (!cvId || !selectedJob) {
      router.replace("/onboarding");
      return;
    }

    hasStarted.current = true;

    const minDelay = new Promise((r) => setTimeout(r, 3000));

    Promise.all([
      analyzeCV(cvId, {
        title: selectedJob.title,
        company: selectedJob.company,
        location: selectedJob.location,
        type: selectedJob.type,
        description: selectedJob.description,
        keywords: selectedJob.keywords,
      }),
      minDelay,
    ])
      .then(([res]) => {
        setAnalysis(res);
        // Pre-select all changes
        setAcceptedIds(new Set(res.changes.map((c) => c.id)));
        setStep("score");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Analysis failed");
        setStep("error");
      });
  }, [cvId, selectedJob, router]);

  const handleStartOver = useCallback(() => {
    reset();
    router.push("/onboarding");
  }, [reset, router]);

  const handleToggle = useCallback((id: string) => {
    setAcceptedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAcceptAll = useCallback(() => {
    if (!analysis) return;
    setAcceptedIds(new Set(analysis.changes.map((c) => c.id)));
  }, [analysis]);

  const handleRejectAll = useCallback(() => {
    setAcceptedIds(new Set());
  }, []);

  const handleFinalize = useCallback(() => {
    if (!analysis || !cvId) return;
    setStep("compiling");

    const minDelay = new Promise((r) => setTimeout(r, 2000));

    Promise.all([
      applyChanges(cvId, analysis.job_id, Array.from(acceptedIds)),
      minDelay,
    ])
      .then(([res]) => {
        setApplyResult(res);
        setStep("done");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Compilation failed");
        setStep("error");
      });
  }, [analysis, cvId, acceptedIds]);

  // Dynamic heading and width
  const heading = (() => {
    switch (step) {
      case "analyzing":
      case "compiling":
        return "Working on it";
      case "score":
        return "See Your Difference";
      case "changes":
        return "Align Your Resume";
      case "review":
        return "Review Your Resume";
      case "done":
        return "Your Optimized CV";
      case "error":
        return "Something went wrong";
      default:
        return "";
    }
  })();

  const maxWidth = step === "done" ? "max-w-6xl" : "max-w-2xl";

  // Which step indicator number to show
  const stepNumber: 1 | 2 | 3 | null = (() => {
    switch (step) {
      case "score":
        return 1;
      case "changes":
        return 2;
      case "review":
        return 3;
      default:
        return null;
    }
  })();

  return (
    <AppShell heading={heading} maxWidth={maxWidth}>
      {/* Step indicator — only for the 3 interactive steps */}
      {stepNumber && <StepIndicator current={stepNumber} />}

      <AnimatePresence mode="wait">
        {/* Analyzing loading state */}
        {step === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.4 }}
          >
            <ProcessingStatus stage="processing" />
          </motion.div>
        )}

        {/* Step 1: Score + Issues/Strengths */}
        {step === "score" && analysis && (
          <AnalysisView
            key="score"
            score={analysis.score}
            scoreLabel={analysis.score_label}
            issues={analysis.issues}
            strengths={analysis.strengths}
            changesCount={analysis.changes.length}
            onContinue={
              analysis.changes.length > 0
                ? () => setStep("changes")
                : handleStartOver
            }
          />
        )}

        {/* Step 2: View All Changes */}
        {step === "changes" && analysis && (
          <ChangesView
            key="changes"
            changes={analysis.changes}
            onContinue={() => setStep("review")}
            onBack={() => setStep("score")}
          />
        )}

        {/* Step 3: Accept/Reject Changes */}
        {step === "review" && analysis && (
          <ReviewView
            key="review"
            changes={analysis.changes}
            acceptedIds={acceptedIds}
            onToggle={handleToggle}
            onAcceptAll={handleAcceptAll}
            onRejectAll={handleRejectAll}
            onFinalize={handleFinalize}
            onBack={() => setStep("changes")}
          />
        )}

        {/* Compiling loading state */}
        {step === "compiling" && (
          <motion.div
            key="compiling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.4 }}
          >
            <ProcessingStatus stage="processing" />
          </motion.div>
        )}

        {/* Done: PDF comparison */}
        {step === "done" && applyResult && (
          <FinalView
            key="done"
            originalUrl={getOriginalPdfUrl(applyResult.cv_id)}
            optimizedUrl={getOptimizedPdfUrl(applyResult.cv_id)}
            highlightedUrl={getHighlightedPdfUrl(applyResult.cv_id)}
            onStartOver={handleStartOver}
          />
        )}

        {/* Error state */}
        {step === "error" && (
          <motion.div
            key="error"
            className="flex flex-col items-center gap-4 py-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-sm text-destructive max-w-md text-center">{error}</p>
            <GlassButton size="default" onClick={handleStartOver}>
              Try Again
            </GlassButton>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
