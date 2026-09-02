import { useRef, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
}

export default function QueryInput({ value, onChange, onSubmit, disabled, placeholder }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    // Auto-grow up to a sane cap so a pasted essay doesn't take over the screen.
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2 shadow-panel">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-[15px] text-ink placeholder:text-ink/35 focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-canvas transition-colors hover:bg-ink/85 disabled:opacity-25"
        aria-label="Send question"
      >
        <ArrowUp size={16} strokeWidth={2.25} />
      </button>
    </div>
  );
}
