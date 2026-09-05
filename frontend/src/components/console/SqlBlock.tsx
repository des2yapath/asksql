import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { highlightSql } from "../../lib/sqlHighlight";

export default function SqlBlock({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be blocked (permissions, insecure context) -
      // failing silently is fine here, it's a convenience action.
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-ink/10 bg-ink">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wide text-white/40">
          Generated SQL
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] text-white/50 transition-colors hover:text-white/90"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[13px] leading-relaxed text-white/85 scrollbar-thin">
        <code>{highlightSql(sql)}</code>
      </pre>
    </div>
  );
}
