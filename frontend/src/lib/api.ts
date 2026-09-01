import type { QueryResponse, SchemaResponse } from "../types";

// In dev this hits the Vite proxy target / localhost:8000 directly. In prod
// this comes from Vercel's env vars (see .env.example) - pointed at whatever
// Render gives the backend service.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    // FastAPI's exception handlers (see backend/app/core/exceptions.py) all
    // return {"detail": "..."} - surface that directly instead of a generic
    // "Request failed" so the guardrail's specific rejection reason (e.g.
    // "Only SELECT queries are allowed here...") actually reaches the user.
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // response wasn't JSON (e.g. a raw 502 from the platform, not our
      // app) - fall back to the generic message above.
    }
    throw new ApiError(detail, response.status);
  }

  return response.json() as Promise<T>;
}

export function askQuestion(question: string, conversationId?: string): Promise<QueryResponse> {
  return request<QueryResponse>("/api/query", {
    method: "POST",
    body: JSON.stringify({ question, conversation_id: conversationId ?? null }),
  });
}

export function fetchSchema(): Promise<SchemaResponse> {
  return request<SchemaResponse>("/api/schema");
}

export async function pingHealth(): Promise<boolean> {
  // 5s cap: without it, a refused connection can hang for seconds on the
  // IPv6 -> IPv4 localhost fallback and every poll cycle eats the delay.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export { ApiError };
