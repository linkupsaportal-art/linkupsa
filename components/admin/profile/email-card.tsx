"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Mail, Check, AlertCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/otp-input";
import { SectionCard, StatusBadge } from "@/components/admin/profile/section-card";
import {
  requestEmailChangeAction,
  confirmEmailChangeAction,
} from "@/app/admin/profile/actions";

type Stage = "idle" | "verify";

const emailSchema = z.string().email("بريد إلكتروني غير صالح");

/** Two-step email change: request → confirm with 6-digit OTP. */
export function EmailCard({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [stage, setStage] = useState<Stage>("idle");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function requestChange() {
    setError(null);
    setSuccess(false);
    const parsed = emailSchema.safeParse(newEmail);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "بريد إلكتروني غير صالح");
      return;
    }
    if (parsed.data.toLowerCase() === currentEmail.toLowerCase()) {
      setError("هذا هو بريدك الحالي.");
      return;
    }
    startTransition(async () => {
      const res = await requestEmailChangeAction({ newEmail: parsed.data });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNewEmail(res.email);
      setStage("verify");
    });
  }

  function confirmChange(submittedCode: string) {
    setError(null);
    startTransition(async () => {
      const res = await confirmEmailChangeAction({ newEmail, code: submittedCode });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStage("idle");
      setNewEmail("");
      setCode("");
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 4000);
    });
  }

  return (
    <SectionCard
      icon={Mail}
      title="البريد الإلكتروني"
      description="نستخدمه لإرسال أكواد التحقق وإشعارات الأمان."
      badge={<StatusBadge variant="ok">مؤكَّد</StatusBadge>}
      footer={
        stage === "idle" ? (
          <>
            {error && (
              <p className="me-auto inline-flex items-center gap-1.5 text-xs font-semibold text-danger">
                <AlertCircle className="size-3.5" />
                {error}
              </p>
            )}
            {success && !error && (
              <p className="me-auto inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                <Check className="size-3.5" />
                تم تحديث البريد بنجاح
              </p>
            )}
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={pending || !newEmail}
              onClick={requestChange}
            >
              {pending ? "جاري الإرسال…" : "إرسال الكود"}
              <ArrowRight className="size-4 rotate-180" />
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                setStage("idle");
                setCode("");
                setError(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={pending || code.length !== 6}
              onClick={() => confirmChange(code)}
            >
              {pending ? "جاري التأكيد…" : "تأكيد التغيير"}
            </Button>
          </>
        )
      }
    >
      {stage === "idle" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="block mb-1.5">البريد الحالي</Label>
            <Input
              inputSize="lg"
              dir="ltr"
              readOnly
              value={currentEmail}
              startAdornment={<Mail className="size-4" />}
              className="bg-surface-2 cursor-not-allowed"
            />
          </div>
          <div>
            <Label htmlFor="newEmail" className="block mb-1.5">
              البريد الجديد
            </Label>
            <Input
              id="newEmail"
              inputSize="lg"
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder="new@example.com"
              startAdornment={<Mail className="size-4" />}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={pending}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface-2 border border-[hsl(var(--hairline))] p-4 sm:p-5 text-center">
            <p className="text-sm text-fg-muted leading-relaxed">
              أرسلنا كوداً مكوناً من 6 أرقام إلى
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-fg" dir="ltr">
              {newEmail}
            </p>
            <p className="mt-1 text-[11px] text-fg-faint">
              صالح لمدة 10 دقائق فقط
            </p>
          </div>
          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={confirmChange}
            disabled={pending}
            invalid={!!error}
          />
          {error && (
            <p className="text-center inline-flex justify-center w-full items-center gap-1.5 text-xs font-semibold text-danger">
              <AlertCircle className="size-3.5" />
              {error}
            </p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
