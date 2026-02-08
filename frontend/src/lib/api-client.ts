const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadCV(file: File): Promise<{ id: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/cv/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return res.json();
}

export async function processCV(id: string): Promise<{
  id: string;
  original_pdf_url: string;
  optimized_pdf_url: string;
  changes_summary: string;
}> {
  const res = await fetch(`${API_BASE}/api/cv/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(`Processing failed: ${res.statusText}`);
  return res.json();
}

export function getOriginalPdfUrl(id: string): string {
  return `${API_BASE}/api/cv/${id}/original`;
}

export function getOptimizedPdfUrl(id: string): string {
  return `${API_BASE}/api/cv/${id}/optimized`;
}
