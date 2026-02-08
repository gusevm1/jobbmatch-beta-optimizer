"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { CVProcessResponse, JobListing } from "@/types";

interface AppState {
  cvId: string | null;
  setCvId: (id: string | null) => void;
  keywords: string[];
  setKeywords: (kws: string[]) => void;
  selectedJob: JobListing | null;
  setSelectedJob: (job: JobListing | null) => void;
  result: CVProcessResponse | null;
  setResult: (r: CVProcessResponse | null) => void;
  error: string | null;
  setError: (e: string | null) => void;
  reset: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [cvId, setCvId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [result, setResult] = useState<CVProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setCvId(null);
    setKeywords([]);
    setSelectedJob(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        cvId, setCvId,
        keywords, setKeywords,
        selectedJob, setSelectedJob,
        result, setResult,
        error, setError,
        reset,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
