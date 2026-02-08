"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProcessingStage } from "@/types";

interface ProcessingStatusProps {
  stage: ProcessingStage;
}

const STAGE_CONFIG: Record<
  "uploading" | "processing",
  { label: string; progress: number }[]
> = {
  uploading: [{ label: "Uploading CV...", progress: 15 }],
  processing: [
    { label: "Analyzing CV layout...", progress: 35 },
    { label: "Optimizing for job match...", progress: 65 },
    { label: "Generating PDF...", progress: 85 },
  ],
};

export function ProcessingStatus({ stage }: ProcessingStatusProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setStepIndex(0);
  }, [stage]);

  useEffect(() => {
    if (stage !== "processing") return;

    const steps = STAGE_CONFIG.processing;
    if (stepIndex >= steps.length - 1) return;

    const timer = setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }, 4000);

    return () => clearTimeout(timer);
  }, [stage, stepIndex]);

  if (stage !== "uploading" && stage !== "processing") return null;

  const steps = STAGE_CONFIG[stage];
  const current = steps[Math.min(stepIndex, steps.length - 1)];

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium">{current.label}</p>
        </div>
        <Progress value={current.progress} className="h-2" />
        <p className="text-xs text-muted-foreground">
          This may take a minute...
        </p>
      </CardContent>
    </Card>
  );
}
