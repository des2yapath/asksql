import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
  Inbox,
  Search,
  Table2,
  X,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { QueryResultData } from "../../types";
import { useTheme } from "../../lib/theme";
import { useToast } from "../../lib/toast";

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Recharts renders to SVG attributes, and CSS custom properties don't resolve
 * inside presentation attributes - so the chart gets a concrete palette per
 * theme instead of reading the tokens the rest of the UI uses.
 */
const CHART_PALETTE = {
  light: {
    grid: "rgba(18,23,42,0.06)",
    axis: "rgba(18,23,42,0.6)",
    bar: "#E8A33D",
    cursor: "rgba(18,23,42,0.04)",
    tooltipBg: "#FFFFFF",
    tooltipBorder: "rgba(18,23,42,0.12)",
    tooltipText: "#12172A",
  },
  dark: {
    grid: "rgba(255,255,255,0.08)",
    axis: "rgba(232,234,237,0.65)",
    bar: "#F0B25A",
    cursor: "rgba(255,255,255,0.05)",
    tooltipBg: "#1A1D27",
    tooltipBorder: "rgba(255,255,255,0.14)",
    tooltipText: "#E8EAED",
  },
} as const;

type SortDirection = "asc" | "desc";
interface SortState {
  column: string;
  direction: SortDirection;
}

function isMissing(value: unknown): boolean {
  return value === null || value === undefined;
}

function formatCell(value: unknown): string {
  if (isMissing(value)) return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  }
  return String(value);
}

/** Numbers in the results are almost always money or counts, and scanning a
 * column of them is much easier right-aligned with tabular figures - but a
 * run of text values reads better left-aligned, so this is decided per
 * column from the data actually returned rather than up front. */
function numericColumns(columns: string[], rows: Record<string, unknown>[]): Set<string> {
  const numeric = new Set<string>();
  for (const column of columns) {
    const values = rows.map((row) => row[column]).filter((value) => !isMissing(value));
    if (values.length > 0 && values.every((value) => typeof value === "number")) {
      numeric.add(column);
    }
  }
  return numeric;
}

function sortRows(
  rows: Record<string, unknown>[],
  column: string,
  direction: SortDirection
): Record<string, unknown>[] {
  const present = rows.filter((row) => !isMissing(row[column]));
  const missing = rows.filter((row) => isMissing(row[column]));

  const sorted = [...present].sort((a, b) => {
    const left = a[column];
    const right = b[column];
    const comparison =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : // numeric:true so "Row 2" sorts before "Row 10" instead of after it.
          String(left).localeCompare(String(right), undefined, {
            numeric: true,
            sensitivity: "base",
          });
    return direction === "asc" ? comparison : -comparison;
  });

  // Nulls sink to the bottom in both directions - flipping them to the top on
  // a descending sort just buries the rows the user asked to see.
  return [...sorted, ...missing];
}

