import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { highlightSql } from "../../lib/sqlHighlight";
import { useToast } from "../../lib/toast";

export default function SqlBlock({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false);
  const { pushToast } = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      pushToast("SQL copied to clipboard", "success");
    } catch {
      // Clipboard API can be blocked (permissions, insecure context). Tell the
      // user rather than failing silently - a copy button that does nothing is
      // worse than one that admits it can't.
      pushToast("Couldn't access the clipboard", "error");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-ink/10 bg-ink">
      {/* This panel is an inverted surface, so its chrome uses canvas-tinted
          values that flip with the theme instead of literal white. */}
      <div className="flex items-center justify-between border-b border-canvas/10 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-canvas/40">
          Generated SQL
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] text-canvas/50 transition-colors hover:text-canvas/90"
        >
          {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[13px] leading-relaxed text-canvas/85 scrollbar-thin">
        <code>{highlightSql(sql)}</code>
      </pre>
    </div>
  );
}
