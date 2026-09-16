import type { ReactNode } from "react";
import { AlertTriangle, Columns3, Rows3, Timer } from "lucide-react";
import type { QueryResultData } from "../../types";

interface Props {
  result: QueryResultData;
  executionTimeMs: number | null;
  warning: string | null;
}

function Stat({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "neutral" | "warning";
}) {
  const toneClass = tone === "warning" ? "text-amber-dark" : "text-ink/50";
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-ink/10 bg-surface px-2.5 py-1">
      <span className={`shrink-0 ${toneClass}`} aria-hidden="true">
        {icon}
      </span>
      <span className="text-[11px] uppercase tracking-wide text-ink/40">{label}</span>
      <span className="text-[13px] font-medium tabular-nums text-ink/80">{value}</span>
    </div>
  );
}

/**
 * The "at a glance" row that precedes the detail. Row count and latency are the
 * two numbers that tell you whether a result is trustworthy, so they sit above
 * the SQL and table where they're readable without scanning.
 */
export default function StatStrip({ result, executionTimeMs, warning }: Props) {
  const rowValue = result.truncated ? `${result.row_count}+` : String(result.row_count);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Stat
        icon={<Rows3 size={12} />}
        label="Rows"
        value={rowValue}
        tone={result.truncated ? "warning" : "neutral"}
      />
      <Stat icon={<Columns3 size={12} />} label="Cols" value={String(result.columns.length)} />
      {executionTimeMs != null && (
        <Stat icon={<Timer size={12} />} label="Ran" value={`${executionTimeMs}ms`} />
      )}
      {result.truncated && (
        <span className="flex items-center gap-1 rounded-md border border-amber/30 bg-amber/10 px-2 py-1 text-[11px] text-amber-dark">
          <AlertTriangle size={11} aria-hidden="true" />
          Row cap reached
        </span>
      )}
      {warning && (
        <span className="flex items-center gap-1 rounded-md border border-amber/30 bg-amber/10 px-2 py-1 text-[11px] text-amber-dark">
          <AlertTriangle size={11} aria-hidden="true" />
          {warning}
        </span>
      )}
    </div>
  );
}
