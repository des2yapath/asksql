// Mirrors backend/app/models/schemas.py - kept as plain types rather than
// generated from the OpenAPI schema for now. TODO: once this API has more
// than one consumer, generate this from /openapi.json (openapi-typescript)
// instead of hand-syncing two files.

export interface QueryResultData {
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  truncated: boolean;
}

export interface QueryResponse {
  sql: string | null;
  explanation: string;
  needs_clarification: boolean;
  clarification_question: string | null;
  result: QueryResultData | null;
  execution_time_ms: number | null;
  warning: string | null;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

export interface SchemaResponse {
  tables: TableInfo[];
}

// --- Chat transcript (frontend-only concept, not sent to the backend as-is) ---
export type ChatRole = "user" | "assistant" | "error";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  question?: string;
  response?: QueryResponse;
  errorText?: string;
  createdAt: number;
}
