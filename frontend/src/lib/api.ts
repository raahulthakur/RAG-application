import type {
  DocumentsResponse,
  HealthResponse,
  IngestResponse,
  RAGQueryResult,
} from "@/types";

const BASE = "/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function queryRAG(
  question: string,
  top_k = 5
): Promise<RAGQueryResult> {
  return apiFetch<RAGQueryResult>("/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, top_k }),
  });
}

export async function ingestPDF(file: File): Promise<IngestResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<IngestResponse>("/ingest", { method: "POST", body: form });
}

export async function listDocuments(): Promise<DocumentsResponse> {
  return apiFetch<DocumentsResponse>("/documents");
}

export async function healthCheck(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}
