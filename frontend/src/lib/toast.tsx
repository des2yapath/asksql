import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { useTheme } from "./theme";

export type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  pushToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Long enough to read a one-line confirmation without hovering, short enough
// that a stack of them never becomes a backlog the user has to dismiss.
const DISMISS_AFTER_MS = 5000;

const TONE_STYLES: Record<ToastTone, { icon: ReactNode; accent: string }> = {
  success: { icon: <Check size={14} aria-hidden="true" />, accent: "text-teal" },
  error: { icon: <AlertTriangle size={14} aria-hidden="true" />, accent: "text-danger" },
  info: { icon: <Info size={14} aria-hidden="true" />, accent: "text-violet" },
};

/**
 * Small bottom-right toast stack. Deliberately not a dependency: the app only
 * needs fire-and-forget confirmations (copied SQL, exported CSV), and pulling
 * in a library for that would cost more than this file does.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  // The stack renders at the document root, outside the console's themed
  // shell - so it has to re-apply data-theme itself or a toast would stay
  // light while the rest of the product is dark.
  const { theme } = useTheme();

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* aria-live so screen readers announce confirmations; the toasts are
          supplementary, never the only place a result is shown. */}
      <div
        data-theme={theme}
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-72 flex-col gap-2"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const { icon, accent } = TONE_STYLES[toast.tone];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-ink/10 bg-surface-raised px-3 py-2.5 text-[13px] text-ink/85 shadow-lg animate-toast-in"
            >
              <span className={`mt-0.5 shrink-0 ${accent}`}>{icon}</span>
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                className="-mr-1 -mt-1 shrink-0 rounded p-1 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink/70"
                aria-label="Dismiss notification"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside a ToastProvider");
  return context;
}
