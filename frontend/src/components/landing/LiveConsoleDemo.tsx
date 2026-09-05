import { useEffect, useRef, useState } from "react";
import { highlightSql } from "../../lib/sqlHighlight";

/**
 * The hero's signature element: a scripted, looping replay of what actually
 * happens when someone uses AskSQL - question in, validated SQL out,
 * results back. Canned/deterministic on purpose (the real thing lives at
 * /console) so this always renders instantly and identically for every
 * visitor, cold-start backend or not.
 *
 * The data below intentionally mirrors backend/scripts/seed_demo_data.sql -
 * these are the same customers/products that ship with the demo database,
 * so the hero isn't promising something the live console can't back up.
 */
const EXAMPLES = [
  {
    question: "Which 5 customers spent the most last quarter?",
    sql: `SELECT c.name, SUM(o.total_cents) / 100.0 AS revenue
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.created_at >= now() - interval '90 days'
GROUP BY c.name
ORDER BY revenue DESC
LIMIT 5;`,
    columns: ["name", "revenue"],
    rows: [
      ["Wei Zhang", "$2,375.84"],
      ["Maria Gonzalez", "$1,685.94"],
      ["Sofia Rossi", "$1,574.94"],
      ["Fatima Al-Sayed", "$1,508.88"],
      ["Kenji Tanaka", "$1,472.91"],
    ],
    meta: "5 rows · 210ms",
  },
  {
    question: "Best selling product category this month?",
    sql: `SELECT p.category, SUM(oi.quantity) AS units_sold
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders o ON o.id = oi.order_id
WHERE date_trunc('month', o.created_at) = date_trunc('month', now())
GROUP BY p.category
ORDER BY units_sold DESC
LIMIT 5;`,
    columns: ["category", "units_sold"],
    rows: [
      ["Electronics", "142"],
      ["Accessories", "98"],
      ["Furniture", "41"],
      ["Stationery", "37"],
      ["Bags", "22"],
    ],
    meta: "5 rows · 178ms",
  },
];

type Phase = "typing" | "thinking" | "sql" | "results";

export default function LiveConsoleDemo() {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [typedChars, setTypedChars] = useState(0);
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const example = EXAMPLES[exampleIndex];

  // Types out the question, one character at a time.
  useEffect(() => {
    if (prefersReducedMotion.current) {
      setPhase("results");
      setTypedChars(example.question.length);
      return;
    }

    setTypedChars(0);
    setPhase("typing");

    const interval = setInterval(() => {
      setTypedChars((prev) => {
        if (prev >= example.question.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 32);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exampleIndex]);

  // Advances typing -> thinking once the question is fully typed.
  useEffect(() => {
    if (prefersReducedMotion.current) return;
    if (phase === "typing" && typedChars >= example.question.length) {
      const t = setTimeout(() => setPhase("thinking"), 350);
      return () => clearTimeout(t);
    }
  }, [typedChars, phase, example.question.length]);

  // Drives the rest of the phase machine: thinking -> sql -> results -> next example.
  useEffect(() => {
    if (prefersReducedMotion.current) return;
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "thinking") {
      timer = setTimeout(() => setPhase("sql"), 700);
    } else if (phase === "sql") {
      timer = setTimeout(() => setPhase("results"), 1100);
    } else if (phase === "results") {
      timer = setTimeout(() => {
        setExampleIndex((i) => (i + 1) % EXAMPLES.length);
      }, 3400);
    }
    return () => clearTimeout(timer);
  }, [phase]);

  const showSql = phase === "sql" || phase === "results";
  const showResults = phase === "results";

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-ink shadow-panel">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-teal" />
        <span className="font-mono text-xs text-white/50">asksql — live preview</span>
      </div>

      <div className="space-y-4 p-5">
        {/* Question */}
        <div className="flex items-start gap-2 font-mono text-sm">
          <span className="text-amber">&gt;</span>
          <span className="text-white/90">
            {example.question.slice(0, typedChars)}
            {phase === "typing" && (
              <span className="ml-px inline-block h-4 w-[7px] translate-y-[2px] animate-pulse bg-amber/80" />
            )}
          </span>
        </div>

        {/* Thinking */}
        {phase === "thinking" && (
          <div className="flex items-center gap-1.5 pl-5 font-mono text-xs text-white/40">
            <span>Generating SQL</span>
            <span className="flex gap-0.5">
              <span className="h-1 w-1 animate-bounce rounded-full bg-white/40 [animation-delay:-0.3s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-white/40 [animation-delay:-0.15s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-white/40" />
            </span>
          </div>
        )}

        {/* SQL */}
        {showSql && (
          <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 font-mono text-[13px] leading-relaxed text-white/80">
            <code>{highlightSql(example.sql)}</code>
          </pre>
        )}

        {/* Results */}
        {showResults && (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-left font-mono text-[13px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  {example.columns.map((col) => (
                    <th key={col} className="px-3 py-1.5 font-medium text-white/50">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {example.rows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 text-white/80 last:border-0"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-teal">
              {example.meta}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
