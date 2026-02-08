"use client";

import { useState } from "react";
import { CVUpload } from "@/components/cv-upload";
import { ComparisonView } from "@/components/comparison-view";
import { ProcessingStatus } from "@/components/processing-status";
import { Button } from "@/components/ui/button";
import { getOriginalPdfUrl, getOptimizedPdfUrl } from "@/lib/api-client";
import type { CVProcessResponse, ProcessingStage } from "@/types";

export default function Home() {
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [result, setResult] = useState<CVProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setStage("idle");
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <main className="flex flex-col items-center gap-6 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            JobbMatch Beta Optimizer
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Upload your CV to get an AI-optimized version tailored to a job
            description
          </p>
        </div>

        {stage === "idle" && (
          <CVUpload
            onUploadStart={() => {
              setError(null);
              setStage("uploading");
            }}
            onProcessStart={() => setStage("processing")}
            onComplete={(res) => {
              setResult(res);
              setStage("done");
            }}
            onError={(err) => {
              setError(err);
              setStage("error");
            }}
          />
        )}

        {(stage === "uploading" || stage === "processing") && (
          <ProcessingStatus stage={stage} />
        )}

        {stage === "done" && result && (
          <ComparisonView
            originalUrl={getOriginalPdfUrl(result.id)}
            optimizedUrl={getOptimizedPdfUrl(result.id)}
            changesSummary={result.changes_summary}
            onStartOver={handleReset}
          />
        )}

        {stage === "error" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={handleReset}>
              Try Again
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
