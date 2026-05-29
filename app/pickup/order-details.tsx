"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Copy, Check, ArrowLeft, Mail, Lock, FileText, CreditCard, Download, Shield,
} from "lucide-react";
import type { PickupResult } from "./types";
import { TotpCodeBlock } from "./totp-code-block";

export function OrderDetails({ result, onReset }: { result: PickupResult; onReset: () => void }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copy(field: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const isCard = result.handlerType === "recharge_card";
  const isFile = result.handlerType === "digital_file";
  const isAccount = ["normal_account", "2fa_account", "steam_guard_account", "email_code_account"].includes(result.handlerType);
  const supportsCode = ["2fa_account", "steam_guard_account", "email_code_account"].includes(result.handlerType);

  const usagePercent = Math.min(100, Math.max(0, ((result.otpRequestCount ?? 0) / Math.max(1, result.otpRequestLimit ?? 1)) * 100));

  return (
    <div className="rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] p-6 space-y-5 shadow-card">
      {/* Top header: order ref + product + paid chip */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-[hsl(var(--hairline))]">
        <div className="min-w-0">
          <div className="text-xs text-fg-muted">رقم الطلب</div>
          <div className="font-num font-bold text-fg text-lg" dir="ltr">#{result.orderNumber}</div>
          <div className="mt-1 text-sm font-semibold text-fg truncate">{result.productName}</div>
          {result.optionName && (
            <div className="text-xs text-fg-muted">{result.optionName}</div>
          )}
        </div>
        <div className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-accent/15 text-accent text-xs font-bold shrink-0">
          <Check className="size-3.5" />
          مدفوع
        </div>
      </div>

      {/* Account credentials */}
      {isAccount && (
        <div className="space-y-3">
          {result.email && (
            <CredField
              label="البريد الإلكتروني"
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

      {/* Recharge card */}
      {isCard && result.cardCode && (
        <CredField
          label="كود البطاقة"
          value={result.cardCode}
          icon={<CreditCard className="size-4" />}
          copied={copiedField === "card"}
          onCopy={() => copy("card", result.cardCode!)}
          monospace
        />
      )}

      {/* Digital file */}
      {isFile && result.fileUrl && (
        <a
          href={result.fileUrl}
          download
          className="flex items-center justify-center gap-2 h-12 rounded-xl bg-accent text-accent-fg text-sm font-bold hover:bg-accent-hi transition-colors cursor-pointer"
        >
          <Download className="size-4" />
          تحميل الملف
        </a>
      )}

      {/* TOTP block — only for handlers that support codes */}
      {supportsCode && (
        <TotpCodeBlock
          orderId={result.orderId}
          lastFour={result.lastFour}
          remaining={result.otpRequestLimit - result.otpRequestCount}
          limit={result.otpRequestLimit}
          handlerType={result.handlerType}
        />
      )}

      {/* Usage indicator */}
      {isAccount && (
        <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-fg-muted">الاستخدام</span>
            <span className="font-num font-bold text-fg" dir="ltr">
              {result.otpRequestCount} / {result.otpRequestLimit}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Instructions */}
      {result.instructions && (
        <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-4 text-sm text-fg leading-relaxed">
          <div className="flex items-center gap-2 text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">
            <FileText className="size-3.5" />
            تعليمات الاستخدام
          </div>
          <div className="whitespace-pre-wrap">{result.instructions}</div>
        </div>
      )}

      {/* Footer note */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-100/90 leading-relaxed flex gap-2">
        <Shield className="size-4 shrink-0 mt-0.5 text-amber-300" />
        <span>
          ملاحظة هامة: يرجى استخدام بيانات الدخول أعلاه لتسجيل الدخول إلى حسابك. للحصول على أي مساعدة تواصل معنا عبر واتساب.
        </span>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="w-full h-10 rounded-xl text-fg-muted hover:text-fg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <ArrowLeft className="size-4 rotate-180" />
        رجوع
      </button>
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
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-fg-muted uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="flex items-stretch gap-2">
        <div
          className={`flex-1 h-12 px-4 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] flex items-center text-sm text-fg select-all break-all ${
            monospace ? "font-mono" : ""
          }`}
          dir="ltr"
        >
          {value}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className={`shrink-0 size-12 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
            copied
              ? "bg-accent text-accent-fg border-accent"
              : "bg-surface-2 text-fg-muted border-[hsl(var(--hairline-strong))] hover:text-fg hover:border-fg/30"
          }`}
          aria-label={copied ? "تم النسخ" : `نسخ ${label}`}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}
