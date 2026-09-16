import { useEffect, useRef, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
  /** Desktop only: focusing the box on load puts the cursor where the user
   * already intends to go. Skipped on mobile, where it would force the
   * on-screen keyboard open over the whole page. */
  autoFocus?: boolean;
}

export default function QueryInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  autoFocus = false,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

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
    <div className="space-y-1.5">
      <div className="flex items-end gap-2 rounded-xl border border-ink/10 bg-surface px-3 py-2 shadow-panel transition-colors focus-within:border-violet/40">
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
          <ArrowUp size={16} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>
      {/* Progressive disclosure of the keyboard model - discoverable exactly
          where it's relevant, and quiet enough to ignore once learned. */}
      <p className="hidden px-1 font-mono text-[10.5px] text-ink/35 sm:block">
        Enter to run · Shift + Enter for a new line
      </p>
    </div>
  );
}
