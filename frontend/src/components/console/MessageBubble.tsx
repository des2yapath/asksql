import { AlertTriangle, HelpCircle } from "lucide-react";
import type { ChatMessage } from "../../types";
import ResultsTable from "./ResultsTable";
import SqlBlock from "./SqlBlock";
import StatStrip from "./StatStrip";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-fade-in">
        {/* bg-ink on text-canvas is an "inverted surface": in light mode that's
            dark-on-light, in dark mode it flips to light-on-dark. Same pair,
            correct contrast in both themes - no conditional class needed. */}
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-ink px-4 py-2.5 text-[15px] text-canvas">
          {message.question}
        </div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger/[0.07] px-4 py-3 text-sm text-danger animate-fade-in">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span>{message.errorText}</span>
      </div>
    );
  }

  const response = message.response;
  if (!response) return null;

  if (response.needs_clarification) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-amber/25 bg-amber/[0.06] px-4 py-3 text-sm text-ink/80 animate-fade-in">
        <HelpCircle size={16} className="mt-0.5 shrink-0 text-amber-dark" strokeWidth={1.75} aria-hidden="true" />
        {/* The backend also sets needs_clarification for the read-only refusal
            (query.py treats a null sql as "nothing to run"), but a refusal
            carries its text in `explanation`, not `clarification_question` -
            without the fallback the bubble renders completely empty. */}
        <span>{response.clarification_question ?? response.explanation}</span>
      </div>
    );
  }

  return (
    <div className="max-w-[92%] space-y-3 animate-fade-in">
      {response.explanation && <p className="text-[15px] leading-relaxed text-ink/85">{response.explanation}</p>}
      {/* Summary numbers sit above the SQL: whether the answer is trustworthy
          is a faster judgement than reading the query that produced it. */}
      {response.result && (
        <StatStrip
          result={response.result}
          executionTimeMs={response.execution_time_ms}
          warning={response.warning}
        />
      )}
      {response.sql && <SqlBlock sql={response.sql} />}
      {response.result && <ResultsTable result={response.result} />}
      {/* A question the model wouldn't answer still deserves the timing/nudge;
          when there's no result the stats above don't render, so surface it. */}
      {!response.result && response.execution_time_ms != null && (
        <p className="font-mono text-[11px] text-ink/35">Ran in {response.execution_time_ms}ms</p>
      )}
    </div>
  );
}
