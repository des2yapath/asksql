import type { Page } from "@playwright/test";
import type { QueryResponse, SchemaResponse } from "../../src/types";

/**
 * Canned /api responses for the hermetic suite.
 *
 * Shapes are copied from the real contracts (backend/app/models/schemas.py,
 * mirrored in src/types.ts) and typed, so a field rename in the app fails
 * typecheck here instead of silently passing. Because every response is
 * decided in this file, the default suite needs no database, no Gemini key
 * and no running backend.
 *
 * A note on fidelity: for an empty result the real handler builds `columns`
 * from the first row, so it returns an empty list - the empty fixture does
 * the same rather than inventing headers the backend never sends.
 */

const CORS_HEADERS = {
  // The app calls http://localhost:8000 by default, so these are cross-origin
  // requests and Playwright still applies CORS checks to fulfilled responses.
  // Without these headers the page sees a failed fetch instead of the fixture.
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
};

export const SCHEMA_FIXTURE: SchemaResponse = {
  tables: [
    {
      name: "customers",
      columns: [
        { name: "id", type: "integer", nullable: false, primary_key: true },
        { name: "name", type: "text", nullable: false, primary_key: false },
        { name: "email", type: "text", nullable: false, primary_key: false },
        { name: "region", type: "text", nullable: false, primary_key: false },
        {
          name: "created_at",
          type: "timestamp with time zone",
          nullable: false,
          primary_key: false,
        },
      ],
    },
    {
      name: "orders",
      columns: [
        { name: "id", type: "integer", nullable: false, primary_key: true },
        { name: "customer_id", type: "integer", nullable: false, primary_key: false },
        {
          name: "created_at",
          type: "timestamp with time zone",
          nullable: false,
          primary_key: false,
        },
        { name: "status", type: "text", nullable: false, primary_key: false },
        { name: "total_cents", type: "integer", nullable: false, primary_key: false },
      ],
    },
    {
      name: "order_items",
      columns: [
        { name: "id", type: "integer", nullable: false, primary_key: true },
        { name: "order_id", type: "integer", nullable: false, primary_key: false },
        { name: "product_id", type: "integer", nullable: false, primary_key: false },
        { name: "quantity", type: "integer", nullable: false, primary_key: false },
        { name: "unit_price_cents", type: "integer", nullable: false, primary_key: false },
      ],
    },
    {
      name: "products",
      columns: [
        { name: "id", type: "integer", nullable: false, primary_key: true },
        { name: "name", type: "text", nullable: false, primary_key: false },
        { name: "category", type: "text", nullable: false, primary_key: false },
        { name: "price_cents", type: "integer", nullable: false, primary_key: false },
      ],
    },
  ],
};

export const ORDERS_RESPONSE: QueryResponse = {
  sql:
    "SELECT id, customer_id, created_at, status, total_cents FROM orders " +
    "ORDER BY created_at DESC LIMIT 5",
  explanation: "Returns the five most recent orders with their status and total.",
  needs_clarification: false,
  clarification_question: null,
  result: {
    columns: ["id", "customer_id", "created_at", "status", "total_cents"],
    rows: [
      { id: 1042, customer_id: 17, created_at: "2026-09-19T14:03:11+00:00", status: "completed", total_cents: 18995 },
      { id: 1041, customer_id: 4, created_at: "2026-09-18T09:41:52+00:00", status: "completed", total_cents: 4200 },
      { id: 1040, customer_id: 23, created_at: "2026-09-17T16:22:07+00:00", status: "refunded", total_cents: 12750 },
      { id: 1039, customer_id: 11, created_at: "2026-09-16T11:08:45+00:00", status: "pending", total_cents: 8999 },
      { id: 1038, customer_id: 9, created_at: "2026-09-15T18:57:30+00:00", status: "completed", total_cents: 23100 },
    ],
    row_count: 5,
    truncated: false,
  },
  execution_time_ms: 142.5,
  warning: null,
};

/** Exactly two columns with the second one numeric - the shape ResultsTable's
 * heuristic offers the chart view for. */
