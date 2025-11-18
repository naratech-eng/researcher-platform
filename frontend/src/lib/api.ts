const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL;

if (!FASTAPI_URL) {
  console.warn("FASTAPI_URL is not defined. Please set VITE_FASTAPI_URL in your .env file.");
}

async function fastapiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!FASTAPI_URL) {
    throw new Error("FastAPI base URL is missing");
  }

  const response = await fetch(`${FASTAPI_URL.replace(/\/$/, "")}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `FastAPI request failed (${response.status})`);
  }

  return response.json();
}

export async function checkFastApiHealth(): Promise<boolean> {
  try {
    await fastapiFetch("/api/health/db");
    return true;
  } catch (error) {
    console.error("FastAPI health check failed", error);
    return false;
  }
}

export type ChatMessagePayload = {
  role: "user" | "assistant" | "system";
  content: string;
};

export interface TableArtifact {
  id: string;
  title?: string;
  columns: string[];
  rows: unknown[][];
}

export interface ChartArtifact {
  id: string;
  title?: string;
  figure?: {
    data: unknown[];
    layout: Record<string, unknown>;
  };
}

export interface Citation {
  id?: string;
  title?: string;
  authors?: string;
  source: string;
  url: string | Array<{ format: string; platform: string; value: string }>;
  summary?: string;
  published?: string;
  doi?: string;
}

export interface ChatArtifacts {
  tables: TableArtifact[];
  charts: ChartArtifact[];
  files: Array<Record<string, unknown>>;
  code_snippets: Array<Record<string, unknown>>;
}

export interface ChatResponsePayload {
  answer: string;
  artifacts: ChatArtifacts;
  citations?: Citation[];
}

export async function sendChatMessage(messages: ChatMessagePayload[]): Promise<ChatResponsePayload> {
  return fastapiFetch<ChatResponsePayload>("/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}
