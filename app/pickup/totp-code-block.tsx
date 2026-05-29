"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Copy, Check, ShieldCheck, RefreshCw } from "lucide-react";
import { getTotpCodeAction } from "./get-code-action";
import type { HandlerType } from "@/lib/db/products-types";

const HANDLER_LABELS: Record<HandlerType, string> = {
  "2fa_account": "رمز المصادقة الثنائية",
  steam_guard_account: "رمز Steam Guard",
  email_code_account: "رمز البريد الإلكتروني",
  normal_account: "",
  recharge_card: "",
  digital_file: "",
};

/**
 * Live TOTP code with circular countdown matching the spec/Salla Sync UX:
 *   - Customer clicks "احصل على الرمز"
 *   - 6-digit code appears with a circular ring counting down 30s
 *   - Code auto-refreshes when the ring hits 0
 *   - Each refresh hits the server (rate-limited + logged via OTP logs)
 *   - Customer NEVER sees the underlying TOTP secret
 */
export function TotpCodeBlock({
  orderId,
  lastFour,
  remaining,
  limit,
  handlerType,
}: {
  orderId: string;
  lastFour: string;
  remaining: number;
  limit: number;
  handlerType: HandlerType;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [requestsLeft, setRequestsLeft] = useState(remaining);
  const [isPending, startTransition] = useTransition();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown ticker — runs while we have a code
  useEffect(() => {
    if (!code) return;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [code]);

  // Auto-refresh when countdown hits zero (smooth UX, no manual click needed)
  useEffect(() => {
    if (code && secondsLeft === 0 && !isPending) {
      handleGetCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  function handleGetCode() {
    setError(null);
    startTransition(async () => {
      const res = await getTotpCodeAction({ orderId, lastFour });
      if ("error" in res) {
        setError(res.error);
        setCode(null);
        return;
      }
      setCode(res.code);
      setSecondsLeft(res.expiresInSeconds);
      setRequestsLeft(res.remaining);
    });
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── No code yet — show the "Get code" button ───────────────────────────
  if (!code) {
    return (
      <div className="rounded-2xl bg-surface-2 border border-[hsl(var(--hairline))] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-accent" />
          <span className="text-sm font-semibold text-fg">{HANDLER_LABELS[handlerType]}</span>
        </div>
        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        <p className="text-xs text-fg-muted leading-relaxed">
          اضغط على الزر أدناه للحصول على رمز التحقق. الرمز يتجدد تلقائياً كل 30 ثانية.
        </p>
        <button
          type="button"
          onClick={handleGetCode}
          disabled={isPending || requestsLeft <= 0}
          className="w-full h-11 rounded-xl bg-accent text-accent-fg text-sm font-bold hover:bg-accent-hi transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? "جاري التوليد..." : "احصل على رمز التحقق"}
        </button>
        <div className="text-center text-[11px] text-fg-faint">
          الطلبات المتبقية: <span className="font-num font-bold">{requestsLeft}</span> من <span className="font-num font-bold">{limit}</span>
        </div>
      </div>
    );
  }

  // ─── Code is showing — circular ring + 6-digit display ─────────────────
  const TOTAL = 30;
  const ringRadius = 36;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const progress = secondsLeft / TOTAL;

  return (
    <div className="rounded-2xl bg-surface-2 border border-[hsl(var(--hairline))] p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="size-4 text-accent" />
        <span className="text-sm font-semibold text-fg">{HANDLER_LABELS[handlerType]}</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Circular countdown */}
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
            <circle
              cx="44"
              cy="44"
              r={ringRadius}
              fill="none"
              stroke="hsl(var(--hairline-strong))"
              strokeWidth="6"
            />
            <circle
              cx="44"
              cy="44"
              r={ringRadius}
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringCircumference * (1 - progress)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-num font-bold text-xl text-fg" dir="ltr">
              {secondsLeft}
            </span>
          </div>
        </div>

        {/* The 6-digit code, big and clear */}
        <div className="flex-1 text-center min-w-0">
          <div className="text-[10px] font-semibold text-fg-muted uppercase tracking-widest mb-1">
            الرمز الحالي
          </div>
          <div
            className="font-num font-extrabold text-3xl sm:text-4xl tracking-[0.2em] text-fg select-all"
            dir="ltr"
          >
            {code}
          </div>
          <div className="text-[10px] text-fg-faint mt-1">
            سيتغير خلال {secondsLeft} ثانية
          </div>
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={copyCode}
          className={`shrink-0 size-12 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
            copied
              ? "bg-accent text-accent-fg border-accent"
              : "bg-surface border-[hsl(var(--hairline-strong))] text-fg-muted hover:text-fg hover:border-fg/30"
          }`}
          aria-label={copied ? "تم النسخ" : "نسخ الرمز"}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>

      {error && (
        <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
        <span className="text-fg-faint">
          الطلبات المتبقية:
          <span className="font-num font-bold mx-1 text-fg-muted">{requestsLeft}</span>/
          <span className="font-num font-bold text-fg-muted">{limit}</span>
        </span>
        <button
          type="button"
          onClick={handleGetCode}
          disabled={isPending}
          className="inline-flex items-center gap-1 text-fg-muted hover:text-accent transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`size-3 ${isPending ? "animate-spin" : ""}`} />
          تحديث الآن
        </button>
      </div>
    </div>
  );
}
