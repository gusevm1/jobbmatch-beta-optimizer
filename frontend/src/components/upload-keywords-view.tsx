"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CVUpload } from "@/components/cv-upload";
import { KeywordSearch } from "@/components/keyword-search";
import { GlassButton } from "@/components/ui/glass-button";

interface UploadKeywordsViewProps {
  cvId: string | null;
  isUploading: boolean;
  onUploadStart: () => void;
  onUploaded: (id: string) => void;
  onSearch: (keywords: string[]) => void;
  onError: (error: string) => void;
  onResetUpload: () => void;
}

function StepLabel({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-5">
      <span className="font-brand text-3xl font-light text-foreground/20 tabular-nums">
        {number}.
      </span>
      <h3 className="text-lg font-medium text-foreground tracking-tight">
        {text}
      </h3>
    </div>
  );
}

export function UploadKeywordsView({
  cvId,
  isUploading,
  onUploadStart,
  onUploaded,
  onSearch,
  onError,
  onResetUpload,
}: UploadKeywordsViewProps) {
  const [chips, setChips] = useState<string[]>([]);

  const canSearch = !!cvId && chips.length > 0;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-10">
      {/* Step 1: Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <StepLabel number={1} text="Upload your CV" />
        {cvId ? (
          <div className="glass-drop-zone px-6 py-8 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground/70"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">CV uploaded</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ready for optimization</p>
            </div>
            <button
              onClick={onResetUpload}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors shrink-0"
            >
              Change
            </button>
          </div>
        ) : (
          <CVUpload
            onUploadStart={onUploadStart}
            onUploaded={onUploaded}
            onError={onError}
          />
        )}
      </motion.div>

      {/* Step 2: Keywords */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className={`transition-opacity duration-500 ${
            cvId ? "opacity-100" : "opacity-35 pointer-events-none"
          }`}
        >
          <StepLabel number={2} text="Add keywords" />
          <KeywordSearch
            chips={chips}
            onChipsChange={setChips}
            disabled={!cvId}
          />
        </div>
      </motion.div>

      {/* Find Jobs button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex justify-center"
      >
        <div
          className={`transition-all duration-500 ${
            canSearch
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <GlassButton
            size="lg"
            className="glass-button-cta"
            onClick={() => onSearch(chips)}
            disabled={!canSearch}
          >
            Find Jobs
          </GlassButton>
        </div>
      </motion.div>
    </div>
  );
}
