import { useCallback, useEffect, useState } from "react";

/**
 * Recently-asked questions, shown in the sidebar so people can re-run one
 * without retyping it. Persisted to localStorage purely as a nice-to-have -
 * this is NOT a substitute for real conversation history, which would need
 * to live server-side keyed to an authenticated user.
 *
 * TODO: once there's auth (see backend/app/api/deps.py), move this server
 * side so history survives switching devices/browsers instead of being
 * wiped the moment someone clears site data.
 */
const STORAGE_KEY = "asksql:recent-questions";
const MAX_ENTRIES = 12;

export function useQueryHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // Corrupt or inaccessible localStorage (private browsing, etc.) -
      // just start with empty history instead of throwing.
    }
  }, []);

  const addQuestion = useCallback((question: string) => {
    setHistory((prev) => {
      const deduped = [question, ...prev.filter((q) => q !== question)].slice(0, MAX_ENTRIES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
      } catch {
        // Storage full/unavailable - history just won't persist this session.
      }
      return deduped;
    });
  }, []);

  return { history, addQuestion };
}
