"use client";

import { useState, useEffect } from "react";
import type { DocumentProps } from "react-pdf";

interface PdfViewerProps {
  url: string;
  label: string;
}

export function PdfViewer({ url, label }: PdfViewerProps) {
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
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <div className="flex h-64 items-center justify-center rounded-lg border bg-white text-sm text-muted-foreground">
          Loading viewer...
        </div>
      </div>
    );
  }

  const { Document, Page } = ReactPdf;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{label}</h3>
      <div className="max-h-[70vh] overflow-y-auto rounded-lg border bg-white">
        <Document
          file={url}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Loading PDF...
            </div>
          }
          error={
            <div className="flex h-64 items-center justify-center text-sm text-destructive">
              Failed to load PDF
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
    </div>
  );
}
