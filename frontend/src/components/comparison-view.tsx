"use client";

import { PdfViewer } from "@/components/pdf-viewer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ComparisonViewProps {
  originalUrl: string;
  optimizedUrl: string;
  changesSummary: string;
  onStartOver: () => void;
}

export function ComparisonView({
  originalUrl,
  optimizedUrl,
  changesSummary,
  onStartOver,
}: ComparisonViewProps) {
  return (
    <div className="flex w-full max-w-6xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <PdfViewer url={originalUrl} label="Original CV" />
        <PdfViewer url={optimizedUrl} label="Optimized CV" />
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Changes Made</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {changesSummary}
        </p>
      </div>

      <div className="flex gap-3">
        <Button asChild variant="default">
          <a href={optimizedUrl} download="optimized-cv.pdf">
            Download Optimized CV
          </a>
        </Button>
        <Button variant="outline" onClick={onStartOver}>
          Start Over
        </Button>
      </div>
    </div>
  );
}
