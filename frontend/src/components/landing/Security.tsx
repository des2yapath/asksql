import { Check } from "lucide-react";

const CHECKS = [
  "The connection AskSQL uses only has SELECT grants - never INSERT, UPDATE, DELETE, or DDL of any kind.",
  "Every generated query is parsed into a real SQL AST and checked structurally, not pattern-matched against a blocklist of scary words.",
  "Stacked statements are rejected outright - a query can't hide a second, destructive statement after a semicolon.",
  "Queries are restricted to the exact tables exposed in the schema - no reaching into information_schema or pg_catalog.",
  "Every query runs inside a read-only transaction with a hard statement timeout, so nothing can hang the connection pool.",
];

export default function Security() {
  return (
    <section id="security" className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-20">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
            How AskSQL keeps your database safe
          </h2>
          <p className="mt-4 leading-relaxed text-ink/65">
            Letting a language model write SQL against a real database is a reasonable thing to
            be nervous about. This is the actual guardrail design, not a marketing summary of
            it - the same checks run on every single request.
          </p>
        </div>

        <ul className="space-y-5">
          {CHECKS.map((check) => (
            <li key={check} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-light text-teal">
                <Check size={13} strokeWidth={2.5} />
              </span>
              <span className="leading-relaxed text-ink/75">{check}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
