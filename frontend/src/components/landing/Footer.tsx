export default function Footer() {
  return (
    <footer className="border-t border-ink/5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-ink/50 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-mono text-amber-dark">&rsaquo;_</span>
          <span className="font-display font-semibold text-ink/70">AskSQL</span>
        </div>
        <p>Built with FastAPI, React, PostgreSQL, and Groq.</p>
        <p>A portfolio project - not affiliated with any similarly named product.</p>
      </div>
    </footer>
  );
}
