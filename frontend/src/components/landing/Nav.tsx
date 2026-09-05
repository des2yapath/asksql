import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-mono text-lg text-amber-dark">&rsaquo;_</span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            AskSQL
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-ink/70 md:flex">
          <a href="#how-it-works" className="transition-colors hover:text-ink">
            How it works
          </a>
          <a href="#security" className="transition-colors hover:text-ink">
            Security
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-ink"
          >
            <ArrowUpRight size={16} strokeWidth={1.75} />
            GitHub
          </a>
        </nav>

        <Link
          to="/console"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-ink/85"
        >
          Open the console
        </Link>
      </div>
    </header>
  );
}
