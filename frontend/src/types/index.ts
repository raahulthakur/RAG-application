export interface RAGQueryResult {
  answer: string;
  sources: string[];
  num_contexts: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  num_contexts?: number;
  timestamp: Date;
}

export interface IngestResponse {
  status: string;
  filename: string;
}

export interface DocumentsResponse {
  documents: string[];
}

export interface HealthResponse {
  status: string;
}
