"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, KeyRound, AlertCircle, ArrowLeft, LogOut } from "lucide-react";
import { OtpInput } from "@/components/auth/otp-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  verifyLoginMfaAction,
  verifyLoginBackupCodeAction,
  signOutAction,
} from "@/app/(auth)/actions";

type Mode = "totp" | "backup";

/**
 * Two-mode MFA challenge:
 *   - TOTP   → 6-digit code from Google Authenticator
 *   - Backup → XXXXX-XXXXX recovery code (single use, wipes all factors)
 */
export function MfaChallengeForm({
  factorId,
  next,
  maskedEmail,
}: {
  factorId: string;
  next: string;
  maskedEmail: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("totp");
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submitTotp(submitted: string) {
    setError(null);
    startTransition(async () => {
      const res = await verifyLoginMfaAction({ factorId, code: submitted });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace(next);
      router.refresh();
    });
  }

  function submitBackup() {
    setError(null);
    startTransition(async () => {
      const res = await verifyLoginBackupCodeAction({ code: backupCode.trim() });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <>
      <header className="mb-8">
        <span className="grid place-items-center size-12 rounded-2xl bg-accent text-accent-fg shadow-[0_8px_28px_-8px_hsl(var(--accent)/0.6)] mb-5">
          <ShieldCheck className="size-5" strokeWidth={2.2} />
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          المصادقة بخطوتين
        </h1>
        <p className="mt-2 text-sm text-fg-muted leading-relaxed">
          {mode === "totp" ? (
            <>
              أدخل الكود المكوّن من 6 أرقام من تطبيق المصادقة لإتمام الدخول إلى حسابك{" "}
              <span className="font-mono text-fg" dir="ltr">
                {maskedEmail}
              </span>
              .
            </>
          ) : (
            <>أدخل أحد أكواد النسخ الاحتياطي. سيتم تعطيل المصادقة بعد الاستخدام.</>
          )}
        </p>
      </header>

      {error && (
        <div className="mb-5 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger inline-flex items-center gap-2 w-full">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {mode === "totp" ? (
        <div className="space-y-5">
          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={submitTotp}
            disabled={pending}
            invalid={!!error}
          />

          <button
            type="button"
            onClick={() => submitTotp(code)}
            disabled={pending || code.length !== 6}
            className="group/btn relative w-full overflow-hidden rounded-md h-12 px-6 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest bg-accent text-accent-fg hover:bg-accent-hi transition-colors shadow-[0_8px_28px_-8px_hsl(var(--accent)/0.6)] disabled:opacity-60 disabled:pointer-events-none"
          >
            <span className="relative z-10 flex items-center gap-2">
              {pending ? (
                <>
                  <span className="size-3 rounded-full border-2 border-accent-fg border-t-transparent animate-spin" />
                  جاري التحقق…
                </>
              ) : (
                <>تأكيد الكود</>
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("backup");
              setError(null);
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-fg transition-colors"
          >
            <KeyRound className="size-3.5" />
            استخدام كود نسخ احتياطي
          </button>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            submitBackup();
          }}
        >
          <div>
            <Label htmlFor="backup" className="block mb-1.5">
              كود النسخ الاحتياطي
            </Label>
            <Input
              id="backup"
              inputSize="lg"
              dir="ltr"
              autoComplete="one-time-code"
              placeholder="XXXXX-XXXXX"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
              startAdornment={<KeyRound className="size-4" />}
              invalid={!!error}
              disabled={pending}
            />
            <p className="mt-2 text-[11px] text-fg-faint leading-relaxed">
              سيؤدي استخدام هذا الكود إلى تعطيل المصادقة بخطوتين. سيُطلب منك إعادة تفعيلها من إعدادات الحساب.
            </p>
          </div>

          <button
            type="submit"
            disabled={pending || backupCode.length < 11}
            className="w-full rounded-md h-12 px-6 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest bg-fg text-bg hover:bg-fg/90 transition-colors disabled:opacity-60 disabled:pointer-events-none"
          >
            {pending ? "جاري التحقق…" : "تأكيد الكود"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("totp");
              setError(null);
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-fg-muted hover:text-fg transition-colors"
          >
            <ArrowLeft className="size-3.5 rotate-180" />
            العودة إلى تطبيق المصادقة
          </button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-[hsl(var(--hairline))]">
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-fg-faint hover:text-fg transition-colors"
          >
            <LogOut className="size-3.5" />
            تسجيل الخروج واستخدام حساب آخر
          </button>
        </form>
      </div>
    </>
  );
}
