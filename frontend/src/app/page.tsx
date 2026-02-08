"use client";

import { useState, useRef, useCallback } from "react";
import { UploadKeywordsView } from "@/components/upload-keywords-view";
import { JobGrid } from "@/components/job-grid";
import { ComparisonView } from "@/components/comparison-view";
import { ProcessingStatus } from "@/components/processing-status";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { FloatingPaths } from "@/components/ui/background-paths";
import { GlassButton } from "@/components/ui/glass-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { getOriginalPdfUrl, getOptimizedPdfUrl, getHighlightedPdfUrl } from "@/lib/api-client";
import type { CVProcessResponse, ProcessingStage, JobListing } from "@/types";

export default function Home() {
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [cvId, setCvId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [result, setResult] = useState<CVProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heroExited, setHeroExited] = useState(false);
  const appSectionRef = useRef<HTMLDivElement>(null);

  const handleDiscover = () => {
    setHeroExited(true);
    setTimeout(() => {
      appSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 600);
  };

  const handleReset = () => {
    setStage("idle");
    setCvId(null);
    setKeywords([]);
    setResult(null);
    setError(null);
  };

  const handleBackToHero = () => {
    setHeroExited(false);
    handleReset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOptimize = useCallback(async (job: JobListing) => {
    if (!cvId) return;
    setStage("processing");

    try {
      const { processCV } = await import("@/lib/api-client");
      const res = await processCV(cvId);
      setResult(res);
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setStage("error");
    }
  }, [cvId]);

  const sectionHeading = (() => {
    switch (stage) {
      case "done":
        return "Your optimized CV";
      case "error":
        return "Something went wrong";
      case "processing":
        return "Working on it";
      case "jobs":
        return "Jobs for you";
      default:
        return "Get started";
    }
  })();

  const sectionSubtext = (() => {
    switch (stage) {
      case "idle":
      case "uploading":
      case "uploaded":
        return "Upload your CV and find matching positions";
      case "jobs":
        return "Pick a job to optimize your CV for";
      default:
        return null;
    }
  })();

  return (
    <div className={heroExited ? undefined : "h-screen overflow-hidden"}>
      {/* Persistent floating lines — visible after hero exit */}
      <div
        className={`fixed inset-0 z-[1] pointer-events-none transition-opacity duration-300 ${
          heroExited ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute -inset-x-0 top-[-10%] bottom-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      {/* Navbar — always visible */}
      <header className="fixed top-0 left-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border/40">
        <nav className="flex items-center justify-between px-5 md:px-10 h-16">
          <button
            onClick={handleBackToHero}
            className="cursor-pointer"
          >
            <BrandWordmark />
          </button>

          <div className="flex items-center gap-3">
            <GlassButton size="default" className="hidden sm:inline-flex glass-button-nav">
              Find jobs
            </GlassButton>
            <GlassButton
              size="default"
              className="hidden sm:inline-flex glass-button-nav"
              onClick={handleDiscover}
            >
              Upload CV
            </GlassButton>
            <GlassButton size="default" className="glass-button-nav">
              Create account
            </GlassButton>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Hero Section — exactly one viewport, no scroll */}
      <div
        className={`h-screen overflow-hidden transition-all duration-700 ease-out ${
          heroExited
            ? "opacity-0 scale-95 pointer-events-none absolute inset-0"
            : "opacity-100 scale-100"
        }`}
      >
        <BackgroundPaths>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 w-full items-center">
            {/* Left column — heading */}
            <div className="opacity-0 animate-fade-in-up">
              <h1 className="hero-heading-split text-foreground">
                Find your{" "}
                <span className="font-bold">dream job</span>{" "}
                faster with AI
              </h1>
              <p className="mt-5 max-w-md text-muted-foreground text-base md:text-lg leading-relaxed opacity-0 animate-fade-in-up animate-delay-200">
                Upload your CV, match with relevant positions, and let AI tailor your application to stand out.
              </p>
            </div>

            {/* Right column — glass CTA panel */}
            <div className="flex justify-center md:justify-end opacity-0 animate-fade-in-up animate-delay-400">
              <div className="hero-glass-panel w-full max-w-sm p-8 flex flex-col gap-5">
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Get started
                </span>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  See how JobbMatch optimizes your CV for any role in seconds — powered&nbsp;by&nbsp;Claude.
                </p>
                <GlassButton
                  size="lg"
                  className="glass-button-cta w-full"
                  onClick={handleDiscover}
                >
                  Discover JobbMatch
                </GlassButton>
              </div>
            </div>
          </div>
        </BackgroundPaths>
      </div>

      {/* App Section — Upload + Keywords → Jobs → Processing → Results */}
      <section
        ref={appSectionRef}
        className={`relative min-h-screen px-5 md:px-10 pt-24 pb-16 transition-all duration-700 ease-out ${
          heroExited
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        <div
          className={`mx-auto transition-all duration-500 ${
            stage === "done" || stage === "jobs"
              ? "max-w-6xl"
              : "max-w-2xl"
          }`}
        >
          {/* Section heading — changes based on stage */}
          <div className="mb-12 text-center">
            <h2 className="text-2xl md:text-4xl font-medium text-foreground tracking-tight">
              {sectionHeading}
            </h2>
            {sectionSubtext && (
              <p className="mt-3 text-sm text-muted-foreground">
                {sectionSubtext}
              </p>
            )}
          </div>

          {/* Combined upload + keywords view */}
          {(stage === "idle" || stage === "uploading" || stage === "uploaded") && (
            <UploadKeywordsView
              cvId={cvId}
              isUploading={stage === "uploading"}
              onUploadStart={() => {
                setError(null);
                setStage("uploading");
              }}
              onUploaded={(id) => {
                setCvId(id);
                setStage("uploaded");
              }}
              onSearch={(kws) => {
                setKeywords(kws);
                setStage("jobs");
              }}
              onError={(err) => {
                setError(err);
                setStage("error");
              }}
              onResetUpload={() => {
                setCvId(null);
                setStage("idle");
              }}
            />
          )}

          {/* Jobs grid */}
          {stage === "jobs" && (
            <JobGrid keywords={keywords} onOptimize={handleOptimize} />
          )}

          {/* Processing state */}
          {stage === "processing" && (
            <ProcessingStatus stage={stage} />
          )}

          {/* Results state */}
          {stage === "done" && result && (
            <ComparisonView
              originalUrl={getOriginalPdfUrl(result.id)}
              optimizedUrl={getOptimizedPdfUrl(result.id)}
              highlightedUrl={getHighlightedPdfUrl(result.id)}
              changesSummary={result.changes_summary}
              onStartOver={handleReset}
            />
          )}

          {/* Error state */}
          {stage === "error" && (
            <div className="flex flex-col items-center gap-4 py-12">
              <p className="text-sm text-destructive">{error}</p>
              <GlassButton size="default" onClick={handleReset}>
                Try Again
              </GlassButton>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
