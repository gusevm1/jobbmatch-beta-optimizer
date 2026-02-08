export interface CVUploadResponse {
  id: string;
  filename: string;
}

export interface CVProcessResponse {
  id: string;
  original_pdf_url: string;
  optimized_pdf_url: string;
  changes_summary: string;
}

export type ProcessingStage = "idle" | "uploading" | "processing" | "done" | "error";
