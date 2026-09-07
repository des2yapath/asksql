import { useEffect, useState } from "react";
import { pingHealth } from "../lib/api";

// Render's free tier spins the backend down after ~15 min idle, and a cold
// start takes 30-60s. Ping /api/health until it answers so the console can
// say what's happening instead of just looking dead.
export type WakeState = "checking" | "waking" | "ready" | "unreachable";

const SLOW_THRESHOLD_MS = 2500;
const MAX_ATTEMPTS = 15;
const RETRY_DELAY_MS = 4000;

export function useBackendWakeUp(): WakeState {
  const [state, setState] = useState<WakeState>("checking");

  useEffect(() => {
    let cancelled = false;
    let slowTimer: ReturnType<typeof setTimeout> | undefined;

    async function attempt(attemptNumber: number): Promise<void> {
      slowTimer = setTimeout(() => {
        if (!cancelled) setState("waking");
      }, SLOW_THRESHOLD_MS);

      const ok = await pingHealth();
      clearTimeout(slowTimer);
      if (cancelled) return;

      if (ok) {
        setState("ready");
        return;
      }
      if (attemptNumber >= MAX_ATTEMPTS) {
        setState("unreachable");
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      if (!cancelled) await attempt(attemptNumber + 1);
    }

    void attempt(1);

    return () => {
      cancelled = true;
      if (slowTimer) clearTimeout(slowTimer);
    };
    // no ref guard on purpose: StrictMode double-mounts the effect in dev,
    // the cleanup above is what keeps the two loops from overlapping
  }, []);

  return state;
}
