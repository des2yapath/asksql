import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types";
import MessageBubble from "./MessageBubble";

const EXAMPLE_PROMPTS = [
  "Show me the 5 most recent orders",
  "What's our total revenue this month?",
  "Which customers haven't ordered in 90 days?",
  "Top 5 products by units sold",
];

interface Props {
  messages: ChatMessage[];
  isThinking: boolean;
  onExampleClick: (prompt: string) => void;
}

export default function ChatPanel({ messages, isThinking, onExampleClick }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isThinking]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <h2 className="font-display text-2xl font-semibold text-ink/80">
          Ask something about your data
        </h2>
        <p className="mt-2 max-w-sm text-center text-sm text-ink/50">
          Runs against the seeded demo database - a small e-commerce dataset with customers,
          orders, and products.
        </p>
        <div className="mt-8 grid max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onExampleClick(prompt)}
              className="rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 text-left text-[13px] text-ink/70 shadow-panel transition-colors hover:border-ink/20 hover:text-ink"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 scrollbar-thin">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isThinking && (
        <div className="flex items-center gap-1.5 pl-1 font-mono text-xs text-ink/40">
          <span>Thinking</span>
          <span className="flex gap-0.5">
            <span className="h-1 w-1 animate-bounce rounded-full bg-ink/30 [animation-delay:-0.3s]" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-ink/30 [animation-delay:-0.15s]" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-ink/30" />
          </span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
