"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Copy, Check, ShieldCheck, RefreshCw } from "lucide-react";
import { getTotpCodeAction } from "./get-code-action";
import type { HandlerType } from "@/lib/db/products-types";

const HANDLER_LABELS: Record<HandlerType, string> = {
  "2fa_account": "رمز المصادقة الثنائية (2FA)",
  steam_guard_account: "رمز الحماية (Steam Guard)",
  email_code_account: "رمز التحقق من البريد الإلكتروني",
  normal_account: "",
  recharge_card: "",
  digital_file: "",
};

export function TotpCodeBlock({
  orderId,
  lastFour,
  remaining,
  limit,
  handlerType,
  lifetimeSeconds,
}: {
  orderId: string;
  lastFour: string;
  remaining: number;
  limit: number;
  handlerType: HandlerType;
  /** Hard cap for how long the live code stays auto-refreshing.
   *  After this many seconds since the first code was shown, the block
   *  freezes and asks the customer to tap "احصل على كود جديد" — encourages
   *  them to copy + leave instead of leaving a live code on screen. */
  lifetimeSeconds: number;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [requestsLeft, setRequestsLeft] = useState(remaining);
  const [isPending, startTransition] = useTransition();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Lifetime tracking — counts down from first reveal across all rotations.
  const [livedSeconds, setLivedSeconds] = useState(0);
  const expired = code !== null && livedSeconds >= lifetimeSeconds;

  // Countdown ticker (per rotation + total lifetime)
  useEffect(() => {
    if (!code) return;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
      setLivedSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [code]);

  // Auto-fetch code on mount
  useEffect(() => {
    handleGetCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh when countdown hits zero — but stop once we cross the cap.
  useEffect(() => {
    if (expired) return;
    if (code && secondsLeft === 0 && !isPending) {
      handleGetCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, expired]);

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
      // Reset lifetime timer on every fresh manual fetch (incl. after expiry).
      setLivedSeconds(0);
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
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline-strong))] p-5 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-2 pb-2.5 border-b border-[hsl(var(--hairline))]">
          <div className="size-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent-fg">
            <ShieldCheck className="size-5" />
          </div>
          <span className="text-sm font-extrabold text-fg">
            {HANDLER_LABELS[handlerType]}
          </span>
        </div>

        {error && (
          <div className="text-xs text-danger font-semibold bg-danger/10 border border-danger/20 px-3.5 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        <p className="text-xs text-fg-muted leading-relaxed font-medium">
          هذا الحساب محمي برمز تحقق ديناميكي. اضغط على الزر أدناه للحصول على الرمز. سيتجدد الرمز تلقائياً كل 30 ثانية لتسهيل تسجيل دخولك.
        </p>

        <button
          type="button"
          onClick={handleGetCode}
          disabled={isPending || requestsLeft <= 0}
          className="w-full h-11 rounded-xl bg-accent text-accent-fg text-sm font-extrabold hover:bg-accent-hi transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_4px_16px_rgba(212,245,66,0.2)] active:scale-[0.98]"
        >
          {isPending ? "جاري إنشاء الرمز الآمن..." : "احصل على رمز التفعيل المؤقت"}
        </button>

        <div className="text-center text-[10px] font-bold text-fg-faint uppercase tracking-wider">
          الطلبات المتاحة:{" "}
          <span className="font-num font-extrabold text-fg-muted">{requestsLeft}</span> من{" "}
          <span className="font-num font-extrabold text-fg-faint">{limit}</span>
        </div>
      </div>
    );
  }

  // ─── Code is showing — circular ring + 6-digit display ─────────────────
  const TOTAL = 30;
  const ringRadius = 34;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const progress = secondsLeft / TOTAL;
  // Lifetime: total seconds left in this active code window across rotations.
  const lifetimeLeft = Math.max(0, lifetimeSeconds - livedSeconds);
  const lifetimePct = Math.max(0, Math.min(100, (lifetimeLeft / lifetimeSeconds) * 100));

  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline-strong))] p-5 space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 pb-2.5 border-b border-[hsl(var(--hairline))]">
        <div className="size-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent-fg">
          <ShieldCheck className="size-5" />
        </div>
        <span className="text-sm font-extrabold text-fg">
          {HANDLER_LABELS[handlerType]}
        </span>
      </div>

      {expired ? (
        <div className="space-y-3 py-2">
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs text-amber-800 leading-relaxed font-semibold">
            انتهت مدة عرض الكود لحماية حسابك. اضغط على الزر أدناه للحصول على كود جديد.
          </div>
          <button
            type="button"
            onClick={handleGetCode}
            disabled={isPending || requestsLeft <= 0}
            className="w-full h-11 rounded-xl bg-accent text-accent-fg text-sm font-extrabold hover:bg-accent-hi transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_4px_16px_rgba(212,245,66,0.2)] active:scale-[0.98] inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
            احصل على كود جديد
          </button>
        </div>
      ) : (
      <div className="flex items-center justify-between gap-4 py-2">
        {/* Circular countdown with glowing stroke */}
        <div className="relative shrink-0 select-none">
          <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
            <circle
              cx="42"
              cy="42"
              r={ringRadius}
              fill="none"
              stroke="hsl(var(--hairline-strong))"
              strokeWidth="5"
            />
            <circle
              cx="42"
              cy="42"
              r={ringRadius}
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringCircumference * (1 - progress)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
              className="drop-shadow-[0_0_4px_rgba(212,245,66,0.4)]"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-num font-extrabold text-lg text-fg" dir="ltr">
              {secondsLeft}
            </span>
          </div>
        </div>

        {/* The 6-digit code, big and clear */}
        <div className="flex-1 text-center min-w-0">
          <div className="text-[10px] font-bold text-fg-faint uppercase tracking-wider mb-1">
            رمز التحقق الحالي
          </div>
          <div
            className="font-num font-extrabold text-3xl sm:text-4xl tracking-[0.15em] text-fg select-all leading-none py-1"
            dir="ltr"
          >
            {code}
          </div>
          <div className="text-[10px] font-semibold text-accent-fg/80 mt-1 flex items-center justify-center gap-1">
            <span className="size-1.5 rounded-full bg-accent animate-ping" />
            يتجدد تلقائياً عند انتهاء الوقت
          </div>
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={copyCode}
          className={`shrink-0 size-12 rounded-xl border transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shadow-sm ${
            copied
              ? "bg-accent text-accent-fg border-accent shadow-[0_4px_12px_rgba(212,245,66,0.3)]"
              : "bg-surface text-fg-muted border-[hsl(var(--hairline-strong))] hover:text-fg hover:bg-surface-2"
          }`}
          aria-label={copied ? "تم النسخ" : "نسخ الرمز"}
        >
          {copied ? (
            <Check className="size-4 stroke-[3]" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
      </div>
      )}

      {/* Lifetime indicator — shown only while the code is live, not expired. */}
      {!expired && (
        <div className="space-y-1.5 select-none">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase">
            <span className="text-fg-faint">مدة عرض الكود المتبقية</span>
            <span className="font-num font-extrabold text-fg-muted" dir="ltr">
              {Math.floor(lifetimeLeft / 60)}:{String(lifetimeLeft % 60).padStart(2, "0")}
            </span>
          </div>
          <div className="h-1 rounded-full bg-surface-2 overflow-hidden border border-[hsl(var(--hairline))]">
            <div
              className={`h-full transition-all duration-1000 ${lifetimeLeft <= 30 ? "bg-amber-500" : "bg-accent/70"}`}
              style={{ width: `${lifetimePct}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-danger font-semibold bg-danger/10 border border-danger/20 px-3.5 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      {/* Manual refresh / request status */}
      <div className="pt-3 border-t border-[hsl(var(--hairline))] flex items-center justify-between gap-3 text-[11px] font-bold">
        <span className="text-fg-faint">
          الطلبات المتبقية:{" "}
          <span className="font-num font-extrabold text-fg-muted">{requestsLeft}</span>/
          <span className="font-num font-extrabold text-fg-muted">{limit}</span>
        </span>
        <button
          type="button"
          onClick={handleGetCode}
          disabled={isPending}
          className="inline-flex items-center gap-1 text-fg-muted hover:text-accent transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
          تحديث الكود الآن
        </button>
      </div>
    </div>
  );
}