export const PRODUCT_SALES_RESPONSE: QueryResponse = {
  sql:
    "SELECT p.name AS product_name, SUM(oi.quantity) AS units_sold " +
    "FROM order_items oi JOIN products p ON p.id = oi.product_id " +
    "GROUP BY p.name ORDER BY units_sold DESC LIMIT 5",
  explanation: "Sums units sold per product and returns the five best sellers.",
  needs_clarification: false,
  clarification_question: null,
  result: {
    columns: ["product_name", "units_sold"],
    rows: [
      { product_name: "Aurora Desk Lamp", units_sold: 412 },
      { product_name: "Meridian Notebook", units_sold: 388 },
      { product_name: "Harbor Water Bottle", units_sold: 341 },
      { product_name: "Beacon Headphones", units_sold: 297 },
      { product_name: "Summit Backpack", units_sold: 254 },
    ],
    row_count: 5,
    truncated: false,
  },
  execution_time_ms: 96.2,
  warning: null,
};

export const EMPTY_RESULT_RESPONSE: QueryResponse = {
  sql: "SELECT id, name FROM customers WHERE created_at > now() + interval '1 year' LIMIT 50",
  explanation: "Looks for customers created in the future, which returns no rows.",
  needs_clarification: false,
  clarification_question: null,
  result: { columns: [], rows: [], row_count: 0, truncated: false },
  execution_time_ms: 31.4,
  warning: null,
};

export const CLARIFICATION_RESPONSE: QueryResponse = {
  sql: null,
  explanation: "",
  needs_clarification: true,
  clarification_question: "How far back should I look - the last 24 hours, 7 days, or 30 days?",
  result: null,
  execution_time_ms: null,
  warning: null,
};

/**
 * What the backend actually returns for "delete all orders": the model
 * refuses to write SQL (see the read-only few-shot example in
 * backend/app/llm/prompts.py), and query.py turns a null `sql` into
 * needs_clarification with `clarification_question` left null. The refusal
 * text therefore only arrives in `explanation`, which is why MessageBubble
 * needs its fallback - this fixture is a regression test for exactly that.
 */
export const READ_ONLY_REFUSAL_RESPONSE: QueryResponse = {
  sql: null,
  explanation:
    "This connection is read-only, so I can't delete data - I can help you find the test orders " +
    "instead, for example by filtering on a name pattern.",
  needs_clarification: true,
  clarification_question: null,
  result: null,
  execution_time_ms: null,
  warning: null,
};

/** Verbatim from the non-SELECT branch of
 * backend/app/sql_guard/validator.py. Pinned rather than imported (the backend
 * is Python) - if that wording changes, this suite should fail loudly rather
 * than silently assert on a stale string. */
export const GUARD_REJECTION_DETAIL =
  "Only SELECT queries are allowed here - the model produced a DROP statement instead.";

export type QueryOutcome = QueryResponse | { status: number; detail: string };

interface MockApiOptions {
  schema?: SchemaResponse;
  query?: QueryOutcome;
}

function fulfillJson(body: unknown, status = 200) {
  return {
    status,
    headers: CORS_HEADERS,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

function isErrorOutcome(outcome: QueryOutcome): outcome is { status: number; detail: string } {
  return "status" in outcome;
}

/** Answer every /api call this app makes. Call before `page.goto`. */
export async function mockApi(page: Page, options: MockApiOptions = {}): Promise<void> {
  const { schema = SCHEMA_FIXTURE, query = ORDERS_RESPONSE } = options;

  await page.route("**/api/**", async (route) => {
    const { pathname } = new URL(route.request().url());

    // A cross-origin JSON POST preflights before the real request is sent;
    // satisfy it (defensively - newer Chromium may not even route it here).
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }

    // The console gates its schema fetch on this probe and keeps the input
    // disabled while it's unreachable, so it must succeed or every test
    // stalls on a disabled textarea.
    if (pathname === "/api/health") {
      await route.fulfill(fulfillJson({ status: "ok" }));
      return;
    }

    if (pathname === "/api/schema") {
      await route.fulfill(fulfillJson(schema));
      return;
    }

    if (pathname === "/api/query") {
      await route.fulfill(
        isErrorOutcome(query)
          ? fulfillJson({ detail: query.detail }, query.status)
          : fulfillJson(query)
      );
      return;
    }

    await route.fulfill(fulfillJson({ detail: `No fixture for ${pathname}` }, 404));
  });
}
