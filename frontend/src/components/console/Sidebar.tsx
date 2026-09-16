import { useState } from "react";
import { ChevronRight, Clock, Database, KeyRound, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { SchemaResponse } from "../../types";
import type { WakeState } from "../../hooks/useBackendWakeUp";
import StatusPill, { WAKE_CONFIG } from "./StatusPill";

interface Props {
  schema: SchemaResponse | null;
  schemaError: string | null;
  wakeState: WakeState;
  history: string[];
  onSelectHistoryItem: (question: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/** Placeholder shaped like the table list it replaces, so the panel doesn't
 * jump when the schema lands. Beats a centred spinner for something this
 * small - the layout is the loading indicator. */
function SchemaSkeleton() {
  const widths = [62, 78, 54, 70];
  return (
    <div className="space-y-2 px-2 py-1">
      <span className="sr-only" role="status">
        Loading database schema…
      </span>
      {widths.map((width, index) => (
        <div
          key={width}
          className="flex items-center gap-2"
          style={{ animationDelay: `${index * 150}ms` }}
          aria-hidden="true"
        >
          <div className="skeleton h-3 w-3 shrink-0" />
          <div className="skeleton h-3" style={{ width: `${width}%` }} />
        </div>
      ))}
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
  collapsed,
  onToggleCollapse,
}: Props) {
  const tableCount = schema?.tables.length ?? 0;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex shrink-0 flex-col border-r border-ink/10 bg-surface transition-[transform,width] duration-200 md:static md:translate-x-0 ${
        collapsed ? "w-72 md:w-[68px]" : "w-72"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      aria-label="Database schema and recent questions"
    >
      {/* Collapsed rail. Desktop-only: on mobile this is a drawer, and an
          icon rail inside a drawer would be strictly worse than the list. */}
      <div className={`hidden flex-1 flex-col items-center py-3 ${collapsed ? "md:flex" : "md:hidden"}`}>
        <Link
          to="/"
          onClick={onCloseMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-amber-dark hover:bg-ink/5"
          title="AskSQL"
        >
          <span className="font-mono text-base">&rsaquo;_</span>
        </Link>

        <div className="mt-4 flex flex-col items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/55 hover:bg-ink/5 hover:text-ink"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={17} aria-hidden="true" />
          </button>
          <span className="my-1 h-px w-6 bg-ink/10" aria-hidden="true" />
          <button
            onClick={onToggleCollapse}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/55 hover:bg-ink/5 hover:text-ink"
            title={`${tableCount} tables in schema`}
            aria-label="Show schema"
          >
            <Database size={17} aria-hidden="true" />
            {tableCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-ink/10 px-1 font-mono text-[9px] text-ink/60">
                {tableCount}
              </span>
            )}
          </button>
          <button
            onClick={onToggleCollapse}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/55 hover:bg-ink/5 hover:text-ink"
            title={`${history.length} recent question${history.length === 1 ? "" : "s"}`}
            aria-label="Show recent questions"
          >
            <Clock size={17} aria-hidden="true" />
            {history.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-ink/10 px-1 font-mono text-[9px] text-ink/60">
                {history.length}
              </span>
            )}
          </button>
        </div>

        <div className="mt-auto pb-1">
          <span
            role="status"
            title={WAKE_CONFIG[wakeState].detail}
            className={`block h-2 w-2 rounded-full ${WAKE_CONFIG[wakeState].dot}`}
          />
          <span className="sr-only">{WAKE_CONFIG[wakeState].label}</span>
        </div>
      </div>

      {/* Full panel. On desktop it's hidden while collapsed; below md it stays
          visible because the drawer never collapses to icons. */}
      <div className={`flex min-h-0 flex-1 flex-col ${collapsed ? "md:hidden" : ""}`}>
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-4">
          <Link to="/" className="flex items-center gap-2" onClick={onCloseMobile}>
            <span className="font-mono text-base text-amber-dark">&rsaquo;_</span>
            <span className="font-display text-base font-semibold text-ink">AskSQL</span>
          </Link>
          <div className="flex items-center gap-0.5">
            <button
              onClick={onToggleCollapse}
              className="hidden rounded-md p-1.5 text-ink/50 hover:bg-ink/5 hover:text-ink md:block"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={16} aria-hidden="true" />
            </button>
            <button
              onClick={onCloseMobile}
              className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5 md:hidden"
              aria-label="Close sidebar"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
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
            {!schema && !schemaError && <SchemaSkeleton />}
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
      </div>
    </aside>
  );
}
