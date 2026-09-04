import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { ApiError, askQuestion, fetchSchema } from "../lib/api";
import { useBackendWakeUp } from "../hooks/useBackendWakeUp";
import { useQueryHistory } from "../hooks/useQueryHistory";
import { useIsDesktop } from "../hooks/useMediaQuery";
import type { ChatMessage, SchemaResponse } from "../types";
import Sidebar from "../components/console/Sidebar";
import ChatPanel from "../components/console/ChatPanel";
import QueryInput from "../components/console/QueryInput";

export default function Console() {
  const wakeState = useBackendWakeUp();
  const { history, addQuestion } = useQueryHistory();
  const isDesktop = useIsDesktop();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Don't fetch the schema until the backend is confirmed up - otherwise it
  // races the health probe against the same sleeping Render instance.
  useEffect(() => {
    if (wakeState !== "ready") return;
    fetchSchema()
      .then(setSchema)
      .catch((err) => setSchemaError(err instanceof ApiError ? err.message : "Couldn't load schema."));
  }, [wakeState]);

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
    <div className="flex h-screen bg-canvas">
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
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-ink/10 bg-canvas/80 px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-ink/70 hover:bg-ink/5"
            aria-label="Open sidebar"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="font-mono text-sm text-amber-dark">&rsaquo;_</span>
            <span className="font-display text-sm font-semibold text-ink">AskSQL</span>
          </Link>
        </div>

        <main className="flex min-h-0 flex-1 flex-col">
          <h1 className="sr-only">AskSQL console</h1>
          <ChatPanel messages={messages} isThinking={isThinking} onExampleClick={handleSubmit} />

          <div className="border-t border-ink/10 bg-canvas/80 px-4 py-4 backdrop-blur-sm md:px-6">
            <div className="mx-auto max-w-3xl" id="chat-input">
              <QueryInput
                value={input}
                onChange={setInput}
                onSubmit={() => handleSubmit(input)}
                disabled={inputDisabled}
                placeholder={placeholder}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