function csvCell(value: unknown): string {
  if (isMissing(value)) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const header = columns.map(csvCell).join(",");
  const body = rows.map((row) => columns.map((column) => csvCell(row[column])).join(","));
  return [header, ...body].join("\r\n");
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
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [view, setView] = useState<"table" | "chart">("table");
  const [sort, setSort] = useState<SortState | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { theme } = useTheme();
  const { pushToast } = useToast();
  const palette = CHART_PALETTE[theme];

  // Debounced so typing in the filter doesn't re-sort and re-render the whole
  // result set on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // A narrower result set makes page N meaningless, so jump back to the top
  // whenever the filter changes rather than showing a possible empty page.
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const chartable = useMemo(() => isChartable(result), [result]);

  const filteredRows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return result.rows;
    return result.rows.filter((row) =>
      result.columns.some((column) => formatCell(row[column]).toLowerCase().includes(query))
    );
  }, [result.rows, result.columns, debouncedSearch]);

  const numeric = useMemo(
    () => numericColumns(result.columns, filteredRows),
    [result.columns, filteredRows]
  );

  const sortedRows = useMemo(
    () => (sort ? sortRows(filteredRows, sort.column, sort.direction) : filteredRows),
    [filteredRows, sort]
  );

  // Clamp rather than trust `page`: changing page size can leave it past the
  // end, and rendering an empty page would look like a bug.
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = sortedRows.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  const isEmpty = result.rows.length === 0;
  const noMatches = !isEmpty && sortedRows.length === 0;
  const isFiltered = debouncedSearch.trim().length > 0;
  const [labelKey, valueKey] = result.columns;

  function toggleSort(column: string) {
    setPage(0);
    setSort((previous) =>
      previous?.column === column
        ? { column, direction: previous.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" }
    );
  }

  function handleExport() {
    const blob = new Blob([buildCsv(result.columns, sortedRows)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asksql-results-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    // Revoking synchronously can cancel the download before the browser has
    // read the blob, so let the click settle first.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    pushToast(`Exported ${sortedRows.length} row${sortedRows.length === 1 ? "" : "s"} to CSV`, "success");
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink/10 bg-surface">
      {/* Toolbar: filter on the left, output controls on the right. */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 bg-ink/[0.03] px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={12}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink/35"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter rows…"
              aria-label="Filter result rows"
              className="w-40 rounded-md border border-ink/10 bg-surface py-1 pl-6 pr-6 text-xs text-ink placeholder:text-ink/35 focus:border-violet/40 focus:outline-none sm:w-52"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink/40 hover:text-ink"
                aria-label="Clear filter"
              >
                <X size={11} aria-hidden="true" />
              </button>
            )}
          </div>
          <span className="font-mono text-[11px] text-ink/50">
            {isFiltered ? `${sortedRows.length} of ${result.row_count}` : result.row_count} row
            {result.row_count === 1 ? "" : "s"}
            {result.truncated ? " (capped)" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isEmpty && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1 rounded-md border border-ink/10 px-2 py-1 text-xs text-ink/60 transition-colors hover:border-ink/20 hover:text-ink"
              aria-label="Download these results as CSV"
            >
              <Download size={12} aria-hidden="true" /> CSV
            </button>
          )}
          {chartable && (
            <div className="flex overflow-hidden rounded-md border border-ink/10">
              <button
                onClick={() => setView("table")}
                className={`flex items-center gap-1 px-2 py-1 text-xs ${
                  view === "table" ? "bg-ink text-canvas" : "text-ink/50 hover:text-ink"
                }`}
                aria-pressed={view === "table"}
              >
                <Table2 size={12} aria-hidden="true" /> Table
              </button>
              <button
                onClick={() => setView("chart")}
                className={`flex items-center gap-1 px-2 py-1 text-xs ${
                  view === "chart" ? "bg-ink text-canvas" : "text-ink/50 hover:text-ink"
                }`}
                aria-pressed={view === "chart"}
              >
                <BarChart3 size={12} aria-hidden="true" /> Chart
              </button>
            </div>
          )}
        </div>
      </div>

      {isEmpty ? (
        // A query that legitimately matches nothing is a normal outcome, not a
        // failure - so it gets an explanation and a next step rather than an
        // empty grid of column headers.
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <Inbox size={20} className="text-ink/25" aria-hidden="true" />
          <p className="mt-2 text-sm text-ink/60">No rows returned</p>
          <p className="mt-1 max-w-xs text-xs text-ink/40">
            The query ran successfully but nothing matched. Try widening the date range or removing a
            filter from the question.
          </p>
        </div>
      ) : noMatches ? (
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <Search size={20} className="text-ink/25" aria-hidden="true" />
          <p className="mt-2 text-sm text-ink/60">No rows match “{debouncedSearch.trim()}”</p>
          <button
            onClick={() => setSearch("")}
            className="mt-2 rounded-md border border-ink/10 px-2.5 py-1 text-xs text-ink/60 transition-colors hover:border-ink/20 hover:text-ink"
          >
            Clear filter
          </button>
        </div>
      ) : view === "chart" && chartable ? (
        <div className="space-y-2 p-3">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink/40">
            {valueKey} by {labelKey}
          </p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedRows} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
                <XAxis
                  dataKey={labelKey}
                  tick={{ fontSize: 11, fill: palette.axis }}
                  axisLine={{ stroke: palette.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: palette.axis }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: palette.cursor }}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: `1px solid ${palette.tooltipBorder}`,
                    background: palette.tooltipBg,
                    color: palette.tooltipText,
                  }}
                  formatter={(value) => formatCell(value)}
                />
                <Bar dataKey={valueKey} fill={palette.bar} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <>
          {/* Bounded height so the header can stick while rows scroll under it -
              with the row cap at 200 this replaces virtual scrolling, which
              would be over-engineering for a dataset this size. */}
          <div className="max-h-[26rem] overflow-auto scrollbar-thin">
            <table className="w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr>
                  {result.columns.map((column) => {
                    const active = sort?.column === column;
                    const isNumeric = numeric.has(column);
                    return (
                      <th
                        key={column}
                        scope="col"
                        aria-sort={
                          active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"
                        }
                        className={`sticky top-0 z-10 whitespace-nowrap border-b border-ink/10 bg-surface-muted px-3 py-2 font-medium text-ink/60 ${
                          isNumeric ? "text-right" : ""
                        }`}
                      >
                        <button
                          onClick={() => toggleSort(column)}
                          className={`group inline-flex items-center gap-1 transition-colors hover:text-ink ${
                            isNumeric ? "flex-row-reverse" : ""
                          }`}
                          title={`Sort by ${column}`}
                        >
                          <span>{column}</span>
                          {active ? (
                            sort.direction === "asc" ? (
                              <ArrowUp size={11} className="text-amber-dark" aria-hidden="true" />
                            ) : (
                              <ArrowDown size={11} className="text-amber-dark" aria-hidden="true" />
                            )
                          ) : (
                            <ChevronsUpDown
                              size={11}
                              className="text-ink/20 transition-colors group-hover:text-ink/40"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, index) => (
                  <tr key={index} className="group">
                    {result.columns.map((column) => (
                      <td
                        key={column}
                        className={`whitespace-nowrap border-b border-ink/5 px-3 py-2 text-ink/80 transition-colors group-hover:bg-ink/[0.03] ${
                          numeric.has(column) ? "text-right tabular-nums" : ""
                        }`}
                      >
                        {formatCell(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedRows.length > PAGE_SIZES[0] && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 px-3 py-2">
              <label className="flex items-center gap-1.5 font-mono text-[11px] text-ink/40">
                Rows
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(0);
                  }}
                  aria-label="Rows per page"
                  className="rounded border border-ink/10 bg-surface px-1 py-0.5 font-mono text-[11px] text-ink/60 focus:outline-none"
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-ink/40">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="rounded p-1 text-ink/50 hover:bg-ink/5 disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="rounded p-1 text-ink/50 hover:bg-ink/5 disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
