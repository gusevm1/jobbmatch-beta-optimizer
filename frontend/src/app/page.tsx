"use client";

import { useState, useRef, useCallback } from "react";
import { CVUpload } from "@/components/cv-upload";
import { KeywordSearch } from "@/components/keyword-search";
import { JobGrid } from "@/components/job-grid";
import { ComparisonView } from "@/components/comparison-view";
import { ProcessingStatus } from "@/components/processing-status";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { GlassButton } from "@/components/ui/glass-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { getOriginalPdfUrl, getOptimizedPdfUrl, getHighlightedPdfUrl } from "@/lib/api-client";
import type { CVProcessResponse, ProcessingStage, JobListing } from "@/types";

export default function Home() {
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [cvId, setCvId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState("");
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
    setKeywords("");
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
      case "uploaded":
        return "What are you looking for?";
      case "uploading":
        return "Uploading...";
      default:
        return "Upload your CV";
    }
  })();

  const sectionSubtext = (() => {
    switch (stage) {
      case "idle":
        return "Drop your PDF below and we'll find matching jobs";
      case "uploaded":
        return "Enter some keywords to find relevant positions";
      case "jobs":
        return "Pick a job to optimize your CV for";
      default:
        return null;
    }
  })();

  return (
    <div className={heroExited ? undefined : "h-screen overflow-hidden"}>
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
          <div className="flex flex-col items-center">
            {/* Brand name — large, dominant */}
            <div className="opacity-0 animate-fade-in-up">
              <BrandWordmark variant="hero" />
            </div>

            {/* Tagline */}
            <h1 className="hero-heading text-foreground text-center max-w-4xl opacity-0 animate-fade-in-up animate-delay-200">
              AI-Powered CV{"\u00A0"}Optimization
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-2xl text-center text-foreground text-base md:text-lg opacity-0 animate-fade-in-up animate-delay-400">
              Upload your CV, find relevant jobs, and use AI-powered tailoring to optimize your CV
            </p>

            {/* CTA Button */}
            <div className="mt-10 opacity-0 animate-fade-in-up animate-delay-600">
              <GlassButton
                size="lg"
                className="glass-button-cta"
                onClick={handleDiscover}
              >
                Discover JobbMatch
              </GlassButton>
            </div>
          </div>
        </BackgroundPaths>
      </div>

      {/* App Section — Upload → Keywords → Jobs → Processing → Results */}
      <section
        ref={appSectionRef}
        className={`min-h-screen bg-background px-5 md:px-10 pt-24 pb-16 transition-all duration-700 ease-out ${
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

          {/* Upload state */}
          {stage === "idle" && (
            <CVUpload
              onUploadStart={() => {
                setError(null);
                setStage("uploading");
              }}
              onUploaded={(id) => {
                setCvId(id);
                setStage("uploaded");
              }}
              onError={(err) => {
                setError(err);
                setStage("error");
              }}
            />
          )}

          {/* Uploading state */}
          {stage === "uploading" && (
            <ProcessingStatus stage={stage} />
          )}

          {/* Keywords state */}
          {stage === "uploaded" && (
            <KeywordSearch
              onSearch={(kw) => {
                setKeywords(kw);
                setStage("jobs");
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
