import { useState } from "react";
import { ChevronRight, Clock, Database, KeyRound, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { SchemaResponse } from "../../types";
import type { WakeState } from "../../hooks/useBackendWakeUp";

interface Props {
  schema: SchemaResponse | null;
  schemaError: string | null;
  wakeState: WakeState;
  history: string[];
  onSelectHistoryItem: (question: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

function StatusPill({ wakeState }: { wakeState: WakeState }) {
  const config: Record<WakeState, { label: string; dot: string }> = {
    checking: { label: "Connecting…", dot: "bg-ink/30" },
    waking: { label: "Waking up server…", dot: "bg-amber animate-pulse" },
    ready: { label: "Connected", dot: "bg-teal" },
    unreachable: { label: "Can't reach backend", dot: "bg-danger" },
  };
  const { label, dot } = config[wakeState];
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-lg border border-ink/10 bg-white px-2.5 py-1.5 text-xs text-ink/70"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </div>
  );
}

function TableRow({ name, columns }: { name: string; columns: SchemaResponse["tables"][number]["columns"] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-ink/75 hover:bg-ink/5"
      >
        <ChevronRight
          size={13}
          className={`shrink-0 text-ink/40 transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        />
        <span className="truncate font-mono text-[13px]">{name}</span>
      </button>
      {open && (
        <div className="ml-6 space-y-0.5 border-l border-ink/10 pl-3">
          {columns.map((col) => (
            <div key={col.name} className="flex items-center gap-1.5 py-0.5 font-mono text-[12px] text-ink/55">
              {col.primary_key && <KeyRound size={10} className="shrink-0 text-amber-dark" aria-hidden="true" />}
              <span className="truncate">{col.name}</span>
              <span className="ml-auto shrink-0 text-ink/45">{col.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  schema,
  schemaError,
  wakeState,
  history,
  onSelectHistoryItem,
  isMobileOpen,
  onCloseMobile,
}: Props) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-72 shrink-0 flex-col border-r border-ink/10 bg-white transition-transform duration-200 md:static md:translate-x-0 ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Database schema"
    >
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-4">
        <Link to="/" className="flex items-center gap-2" onClick={onCloseMobile}>
          <span className="font-mono text-base text-amber-dark">&rsaquo;_</span>
          <span className="font-display text-base font-semibold text-ink">AskSQL</span>
        </Link>
        <button
          onClick={onCloseMobile}
          className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5 md:hidden"
          aria-label="Close sidebar"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="px-4 pt-4">
        <StatusPill wakeState={wakeState} />
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 scrollbar-thin">
        <div>
          <div className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-ink/60">
            <Database size={12} aria-hidden="true" /> Schema
          </div>
          {schemaError && <p className="px-2 text-xs text-danger">{schemaError}</p>}
          {!schema && !schemaError && <p className="px-2 text-xs text-ink/60">Loading schema…</p>}
          {schema?.tables.map((table) => (
            <TableRow key={table.name} name={table.name} columns={table.columns} />
          ))}
        </div>

        {history.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-ink/60">
              <Clock size={12} aria-hidden="true" /> Recent
            </div>
            <div className="space-y-0.5">
              {history.map((question) => (
                <button
                  key={question}
                  onClick={() => {
                    onSelectHistoryItem(question);
                    onCloseMobile();
                  }}
                  className="block w-full truncate rounded-md px-2 py-1.5 text-left text-[13px] text-ink/60 hover:bg-ink/5 hover:text-ink"
                  title={question}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
