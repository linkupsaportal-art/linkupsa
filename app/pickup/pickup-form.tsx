"use client";

import { useState, useTransition } from "react";
import { lookupOrderAction } from "./actions";
import { OrderDetails } from "./order-details";
import type { PickupResult } from "./types";
import type { PickupSessionSettings } from "@/lib/db/platform-settings";
import { Turnstile } from "@/components/turnstile";
import { Hash, Phone, AlertCircle, ArrowRight, Send } from "lucide-react";

export function PickupForm({
  sessionConfig,
  telegram,
  turnstileSiteKey,
}: {
  sessionConfig: PickupSessionSettings;
  /** Set only when the merchant's Telegram pickup bot is live + enabled. */
  telegram: { username: string } | null;
  /** Cloudflare Turnstile public site key. Empty → captcha disabled. */
  turnstileSiteKey: string;
}) {
  const [orderNumber, setOrderNumber] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PickupResult | null>(null);
  const [isPending, startTransition] = useTransition();

  // Captcha state. When no site key is configured the gate is satisfied
  // immediately so local dev / unconfigured envs still work.
  const captchaRequired = Boolean(turnstileSiteKey);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [resetCaptcha, setResetCaptcha] = useState<(() => void) | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!orderNumber.trim()) {
      setError("رقم الطلب مطلوب للاستمرار");
      return;
    }
    if (!/^\d{4}$/.test(lastFour)) {
      setError("يرجى إدخال آخر 4 أرقام من جوالك بشكل صحيح");
      return;
    }
    if (captchaRequired && !captchaToken) {
      setError("يرجى إكمال التحقق الأمني أولاً");
      return;
    }

    startTransition(async () => {
      const res = await lookupOrderAction(orderNumber.trim(), lastFour, captchaToken);
      if ("error" in res) {
        setError(res.error);
        // One token = one use — reset so the customer can retry.
        resetCaptcha?.();
        setCaptchaToken(null);
      } else {
        setResult(res);
      }
    });
  }

  if (result) {
    return (
      <OrderDetails
        result={result}
        sessionConfig={sessionConfig}
        onReset={() => {
          setResult(null);
          setOrderNumber("");
          setLastFour("");
        }}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/85 backdrop-blur-xl border border-white/60 p-6 sm:p-8 space-y-6 rounded-3xl card-lift animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {error && (
        <div className="rounded-xl bg-danger/10 border border-danger/25 px-4 py-3 text-sm text-danger font-semibold flex items-center gap-2.5 animate-in shake duration-300">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Order Number Input */}
      <div className="space-y-2">
        <label
          htmlFor="order-number"
          className="block text-xs font-bold text-fg-muted uppercase tracking-wider"
        >
          رقم الطلب
        </label>
        <div className="group relative flex items-center h-12 border bg-surface px-4 transition-all duration-200 rounded-xl border-[hsl(var(--hairline-strong))] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
          <span className="text-fg-faint group-focus-within:text-fg transition-colors me-3 shrink-0">
            <Hash className="size-4" />
          </span>
          <input
            id="order-number"
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="مثال: 263047555"
            className="flex-1 bg-transparent text-fg placeholder:text-fg-faint outline-none h-full min-w-0 font-semibold tabular-nums text-sm text-start"
            autoComplete="off"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Last 4 Phone Digits Input */}
      <div className="space-y-2">
        <label
          htmlFor="last-four"
          className="block text-xs font-bold text-fg-muted uppercase tracking-wider"
        >
          آخر 4 أرقام من الجوال المسجل
        </label>
        <div className="group relative flex items-center h-12 border bg-surface px-4 transition-all duration-200 rounded-xl border-[hsl(var(--hairline-strong))] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
          <span className="text-fg-faint group-focus-within:text-fg transition-colors me-3 shrink-0">
            <Phone className="size-4" />
          </span>
          <input
            id="last-four"
            type="text"
            inputMode="numeric"
            dir="ltr"
            maxLength={4}
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))}
            placeholder="0000"
            className="flex-1 bg-transparent text-fg placeholder:text-fg-faint outline-none h-full min-w-0 font-bold tabular-nums text-sm tracking-[0.4em] text-center"
            autoComplete="off"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Cloudflare Turnstile — invisible/managed; appears only on suspicion */}
      {captchaRequired && (
        <Turnstile
          siteKey={turnstileSiteKey}
          onVerify={(token) => setCaptchaToken(token)}
          onExpire={() => setCaptchaToken(null)}
          onReady={(c) => setResetCaptcha(() => c.reset)}
        />
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="group relative w-full h-12 rounded-xl bg-accent text-accent-fg text-sm font-extrabold hover:bg-accent-hi transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_32px_rgba(212,245,66,0.35)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>{isPending ? "جاري التحقق من الطلب..." : "استلام بيانات طلبك"}</span>
        {!isPending && (
          <ArrowRight className="size-4 rotate-180 transition-transform group-hover:-translate-x-1" />
        )}
      </button>

      {/* Telegram alternative — only when the merchant's bot is fully wired */}
      {telegram && (
        <div className="pt-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-[hsl(var(--hairline))]" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-fg-faint">
              أو استلم عبر
            </span>
            <div className="flex-1 h-px bg-[hsl(var(--hairline))]" />
          </div>
          <a
            href={`https://t.me/${telegram.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-[#26A5E4] text-white text-sm font-bold hover:bg-[#1f8fc8] transition-colors shadow-[0_6px_20px_rgba(38,165,228,0.35)] active:scale-[0.98]"
          >
            <Send className="size-4" />
            <span>متابعة الاستلام على تيليجرام</span>
          </a>
          <p className="text-[11px] text-fg-faint text-center mt-2 leading-relaxed">
            افتح بوت <code className="font-mono text-fg-muted">@{telegram.username}</code> واكمل خطوتين فقط داخل المحادثة.
          </p>
        </div>
      )}

      {/* Help footer */}
      <div className="pt-2 border-t border-[hsl(var(--hairline))] text-center">
        <p className="text-[11px] text-fg-faint leading-relaxed">
          عند مواجهة أي مشكلة في استلام حسابك أو التفعيل، لا تتردد في{" "}
          <a
            href="https://wa.me/966555000000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 font-bold underline transition-colors"
          >
            التواصل مع خدمة العملاء
          </a>
        </p>
      </div>
    </form>
  );
}
