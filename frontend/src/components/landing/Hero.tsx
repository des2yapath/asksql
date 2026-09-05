import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import LiveConsoleDemo from "./LiveConsoleDemo";

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 py-20 md:grid-cols-2 md:py-28">
      <div>
        <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
          Ask your database questions.{" "}
          <span className="text-amber-dark">Get back data,</span> not a support ticket.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/65">
          AskSQL turns plain English into validated, read-only SQL and runs it against your
          actual Postgres schema - no analyst, no ticket queue, no guessing at column names.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            to="/console"
            className="flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-medium text-canvas transition-colors hover:bg-ink/85"
          >
            Try the live console
            <ArrowRight size={16} strokeWidth={2} />
          </Link>
          <a
            href="#how-it-works"
            className="rounded-lg px-5 py-3 text-sm font-medium text-ink/70 transition-colors hover:text-ink"
          >
            See how it works
          </a>
        </div>
        <p className="mt-6 font-mono text-xs text-ink/40">
          Works with your existing Postgres database. No schema migration required.
        </p>
      </div>

      <LiveConsoleDemo />
    </section>
  );
}
