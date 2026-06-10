"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  ArrowLeft,
  Mail,
  Lock,
  FileText,
  CreditCard,
  Download,
  Shield,
  ShoppingBag,
} from "lucide-react";
import type { PickupResult } from "./types";
import type { PickupSessionSettings } from "@/lib/db/platform-settings";
import { RichDescription, YoutubeEmbed, extractYoutubeId } from "@/components/ui/rich-description";
import { TotpCodeBlock } from "./totp-code-block";
import { useIdleTimeout } from "./use-idle-timeout";
import { IdleLockOverlay } from "./idle-lock-overlay";
import { SessionTimer } from "./session-timer";

export function OrderDetails({
  result,
  sessionConfig,
  onReset,
}: {
  result: PickupResult;
  sessionConfig: PickupSessionSettings;
  onReset: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ─── Idle session lock ───────────────────────────────────────────────
  // Auto-blurs the credentials after `idle_timeout_seconds` of zero input.
  // The customer can either resume in-place (extends the timer) or fully
  // reset to the order-number form.
  const { secondsLeft, idle, reset: resumeIdle } = useIdleTimeout({
    enabled: true,
    timeoutSeconds: sessionConfig.idle_timeout_seconds,
  });

  function copy(field: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const isCard = result.handlerType === "recharge_card";
  const isFile = result.handlerType === "digital_file";
  const isAccount = [
    "normal_account",
    "2fa_account",
    "steam_guard_account",
    "email_code_account",
  ].includes(result.handlerType);
  const supportsCode = [
    "2fa_account",
    "steam_guard_account",
    "email_code_account",
  ].includes(result.handlerType);

  const usagePercent = Math.min(
    100,
    Math.max(
      0,
      ((result.otpRequestCount ?? 0) / Math.max(1, result.otpRequestLimit ?? 1)) *
        100,
    ),
  );

  return (
    <div className="bg-white/85 backdrop-blur-xl border border-white/60 p-6 sm:p-8 space-y-6 rounded-3xl card-lift animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Live session countdown — visible to the customer at all times */}
      <SessionTimer
        secondsLeft={secondsLeft}
        totalSeconds={sessionConfig.idle_timeout_seconds}
      />

      {/* Card body. Blurred while idle to hide the credentials. */}
      <div className={`space-y-6 transition-all duration-300 ${idle ? "blur-sm pointer-events-none select-none" : ""}`}>
      {/* Top Header: Order Ref + Product + Paid Badge */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-[hsl(var(--hairline-strong))]">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-fg-faint uppercase tracking-wider">
            <ShoppingBag className="size-3.5" />
            رقم الطلب
          </div>
          <div className="font-num font-extrabold text-fg text-2xl" dir="ltr">
            #{result.orderNumber}
          </div>
          <div className="text-base font-extrabold text-fg truncate pt-1">
            {result.productName}
          </div>
          {result.optionName && (
            <div className="inline-flex px-2 py-0.5 rounded-md bg-surface-2 text-xs font-bold text-fg-muted border border-[hsl(var(--hairline))]">
              {result.optionName}
            </div>
          )}
        </div>
        <div className="inline-flex items-center gap-1 h-7 px-3.5 rounded-full bg-accent text-accent-fg text-xs font-extrabold border border-accent/20 shrink-0 shadow-[0_4px_12px_rgba(212,245,66,0.25)] select-none">
          <Check className="size-3.5 stroke-[3]" />
          مدفوع ومكتمل
        </div>
      </div>

      {/* Account Credentials */}
      {isAccount && (
        <div className="space-y-4">
          {result.email && (
            <CredField
              label="اسم المستخدم / البريد الإلكتروني"
              value={result.email}
              icon={<Mail className="size-4" />}
              copied={copiedField === "email"}
              onCopy={() => copy("email", result.email!)}
            />
          )}
          {result.password && (
            <CredField
              label="كلمة المرور"
              value={result.password}
              icon={<Lock className="size-4" />}
              copied={copiedField === "password"}
              onCopy={() => copy("password", result.password!)}
              monospace
            />
          )}
        </div>
      )}

      {/* Recharge Card */}
      {isCard && result.cardCode && (
        <CredField
          label="كود البطاقة الرقمية"
          value={result.cardCode}
          icon={<CreditCard className="size-4" />}
          copied={copiedField === "card"}
          onCopy={() => copy("card", result.cardCode!)}
          monospace
        />
      )}

      {/* Digital File Download */}
      {isFile && result.fileUrl && (
        <a
          href={result.fileUrl}
          download
          className="flex items-center justify-center gap-2 h-12 rounded-xl bg-accent text-accent-fg text-sm font-extrabold hover:bg-accent-hi transition-all duration-200 cursor-pointer shadow-[0_8px_32px_rgba(212,245,66,0.35)] active:scale-[0.98]"
        >
          <Download className="size-4 stroke-[2.5]" />
          تحميل الملف المرفق
        </a>
      )}

      {/* TOTP Block */}
      {supportsCode && (
        <TotpCodeBlock
          orderId={result.orderId}
          lastFour={result.lastFour}
          remaining={result.otpRequestLimit - result.otpRequestCount}
          limit={result.otpRequestLimit}
          handlerType={result.handlerType}
          lifetimeSeconds={sessionConfig.totp_max_seconds}
        />
      )}

      {/* Usage Indicator */}
      {isAccount && (
        <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline-strong))] p-4">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-fg-muted">معدل استهلاك الرموز المؤقتة</span>
            <span className="font-num font-extrabold text-fg text-sm" dir="ltr">
              {result.otpRequestCount} / {result.otpRequestLimit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden border border-[hsl(var(--hairline))]">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500 shadow-[0_0_12px_rgba(212,245,66,0.4)]"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Instructions */}
      {result.instructions && (
        <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline-strong))] p-5 text-sm text-fg leading-relaxed">
          <div className="flex items-center gap-2 text-xs font-bold text-fg-muted uppercase tracking-wider mb-3">
            <FileText className="size-4 text-accent-fg/80" />
            تعليمات واستخدام الحساب
          </div>
          <div className="whitespace-pre-wrap font-medium">{result.instructions}</div>
        </div>
      )}

      {/* Product explanation — text with YouTube videos embedded inline */}
      {(result.productDescription || result.productYoutubeUrl) && (
        <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline-strong))] p-5 text-sm text-fg leading-relaxed space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-fg-muted uppercase tracking-wider">
            <FileText className="size-4 text-accent-fg/80" />
            شرح المنتج
          </div>
          {result.productDescription && (
            <RichDescription text={result.productDescription} className="font-medium" />
          )}
          {result.productYoutubeUrl && extractYoutubeId(result.productYoutubeUrl) && (
            <YoutubeEmbed videoId={extractYoutubeId(result.productYoutubeUrl)!} />
          )}
        </div>
      )}

      {/* Footer warning details */}
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-800 leading-relaxed flex gap-3 shadow-sm select-none">
        <Shield className="size-5 shrink-0 text-amber-600 mt-0.5" />
        <span className="font-semibold">
          ملاحظة هامة: يرجى كتابة/نسخ بيانات الدخول أعلاه بدقة. للحصول على الدعم الفني، يرجى التواصل فوراً مع المتجر عبر الواتساب.
        </span>
      </div>

      {/* Reset Back Button */}
      <button
        type="button"
        onClick={onReset}
        className="w-full h-11 rounded-xl text-fg-muted hover:text-fg hover:bg-surface border border-transparent hover:border-[hsl(var(--hairline-strong))] text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
      >
        <ArrowLeft className="size-4 rotate-180 transition-transform group-hover:translate-x-1" />
        رجوع للرئيسية
      </button>
      </div>

      {/* Idle lock overlay — appears once the timer expires */}
      {idle && (
        <IdleLockOverlay
          totalSeconds={sessionConfig.idle_timeout_seconds}
          onResume={resumeIdle}
          onReset={onReset}
        />
      )}
    </div>
  );
}

function CredField({
  label,
  value,
  icon,
  copied,
  onCopy,
  monospace,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  copied: boolean;
  onCopy: () => void;
  monospace?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-fg-muted uppercase tracking-wider">
        <span className="text-fg-faint shrink-0">{icon}</span>
        {label}
      </div>
      <div className="flex items-stretch gap-2.5">
        <div
          className={`flex-1 h-12 px-4 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] flex items-center text-sm font-bold text-fg select-all break-all transition-colors focus-within:border-accent ${
            monospace ? "font-mono" : ""
          }`}
          dir="ltr"
        >
          {value}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className={`shrink-0 size-12 rounded-xl border transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shadow-sm ${
            copied
              ? "bg-accent text-accent-fg border-accent shadow-[0_4px_12px_rgba(212,245,66,0.3)]"
              : "bg-surface text-fg-muted border-[hsl(var(--hairline-strong))] hover:text-fg hover:bg-surface-2"
          }`}
          aria-label={copied ? "تم النسخ" : `نسخ ${label}`}
        >
          {copied ? (
            <Check className="size-4 stroke-[3]" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
