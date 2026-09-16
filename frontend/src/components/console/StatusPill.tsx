import type { WakeState } from "../../hooks/useBackendWakeUp";

export const WAKE_CONFIG: Record<WakeState, { label: string; dot: string; detail: string }> = {
  // Same four states every time, colour-coded consistently (green = good,
  // amber = in progress, red = broken, grey = unknown) so the dot alone is
  // readable once it's been seen. The title carries the detail for anyone
  // who wants to know why.
  checking: {
    label: "Connecting…",
    dot: "bg-ink/30",
    detail: "Probing the backend health endpoint.",
  },
  waking: {
    label: "Waking up server…",
    dot: "bg-amber animate-pulse",
    detail: "The free-tier backend sleeps when idle; a cold start can take up to a minute.",
  },
  ready: {
    label: "Connected",
    dot: "bg-teal",
    detail: "Backend reachable - questions will run against the live database.",
  },
  unreachable: {
    label: "Can't reach backend",
    dot: "bg-danger",
    detail: "No response after repeated attempts. Check the API base URL, then reload the page.",
  },
};

export default function StatusPill({ wakeState, compact = false }: { wakeState: WakeState; compact?: boolean }) {
  const { label, dot, detail } = WAKE_CONFIG[wakeState];

  if (compact) {
    return (
      <span role="status" title={detail} className="flex items-center gap-1.5 text-xs text-ink/60">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
        <span className="hidden sm:inline">{label}</span>
        <span className="sr-only sm:hidden">{label}</span>
      </span>
    );
  }

  return (
    <div
      role="status"
      title={detail}
      className="flex items-center gap-2 rounded-lg border border-ink/10 bg-surface px-2.5 py-1.5 text-xs text-ink/70"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </div>
  );
}
