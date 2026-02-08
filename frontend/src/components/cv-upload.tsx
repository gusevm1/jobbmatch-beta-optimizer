"use client";

import { useCallback, useRef, useState } from "react";

interface CVUploadProps {
  onUploadStart: () => void;
  onUploaded: (id: string) => void;
  onError: (error: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function CVUpload({
  onUploadStart,
  onUploaded,
  onError,
}: CVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
        handleUpload(dropped);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validateFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected && validateFile(selected)) {
        setFile(selected);
        handleUpload(selected);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validateFile]
  );

  const handleUpload = async (f: File) => {
    setIsUploading(true);
    try {
      const { uploadCV } = await import("@/lib/api-client");
      onUploadStart();
      const { id } = await uploadCV(f);
      onUploaded(id);
    } catch (err) {
      onError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && !isUploading && fileInputRef.current?.click()}
        className={`
          group w-full cursor-pointer px-6 py-14 glass-drop-zone
          ${isDragging ? "glass-drop-zone-dragging" : ""}
        `}
      >
        <div className="flex flex-col items-center gap-4">
          {isUploading ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-foreground/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : file ? (
            <>
              {/* File selected state */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground/70"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-mono text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Empty state */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5 transition-colors group-hover:bg-foreground/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground transition-colors group-hover:text-foreground/70"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 18v-6" />
                  <path d="m9 15 3-3 3 3" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Drag and drop your CV here
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  or click to browse &middot; PDF only, max 10MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
