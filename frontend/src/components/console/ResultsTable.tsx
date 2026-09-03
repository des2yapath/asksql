import { useMemo, useState } from "react";
import { BarChart3, ChevronLeft, ChevronRight, Table2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { QueryResultData } from "../../types";

const PAGE_SIZE = 10;

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  }
  return String(value);
}

/** Two columns, second one numeric across every row - simple enough to be
 * a reasonable default without asking the model to make this call (its
 * chart_suggestion field exists in the schema but a client-side heuristic
 * on the actual returned data is more reliable than trusting a guess made
 * before the query even ran). */
function isChartable(result: QueryResultData): boolean {
  if (result.columns.length !== 2 || result.rows.length === 0) return false;
  const valueKey = result.columns[1];
  return result.rows.every((row) => typeof row[valueKey] === "number");
}

export default function ResultsTable({ result }: { result: QueryResultData }) {
  const [page, setPage] = useState(0);
  const [view, setView] = useState<"table" | "chart">("table");

  const chartable = useMemo(() => isChartable(result), [result]);
  const totalPages = Math.max(1, Math.ceil(result.rows.length / PAGE_SIZE));
  const pageRows = result.rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const [labelKey, valueKey] = result.columns;

  return (
    <div className="overflow-hidden rounded-lg border border-ink/10">
      <div className="flex items-center justify-between border-b border-ink/10 bg-ink/[0.03] px-3 py-1.5">
        <span className="font-mono text-[11px] text-ink/50">
          {result.row_count} row{result.row_count === 1 ? "" : "s"}
          {result.truncated ? " (showing max)" : ""}
        </span>
        {chartable && (
          <div className="flex overflow-hidden rounded-md border border-ink/10">
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1 px-2 py-1 text-xs ${
                view === "table" ? "bg-ink text-canvas" : "text-ink/50 hover:text-ink"
              }`}
            >
              <Table2 size={12} /> Table
            </button>
            <button
              onClick={() => setView("chart")}
              className={`flex items-center gap-1 px-2 py-1 text-xs ${
                view === "chart" ? "bg-ink text-canvas" : "text-ink/50 hover:text-ink"
              }`}
            >
              <BarChart3 size={12} /> Chart
            </button>
          </div>
        )}
      </div>

      {view === "chart" && chartable ? (
        <div className="h-64 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={result.rows} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#12172A0f" vertical={false} />
              <XAxis
                dataKey={labelKey}
                tick={{ fontSize: 11, fill: "#12172A99" }}
                axisLine={{ stroke: "#12172A1a" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#12172A99" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                cursor={{ fill: "#12172A08" }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #12172A1a" }}
              />
              <Bar dataKey={valueKey} fill="#E8A33D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 bg-ink/[0.02]">
                  {result.columns.map((col) => (
                    <th key={col} className="whitespace-nowrap px-3 py-2 font-medium text-ink/60">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => (
                  <tr key={i} className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]">
                    {result.columns.map((col) => (
                      <td key={col} className="whitespace-nowrap px-3 py-2 text-ink/80">
                        {formatCell(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-ink/10 px-3 py-1.5">
              <span className="font-mono text-[11px] text-ink/40">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded p-1 text-ink/50 hover:bg-ink/5 disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded p-1 text-ink/50 hover:bg-ink/5 disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
