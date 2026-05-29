"use client";

import { useState } from "react";
import { Copy, Check, ArrowLeft, Mail, Lock, FileText, CreditCard, Download } from "lucide-react";
import type { PickupResult } from "./types";

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

  return (
    <div className="rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] p-6 space-y-4 shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-[hsl(var(--hairline))]">
        <div className="min-w-0">
          <div className="text-xs text-fg-muted">طلب رقم</div>
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
        <>
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
        </>
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
          className="flex items-center justify-center gap-2 h-12 rounded-xl bg-accent text-accent-fg text-sm font-bold hover:bg-accent/90 transition-colors"
        >
          <Download className="size-4" />
          تحميل الملف
        </a>
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

      {/* OTP button — only for handlers that support it (later sprints) */}
      {(result.handlerType === "2fa_account" ||
        result.handlerType === "steam_guard_account" ||
        result.handlerType === "email_code_account") && (
        <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-4">
          <div className="text-xs text-fg-muted mb-2">
            طلبات الكود المتبقية:
            <span className="font-num font-bold text-fg mx-1">
              {result.otpRequestLimit - result.otpRequestCount}
            </span>
            من
            <span className="font-num font-bold text-fg mx-1">{result.otpRequestLimit}</span>
          </div>
          <button
            disabled
            className="w-full h-10 rounded-xl bg-fg text-bg text-sm font-semibold opacity-50 cursor-not-allowed"
            title="قريباً"
          >
            الحصول على كود التحقق
          </button>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={onReset}
        className="w-full h-10 rounded-xl text-fg-muted hover:text-fg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
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
          onClick={onCopy}
          className={`shrink-0 size-12 rounded-xl border transition-all flex items-center justify-center ${
            copied
              ? "bg-accent text-accent-fg border-accent"
              : "bg-surface-2 text-fg-muted border-[hsl(var(--hairline-strong))] hover:text-fg hover:border-fg/30"
          }`}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}
