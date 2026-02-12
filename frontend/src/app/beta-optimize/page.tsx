"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { ProcessingStatus } from "@/components/processing-status";
import { StepIndicator } from "@/components/wizard/step-indicator";
import { AnalysisView } from "@/components/wizard/analysis-view";
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
import type { WizardStep, CVAnalyzeResponse, CVApplyResponse, ChangeProposal } from "@/types";

export default function BetaOptimizePage() {
  const router = useRouter();
  const { cvId, selectedJob, reset } = useAppState();

  const [step, setStep] = useState<WizardStep>("analyzing");
  const [analysis, setAnalysis] = useState<CVAnalyzeResponse | null>(null);
  const [applyResult, setApplyResult] = useState<CVApplyResponse | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [filteredChanges, setFilteredChanges] = useState<ChangeProposal[]>([]);
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
        setStep("configure");
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

  // Called when user clicks "Improve My Resume" in Step 1
  const handleConfigureContinue = useCallback(
    (selectedSections: string[], keywords: string[]) => {
      if (!analysis) return;
      // Filter changes to only enabled sections
      const filtered = analysis.changes.filter((c) => selectedSections.includes(c.section));
      setFilteredChanges(filtered);
      // Pre-select all filtered changes
      setAcceptedIds(new Set(filtered.map((c) => c.id)));
      setSelectedKeywords(keywords);
      setStep("review");
    },
    [analysis]
  );

  const handleToggle = useCallback((id: string) => {
    setAcceptedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAcceptAll = useCallback(() => {
    setAcceptedIds(new Set(filteredChanges.map((c) => c.id)));
  }, [filteredChanges]);

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
      case "configure":
        return "See Your Difference";
      case "review":
        return "Review Changes";
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
      case "configure":
        return 1;
      case "review":
        return 2;
      case "done":
        return 3;
      default:
        return null;
    }
  })();

  // Get accepted changes for final view
  const acceptedChanges = analysis
    ? filteredChanges.filter((c) => acceptedIds.has(c.id))
    : [];

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

        {/* Step 1: Analysis + Configuration */}
        {step === "configure" && analysis && (
          <AnalysisView
            key="configure"
            score={analysis.score}
            scoreLabel={analysis.score_label}
            matchedKeywords={analysis.matched_keywords}
            missingKeywords={analysis.missing_keywords}
            sectionScores={analysis.section_scores}
            issues={analysis.issues}
            strengths={analysis.strengths}
            changes={analysis.changes}
            onContinue={handleConfigureContinue}
          />
        )}

        {/* Step 2: Accept/Reject Changes */}
        {step === "review" && (
          <ReviewView
            key="review"
            changes={filteredChanges}
            acceptedIds={acceptedIds}
            selectedKeywords={selectedKeywords}
            onToggle={handleToggle}
            onAcceptAll={handleAcceptAll}
            onRejectAll={handleRejectAll}
            onFinalize={handleFinalize}
            onBack={() => setStep("configure")}
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

        {/* Done: PDF comparison + score improvement */}
        {step === "done" && applyResult && analysis && (
          <FinalView
            key="done"
            originalUrl={getOriginalPdfUrl(applyResult.cv_id)}
            optimizedUrl={getOptimizedPdfUrl(applyResult.cv_id)}
            highlightedUrl={getHighlightedPdfUrl(applyResult.cv_id)}
            originalScore={analysis.score}
            acceptedChanges={acceptedChanges}
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
