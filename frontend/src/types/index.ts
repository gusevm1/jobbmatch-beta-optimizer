export interface CVUploadResponse {
  id: string;
  filename: string;
}

export interface CVProcessResponse {
  id: string;
  original_pdf_url: string;
  optimized_pdf_url: string;
  highlighted_pdf_url: string;
  changes_summary: string;
}

export interface JobDescriptionSection {
  heading: string;
  text?: string;
  bullets?: string[];
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  fullDescription?: JobDescriptionSection[];
  keywords: string[];
  url?: string;
  isDemo?: boolean;
}

export type ProcessingStage =
  | "idle"
  | "uploading"
  | "uploaded"
  | "jobs"
  | "job-detail"
  | "processing"
  | "done"
  | "error";

export interface AnalysisIssue {
  text: string;
  severity: "high" | "medium" | "low";
}

export interface AnalysisStrength {
  text: string;
}

export interface ChangeProposal {
  id: string;
  section: string;
  original_text: string;
  proposed_text: string;
  reason: string;
  impact: "high" | "medium" | "low";
}

export interface SectionScore {
  section: string;
  relevance: "strong" | "moderate" | "weak";
}

export interface CVAnalyzeResponse {
  cv_id: string;
  job_id: string;
  score: number;
  score_label: string;
  matched_keywords: string[];
  missing_keywords: string[];
  section_scores: SectionScore[];
  issues: AnalysisIssue[];
  strengths: AnalysisStrength[];
  changes: ChangeProposal[];
}

export interface CVApplyResponse {
  cv_id: string;
  original_pdf_url: string;
  optimized_pdf_url: string;
  highlighted_pdf_url: string;
}

export type WizardStep = "analyzing" | "configure" | "review" | "compiling" | "done" | "error";
