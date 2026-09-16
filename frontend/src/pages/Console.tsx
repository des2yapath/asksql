import { useEffect, useState } from "react";
import { Menu, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { ApiError, askQuestion, fetchSchema } from "../lib/api";
import { useTheme } from "../lib/theme";
import { useBackendWakeUp } from "../hooks/useBackendWakeUp";
import { useQueryHistory } from "../hooks/useQueryHistory";
import { useIsDesktop } from "../hooks/useMediaQuery";
import type { ChatMessage, SchemaResponse } from "../types";
import Sidebar from "../components/console/Sidebar";
import ChatPanel from "../components/console/ChatPanel";
import QueryInput from "../components/console/QueryInput";
import StatusPill from "../components/console/StatusPill";
import ThemeToggle from "../components/console/ThemeToggle";

const SIDEBAR_STORAGE_KEY = "asksql:sidebar-collapsed";

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export default function Console() {
  const wakeState = useBackendWakeUp();
  const { history, addQuestion } = useQueryHistory();
  const isDesktop = useIsDesktop();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialCollapsed);

  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Remember the collapsed preference across reloads - it's a layout choice,
  // and re-collapsing it on every visit would be a small recurring annoyance.
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // Non-persistent is acceptable; the layout still works this session.
    }
  }, [sidebarCollapsed]);

  // Don't fetch the schema until the backend is confirmed up - otherwise it
  // races the health probe against the same sleeping Render instance.
  useEffect(() => {
    if (wakeState !== "ready") return;
    fetchSchema()
      .then(setSchema)
      .catch((err) => setSchemaError(err instanceof ApiError ? err.message : "Couldn't load schema."));
  }, [wakeState]);

  // Escape closes the mobile schema drawer - the backdrop click is a mouse
  // affordance, and a slide-in panel that traps keyboard users is worse than
  // no panel at all.
  useEffect(() => {
    if (!sidebarOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  async function handleSubmit(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isThinking) return;

    setInput("");
    addQuestion(trimmed);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", question: trimmed, createdAt: Date.now() },
    ]);
    setIsThinking(true);

    try {
      const response = await askQuestion(trimmed);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", response, createdAt: Date.now() },
      ]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong reaching AskSQL.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "error", errorText: message, question: trimmed, createdAt: Date.now() },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  const inputDisabled = isThinking || wakeState === "unreachable";
  const placeholder =
    wakeState === "waking"
      ? "Waking up the free-tier server - this can take up to a minute…"
      : wakeState === "unreachable"
        ? "Backend is unreachable right now"
        : "Ask a question about your data…";

  return (
    // data-theme scopes the whole token set to the product surface. The
    // marketing pages live outside this subtree, so they stay on the light
    // brand regardless of the console's theme.
    <div data-theme={theme} className="flex h-screen bg-canvas text-ink">
      <a
        href="#chat-input"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-canvas"
      >
        Skip to chat input
      </a>
      {!isDesktop && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-ink/30 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        schema={schema}
        schemaError={schemaError}
        wakeState={wakeState}
        history={history}
        onSelectHistoryItem={handleSubmit}
        isMobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky top bar: orientation on the left, live state and controls on
            the right. Kept for every breakpoint now, not just mobile - the
            status and theme controls shouldn't disappear on desktop. */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-ink/10 bg-canvas/85 px-4 backdrop-blur-md md:px-5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-ink/70 hover:bg-ink/5 md:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={18} aria-hidden="true" />
          </button>

          <Link to="/" className="flex items-center gap-2 md:hidden">
            <span className="font-mono text-sm text-amber-dark">&rsaquo;_</span>
            <span className="font-display text-sm font-semibold text-ink">AskSQL</span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <span className="font-mono text-xs text-ink/40">AskSQL</span>
            <span className="text-ink/20" aria-hidden="true">
              /
            </span>
            <h1 className="font-display text-sm font-semibold text-ink">SQL Console</h1>
          </div>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <span
              title="Queries run on a read-only database role with a hard row cap."
              className="hidden items-center gap-1.5 rounded-md border border-ink/10 bg-surface px-2 py-1 text-[11px] text-ink/55 sm:flex"
            >
              <ShieldCheck size={12} className="text-teal" aria-hidden="true" />
              Read-only
            </span>
            <StatusPill wakeState={wakeState} compact />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col">
          <ChatPanel messages={messages} isThinking={isThinking} onExampleClick={handleSubmit} />

          <div className="border-t border-ink/10 bg-canvas/85 px-4 py-4 backdrop-blur-sm md:px-6">
            <div className="mx-auto max-w-3xl" id="chat-input">
              <QueryInput
                value={input}
                onChange={setInput}
                onSubmit={() => handleSubmit(input)}
                disabled={inputDisabled}
                placeholder={placeholder}
                autoFocus={isDesktop}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
