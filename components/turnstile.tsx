"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile widget (client).
 *
 * Lazily injects the Turnstile script once, renders an invisible-managed
 * widget into a div, and surfaces the solved token via `onVerify`. On expiry
 * or error it clears the token via `onExpire` so the parent can re-disable
 * its submit button.
 *
 * Exposes an imperative `reset()` through a ref-like callback (`onReady`) so
 * the parent can reset the challenge after a failed submit (one token = one
 * use). Honors the site theme by reading the documentElement, and is a no-op
 * when no site key is configured.
 */

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      "timeout-callback"?: () => void;
      theme?: "auto" | "light" | "dark";
      language?: string;
      appearance?: "always" | "execute" | "interaction-only";
    },
  ) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __turnstileLoading?: boolean;
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if (window.turnstile) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      // Already loaded but turnstile attached late — poll briefly.
      if (window.turnstile) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener("load", () => resolve(), { once: true });
    document.head.appendChild(s);
  });
}

export function Turnstile({
  siteKey,
  onVerify,
  onExpire,
  onReady,
  className,
}: {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  /** Receives a `reset` function the parent can call after a failed submit. */
  onReady?: (controls: { reset: () => void }) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!siteKey) return;

    loadScript().then(() => {
      if (cancelled || !ref.current || !window.turnstile) return;
      // Avoid double-render in React strict mode.
      if (widgetId.current) return;

      const theme =
        document.documentElement.classList.contains("dark") ? "dark" : "light";

      try {
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          theme,
          language: "ar",
          appearance: "always",
          callback: (token) => {
            setFailed(false);
            onVerify(token);
          },
          "expired-callback": () => onExpire?.(),
          "error-callback": () => {
            setFailed(true);
            onExpire?.();
          },
          "timeout-callback": () => onExpire?.(),
        });

        onReady?.({
          reset: () => {
            if (window.turnstile && widgetId.current) {
              window.turnstile.reset(widgetId.current);
              onExpire?.();
            }
          },
        });
      } catch {
        setFailed(true);
      }
    });

    return () => {
      cancelled = true;
      if (window.turnstile && widgetId.current) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* ignore */
        }
        widgetId.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <div className={className}>
      <div ref={ref} className="flex justify-center" />
      {failed && (
        <p className="text-[11px] text-danger text-center mt-2">
          تعذّر تحميل التحقق الأمني. حدّث الصفحة وحاول مجدداً.
        </p>
      )}
    </div>
  );
}
