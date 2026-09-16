/**
 * Shaped like the answer it's standing in for (explanation line, SQL panel,
 * result table) rather than a generic spinner. The layout is the loading
 * indicator, so the transcript doesn't jump when the real response lands.
 */
export default function QuerySkeleton() {
  const columnWidths = ["w-24", "w-16", "w-20", "w-14"];
  const rowWidths = ["w-32", "w-20", "w-24", "w-16"];

  return (
    <div className="max-w-[92%] space-y-3 animate-fade-in" role="status" aria-live="polite">
      <span className="sr-only">Generating and validating your SQL query…</span>

      <div className="space-y-1.5" aria-hidden="true">
        <div className="skeleton h-3.5 w-3/5" />
        <div className="skeleton h-3.5 w-2/5" />
      </div>

      <div className="overflow-hidden rounded-lg border border-ink/10 bg-ink/[0.03]" aria-hidden="true">
        <div className="flex items-center gap-2 border-b border-ink/10 px-3 py-2">
          <div className="skeleton h-2.5 w-24" style={{ animationDelay: "80ms" }} />
        </div>
        <div className="space-y-2 p-3">
          <div className="skeleton h-3 w-4/5" style={{ animationDelay: "120ms" }} />
          <div className="skeleton h-3 w-3/5" style={{ animationDelay: "180ms" }} />
          <div className="skeleton h-3 w-2/3" style={{ animationDelay: "240ms" }} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-ink/10" aria-hidden="true">
        <div className="flex items-center gap-4 border-b border-ink/10 bg-ink/[0.03] px-3 py-2">
          {columnWidths.map((width, index) => (
            <div
              key={width}
              className={`skeleton h-3 ${width}`}
              style={{ animationDelay: `${index * 60}ms` }}
            />
          ))}
        </div>
        <div className="divide-y divide-ink/5">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-4 px-3 py-2.5">
              {rowWidths.map((width, index) => (
                <div
                  key={width}
                  className={`skeleton h-3 ${width}`}
                  style={{ animationDelay: `${row * 90 + index * 60}ms` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
