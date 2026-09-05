const STEPS = [
  {
    number: "01",
    title: "Ask",
    body: "Type a question in plain English. No SQL, no dashboard config, no waiting on a data team.",
  },
  {
    number: "02",
    title: "Validate",
    body: "The generated query is parsed into an AST, checked against your real schema, and confined to a single read-only SELECT before it ever touches your database.",
  },
  {
    number: "03",
    title: "Explore",
    body: "Get back a real result set - a sortable table, an optional chart, and the exact SQL that ran. Nothing is a black box.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-14 max-w-xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          How it works
        </h2>
        <p className="mt-3 text-ink/65">
          Three steps, every time - and the middle one is the whole reason this is safe to point
          at a real database.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.number}>
            <span className="font-mono text-sm text-amber-dark">{step.number}</span>
            <h3 className="mt-3 font-display text-xl font-semibold text-ink">{step.title}</h3>
            <p className="mt-2 leading-relaxed text-ink/65">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
