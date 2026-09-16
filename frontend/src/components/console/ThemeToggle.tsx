import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../lib/theme";

/**
 * Icon-only toggle. The label names the *destination* ("Switch to dark theme")
 * rather than the current state - a button that says what it will do is less
 * ambiguous than one that describes what's already true.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-ink/10 bg-surface text-ink/60 transition-colors hover:border-ink/20 hover:text-ink"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
    </button>
  );
}
