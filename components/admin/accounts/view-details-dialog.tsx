"use client";

import { useState, useEffect } from "react";
import { Database, Mail, Lock, Key, Gamepad2, CreditCard, RefreshCw, FileText, Check, Copy, Eye, EyeOff } from "lucide-react";
import type { Account } from "@/lib/db/accounts";
import { HANDLER_LABELS } from "@/lib/db/products-types";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function ViewDetailsDialog({
  account,
  loadingSecrets,
  viewSecrets,
  onRefresh,
  onClose,
}: {
  account: Account;
  loadingSecrets: boolean;
  viewSecrets: {
    password?: string | null;
    totpSecret?: string | null;
    steamSharedSecret?: string | null;
    cardCode?: string | null;
    active2faCode?: string | null;
    active2faExpiresIn?: number | null;
  } | null;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (viewSecrets?.active2faExpiresIn) {
      setTimeLeft(viewSecrets.active2faExpiresIn);
    }
  }, [viewSecrets]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
      <DialogHeader>
        <div className="flex items-center gap-3 mb-2 text-right">
          <div className="size-10 rounded-full bg-accent/20 flex items-center justify-center text-accent-fg">
            <Database className="size-5" />
          </div>
          <div>
            <DialogTitle className="text-right">تفاصيل الحساب الكاملة</DialogTitle>
            <DialogDescription className="text-right text-xs">
              بيانات الحساب والمخزون الحالية المسترجعة بأمان من قاعدة البيانات.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4 my-4 text-right">
        {/* Account basic info */}
        <div className="grid grid-cols-2 gap-3 bg-[hsl(200_14%_97%)] p-4 rounded-2xl border border-[hsl(220_18%_14%/0.08)]">
          <div>
            <div className="text-[10px] font-bold text-fg-faint uppercase">اسم الحساب (Label)</div>
            <div className="text-sm font-extrabold text-fg">{account.label}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-fg-faint uppercase">نوع التسليم</div>
            <div className="text-sm font-extrabold text-fg">{HANDLER_LABELS[account.handler_type]}</div>
          </div>
          <div className="col-span-2 pt-2 border-t border-[hsl(var(--hairline-strong))] flex items-center justify-between text-xs">
            <span className="text-fg-muted font-bold">معدل الاستخدام الفعلي:</span>
            <span className="font-num font-extrabold text-fg">{account.current_usage} / {account.max_usage}</span>
          </div>
        </div>

        {/* Decrypted credentials */}
        <div className="space-y-3">
          {account.email && (
            <CredentialField label="البريد الإلكتروني / اسم الدخول" value={account.email} icon={<Mail className="size-4" />} />
          )}

          {loadingSecrets ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 bg-[hsl(200_14%_97%)] rounded-2xl border border-[hsl(220_18%_14%/0.08)]">
              <RefreshCw className="size-6 text-accent animate-spin" />
              <span className="text-xs font-bold text-fg-muted">جاري فك تشفير البيانات الحساسة بأمان...</span>
            </div>
          ) : viewSecrets ? (
            <>
              {viewSecrets.password && (
                <CredentialField label="كلمة المرور" value={viewSecrets.password} icon={<Lock className="size-4" />} isPassword />
              )}

              {/* Dynamic 2FA Code Block */}
              {viewSecrets.active2faCode && (
                <div className="bg-accent/15 border border-accent/25 p-4 rounded-2xl flex flex-col items-center gap-2 text-center my-3 relative overflow-hidden">
                  <div className="text-[10px] font-bold text-accent uppercase tracking-wider">
                    رمز التحقق الثنائي النشط (2FA Code)
                  </div>
                  <div className="font-mono text-3xl font-extrabold text-accent flex items-center gap-3 select-all">
                    {viewSecrets.active2faCode}
                    <CopyButton value={viewSecrets.active2faCode} />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-fg-muted mt-1 select-none">
                    {timeLeft > 0 ? (
                      <span>يتجدد الكود خلال {timeLeft} ثانية</span>
                    ) : (
                      <span className="text-yellow-500 font-semibold">انتهت صلاحية الكود الحالي</span>
                    )}
                    <button
                      type="button"
                      onClick={onRefresh}
                      className="inline-flex items-center gap-1 hover:text-accent font-bold cursor-pointer transition-colors"
                    >
                      <RefreshCw className="size-3" />
                      تحديث الآن
                    </button>
                  </div>
                </div>
              )}

              {viewSecrets.totpSecret && (
                <CredentialField label="TOTP Secret (2FA Seed)" value={viewSecrets.totpSecret} icon={<Key className="size-4" />} />
              )}
              {viewSecrets.steamSharedSecret && (
                <CredentialField label="Steam Shared Secret" value={viewSecrets.steamSharedSecret} icon={<Gamepad2 className="size-4" />} />
              )}
              {viewSecrets.cardCode && (
                <CredentialField label="كود البطاقة الرقمية" value={viewSecrets.cardCode} icon={<CreditCard className="size-4" />} />
              )}
            </>
          ) : (
            <div className="text-xs text-danger font-semibold bg-danger/10 border border-danger/20 p-3.5 rounded-xl">
              حدث خطأ أثناء محاولة استرجاع البيانات الحساسة.
            </div>
          )}
        </div>

        {/* Instructions */}
        {account.instructions && (
          <div className="bg-[hsl(200_14%_97%)] p-4 rounded-2xl border border-[hsl(220_18%_14%/0.08)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-fg-faint uppercase">
              <FileText className="size-4" />
              تعليمات الاستخدام للعميل
            </div>
            <div className="text-xs font-semibold text-fg leading-relaxed whitespace-pre-wrap">{account.instructions}</div>
          </div>
        )}
      </div>

      <DialogFooter>
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-5 rounded-xl bg-[hsl(222_30%_6%)] text-[hsl(72_86%_62%)] text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer w-full text-center"
        >
          إغلاق نافذة البيانات
        </button>
      </DialogFooter>
    </DialogContent>
  );
}

function CredentialField({
  label,
  value,
  icon,
  isPassword,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  isPassword?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(!isPassword);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-fg-faint uppercase">
        {icon}
        {label}
      </div>
      <div className="flex items-stretch gap-2" dir="ltr">
        <div className="flex-1 h-10 px-3 bg-[hsl(200_14%_97%)] border border-[hsl(220_18%_14%/0.08)] rounded-xl flex items-center text-xs font-mono font-bold text-fg select-all break-all">
          {showPassword ? value : "••••••••••••••••"}
        </div>
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="shrink-0 size-10 rounded-xl border border-[hsl(220_18%_14%/0.08)] bg-white text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}

        <CopyButton value={value} />
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`shrink-0 size-10 rounded-xl border transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95 shadow-sm ${
        copied
          ? "bg-accent text-accent-fg border-accent shadow-[0_4px_12px_rgba(212,245,66,0.25)]"
          : "bg-white text-fg-muted border-[hsl(220_18%_14%/0.08)] hover:text-fg hover:bg-surface-2"
      }`}
    >
      {copied ? <Check className="size-4 stroke-[3]" /> : <Copy className="size-4" />}
    </button>
  );
}
