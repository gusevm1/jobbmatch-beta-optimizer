"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CVUploadProps {
  onUploadStart: () => void;
  onProcessStart: () => void;
  onComplete: (result: {
    id: string;
    original_pdf_url: string;
    optimized_pdf_url: string;
    changes_summary: string;
  }) => void;
  onError: (error: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function CVUpload({
  onUploadStart,
  onProcessStart,
  onComplete,
  onError,
}: CVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (f: File): boolean => {
      if (f.type !== "application/pdf") {
        onError("Please upload a PDF file");
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        onError("File size must be under 10MB");
        return false;
      }
      return true;
    },
    [onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped && validateFile(dropped)) {
        setFile(dropped);
      }
    },
    [validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected && validateFile(selected)) {
        setFile(selected);
      }
    },
    [validateFile]
  );

  const handleSubmit = useCallback(async () => {
    if (!file) return;
    setIsSubmitting(true);

    try {
      const { uploadCV, processCV } = await import("@/lib/api-client");

      onUploadStart();
      const { id } = await uploadCV(file);

      onProcessStart();
      const result = await processCV(id);

      onComplete(result);
    } catch (err) {
      onError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }, [file, onUploadStart, onProcessStart, onComplete, onError]);

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="flex flex-col gap-4 p-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M12 18v-6" />
            <path d="m9 15 3-3 3 3" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium">
              {file ? file.name : "Drag and drop your CV here"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF only, max 10MB
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Browse Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!file || isSubmitting}
          className="w-full"
        >
          Optimize CV
        </Button>
      </CardContent>
    </Card>
  );
}
