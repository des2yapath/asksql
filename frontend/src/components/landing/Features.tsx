import { Database, History, ShieldCheck, Timer } from "lucide-react";

const FEATURES = [
  {
    icon: Database,
    title: "Schema-aware",
    body: "Reads your actual tables and columns before generating a query, so it isn't guessing at a column name that doesn't exist.",
  },
  {
    icon: ShieldCheck,
    title: "Read-only by design",
    body: "Runs on a database role that can only SELECT. Nothing a question asks for can write, alter, or drop anything.",
  },
  {
    icon: Timer,
    title: "Timeouts and row caps",
    body: "Every query runs inside a bounded, read-only transaction with a hard row limit - a runaway query can't take down your database.",
  },
  {
    icon: History,
    title: "Full transparency",
    body: "Every answer ships with the exact SQL that ran and how long it took. If you don't trust the answer, you can read the query.",
  },
];

export default function Features() {
  return (
    <section className="border-y border-ink/5 bg-white/60 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-light text-teal">
                <Icon size={19} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 leading-relaxed text-ink/65">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
