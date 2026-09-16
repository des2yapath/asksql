import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types";
import MessageBubble from "./MessageBubble";
import QuerySkeleton from "./QuerySkeleton";

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
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10 scrollbar-thin">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-light text-teal">
          <span className="font-mono text-lg">&rsaquo;_</span>
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink/85">
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
              className="rounded-lg border border-ink/10 bg-surface px-3.5 py-2.5 text-left text-[13px] text-ink/70 shadow-panel transition-colors hover:border-ink/20 hover:text-ink"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    // aria-live on the transcript so a screen reader announces the answer as
    // it lands, without stealing focus from the input the user is still in.
    <div
      className="flex-1 space-y-5 overflow-y-auto px-4 py-6 scrollbar-thin md:px-6"
      aria-live="polite"
      aria-busy={isThinking}
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isThinking && <QuerySkeleton />}
      <div ref={bottomRef} />
    </div>
  );
}
