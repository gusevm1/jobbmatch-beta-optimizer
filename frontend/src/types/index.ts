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

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  keywords: string[];
  url?: string;
  isDemo?: boolean;
}

export type ProcessingStage =
  | "idle"
  | "uploading"
  | "uploaded"
  | "jobs"
  | "processing"
  | "done"
  | "error";
