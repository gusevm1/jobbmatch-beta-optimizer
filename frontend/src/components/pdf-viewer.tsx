"use client";

import { useState, useEffect } from "react";
import type { DocumentProps } from "react-pdf";

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [ReactPdf, setReactPdf] = useState<{
    Document: React.ComponentType<DocumentProps>;
    Page: React.ComponentType<{ pageNumber: number; width: number; className?: string }>;
  } | null>(null);

  useEffect(() => {
    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
      setReactPdf({ Document: mod.Document, Page: mod.Page });
    });
    // @ts-expect-error CSS import
    import("react-pdf/dist/Page/TextLayer.css");
    // @ts-expect-error CSS import
    import("react-pdf/dist/Page/AnnotationLayer.css");
  }, []);

  if (!ReactPdf) {
    return (
      <div className="flex h-64 items-center justify-center bg-white text-sm text-muted-foreground">
        <span className="font-mono text-xs animate-pulse">Loading viewer...</span>
      </div>
    );
  }

  const { Document, Page } = ReactPdf;

  return (
    <div className="max-h-[70vh] overflow-y-auto bg-white">
      <Document
        file={url}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        loading={
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            <span className="font-mono text-xs animate-pulse">Loading PDF...</span>
          </div>
        }
        error={
          <div className="flex h-64 items-center justify-center text-sm text-destructive">
            <span className="font-mono text-xs">Failed to load PDF</span>
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={i + 1}
            pageNumber={i + 1}
            width={500}
            className="mx-auto"
          />
        ))}
      </Document>
    </div>
  );
}
