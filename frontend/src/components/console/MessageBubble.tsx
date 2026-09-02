import { AlertTriangle, HelpCircle } from "lucide-react";
import type { ChatMessage } from "../../types";
import ResultsTable from "./ResultsTable";
import SqlBlock from "./SqlBlock";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-ink px-4 py-2.5 text-[15px] text-canvas">
          {message.question}
        </div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={1.75} />
        <span>{message.errorText}</span>
      </div>
    );
  }

  const response = message.response;
  if (!response) return null;

  if (response.needs_clarification) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-amber/25 bg-amber/[0.06] px-4 py-3 text-sm text-ink/80">
        <HelpCircle size={16} className="mt-0.5 shrink-0 text-amber-dark" strokeWidth={1.75} />
        <span>{response.clarification_question}</span>
      </div>
    );
  }

  return (
    <div className="max-w-[92%] space-y-3">
      {response.explanation && <p className="text-[15px] leading-relaxed text-ink/85">{response.explanation}</p>}
      {response.sql && <SqlBlock sql={response.sql} />}
      {response.result && <ResultsTable result={response.result} />}
      {response.execution_time_ms != null && (
        <p className="font-mono text-[11px] text-ink/35">Ran in {response.execution_time_ms}ms</p>
      )}
    </div>
  );
}
