"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Wakeful client-side idle detector for the customer pickup page.
 *
 * Why: credentials and 2FA codes are sensitive. Leaving them on a
 * wide-open browser tab on a public computer is a real risk. We auto-lock
 * the view after a configurable period of zero user input.
 *
 * Listens for: mousemove, mousedown, keydown, touchstart, scroll, click.
 * Each event resets an internal countdown. Exposes:
 *   - `secondsLeft` — current countdown for UI feedback.
 *   - `idle`        — true when we hit zero. Caller swaps the view.
 *   - `reset()`     — manual extender (used after a copy click etc.).
 *
 * NOTE: This is a defense-in-depth signal, not a hard security boundary.
 * Server-side checks still re-verify identity on every TOTP fetch.
 */
export function useIdleTimeout(args: {
  enabled: boolean;
  /** Total idle window, in seconds. */
  timeoutSeconds: number;
}): {
  secondsLeft: number;
  idle: boolean;
  reset: () => void;
} {
  const { enabled, timeoutSeconds } = args;
  const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);
  const [idle, setIdle] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    lastActivityRef.current = Date.now();
    setSecondsLeft(timeoutSeconds);
    setIdle(false);
  }, [timeoutSeconds]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const onActivity = () => {
      // Don't reset once we hit the idle state — caller decides re-entry.
      if (idle) return;
      lastActivityRef.current = Date.now();
      // NOTE: Don't call setSecondsLeft here — the interval tick (line 64)
      // is the single source of truth. Calling it here caused a visible
      // jitter: timer shows 4:58 → onActivity resets to 5:00 → next tick
      // computes 4:59 from the ref. Let the interval handle all display updates.
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
      "wheel",
    ];
    for (const e of events) window.addEventListener(e, onActivity, { passive: true });

    tickerRef.current = setInterval(() => {
      const elapsed = (Date.now() - lastActivityRef.current) / 1000;
      const remaining = Math.max(0, Math.ceil(timeoutSeconds - elapsed));
      setSecondsLeft(remaining);
      if (remaining === 0) setIdle(true);
    }, 1000);

    return () => {
      for (const e of events) window.removeEventListener(e, onActivity);
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [enabled, timeoutSeconds, idle]);

  return { secondsLeft, idle, reset };
}
