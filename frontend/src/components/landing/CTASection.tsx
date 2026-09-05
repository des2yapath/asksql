import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-col items-start justify-between gap-8 rounded-2xl bg-ink px-8 py-12 md:flex-row md:items-center md:px-14">
        <div>
          <h2 className="font-display text-2xl font-semibold text-canvas md:text-3xl">
            Connect your database in under five minutes.
          </h2>
          <p className="mt-2 max-w-md text-canvas/60">
            Point it at a Postgres connection string and a schema. That's the whole setup.
          </p>
        </div>
        <Link
          to="/console"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-amber px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-amber-dark"
        >
          Open the console
          <ArrowRight size={16} strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
