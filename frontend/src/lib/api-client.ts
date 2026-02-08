const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadCV(file: File): Promise<{ id: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/cv/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `Upload failed: ${res.statusText}`);
  }
  return res.json();
}

export async function processCV(id: string): Promise<{
  id: string;
  original_pdf_url: string;
  optimized_pdf_url: string;
  changes_summary: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300000); // 5 min
  try {
    const res = await fetch(`${API_BASE}/api/cv/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail || `Processing failed: ${res.statusText}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function getOriginalPdfUrl(id: string): string {
  return `${API_BASE}/api/cv/${id}/original`;
}

export function getOptimizedPdfUrl(id: string): string {
  return `${API_BASE}/api/cv/${id}/optimized`;
}
