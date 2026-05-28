"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, ShieldAlert, Smartphone, KeyRound, Copy, Check,
  AlertCircle, RefreshCw, Download, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { OtpInput } from "@/components/auth/otp-input";
import { SectionCard, StatusBadge } from "@/components/admin/profile/section-card";
import {
  startMfaEnrollAction,
  verifyMfaEnrollAction,
  disableMfaAction,
  regenerateBackupCodesAction,
} from "@/app/admin/profile/actions";

type Step =
  | { kind: "idle" }
  | { kind: "enrol"; factorId: string; qr: string; secret: string }
  | { kind: "verify"; factorId: string; qr: string; secret: string }
  | { kind: "backup"; codes: string[] };

/**
 * Two-factor authentication block.
 *
 * Flow:
 *   idle → (Enable) → enrol (show QR + secret) → verify (6-digit code)
 *        → backup (show 8 single-use codes) → enabled state
 *
 * Disable wipes ALL factors + ALL backup codes.
 * Regenerate creates a fresh batch of codes.
 */
export function TwoFactorCard({ hasMfa }: { hasMfa: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDisable, setConfirmDisable] = useState(false);

  function handleEnable() {
    setError(null);
    startTransition(async () => {
      const res = await startMfaEnrollAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStep({ kind: "enrol", factorId: res.factorId, qr: res.qr, secret: res.secret });
    });
  }

  function handleVerifyEnrol(submittedCode: string) {
    if (step.kind !== "enrol" && step.kind !== "verify") return;
    setError(null);
    startTransition(async () => {
      const res = await verifyMfaEnrollAction({
        factorId: step.factorId,
        code: submittedCode,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStep({ kind: "backup", codes: res.backupCodes });
      setCode("");
      router.refresh();
    });
  }

  function handleDisable() {
    setError(null);
    startTransition(async () => {
      const res = await disableMfaAction();
      if (!res.ok) {
        setError(res.error);
        setConfirmDisable(false);
        return;
      }
      setConfirmDisable(false);
      setStep({ kind: "idle" });
      router.refresh();
    });
  }

  function handleRegenerate() {
    setError(null);
    startTransition(async () => {
      const res = await regenerateBackupCodesAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStep({ kind: "backup", codes: res.backupCodes });
    });
  }

  // ────────────── render ──────────────

  if (hasMfa && step.kind === "idle") {
    return (
      <>
        <SectionCard
          icon={ShieldCheck}
          title="المصادقة بخطوتين"
          description="حسابك محمي بكود من تطبيق المصادقة. ننصح بحفظ أكواد النسخ الاحتياطي في مكان آمن."
          badge={<StatusBadge variant="ok">مفعّل</StatusBadge>}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureRow icon={Smartphone} title="تطبيق مصادقة" subtitle="Google Authenticator أو ما يماثله" />
            <FeatureRow icon={KeyRound} title="8 أكواد نسخ احتياطي" subtitle="تُستخدم مرة واحدة لكل كود" />
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={pending}
            >
              <RefreshCw className="size-4" />
              توليد أكواد جديدة
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDisable(true)}
              disabled={pending}
              className="text-danger hover:bg-danger/5 hover:border-danger/30"
            >
              <ShieldAlert className="size-4" />
              تعطيل المصادقة
            </Button>
          </div>

          {error && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-danger">
              <AlertCircle className="size-3.5" />
              {error}
            </p>
          )}
        </SectionCard>

        <DisableConfirmDialog
          open={confirmDisable}
          onOpenChange={setConfirmDisable}
          onConfirm={handleDisable}
          pending={pending}
        />
      </>
    );
  }

  if (step.kind === "enrol" || step.kind === "verify") {
    return (
      <SectionCard
        icon={ShieldCheck}
        title="إعداد المصادقة بخطوتين"
        description="امسح رمز QR بتطبيق المصادقة، ثم أدخل الكود المكوّن من 6 أرقام."
        badge={<StatusBadge variant="warn">قيد الإعداد</StatusBadge>}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep({ kind: "idle" });
                setCode("");
                setError(null);
              }}
              disabled={pending}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={pending || code.length !== 6}
              onClick={() => handleVerifyEnrol(code)}
            >
              {pending ? "جاري التحقق…" : "تأكيد التفعيل"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* QR + secret */}
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-[hsl(var(--hairline))] grid place-items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={step.qr}
                alt="رمز QR للمصادقة"
                width={200}
                height={200}
                className="size-44 sm:size-48"
              />
            </div>
            <SecretField secret={step.secret} />
          </div>

          {/* Code entry */}
          <div className="space-y-4">
            <ol className="space-y-3 text-sm text-fg-muted leading-relaxed">
              <Step n={1}>
                افتح تطبيق <span className="font-bold text-fg">Google Authenticator</span> أو ما يماثله.
              </Step>
              <Step n={2}>
                امسح رمز QR، أو أدخل المفتاح يدوياً.
              </Step>
              <Step n={3}>
                أدخل الكود المكوّن من 6 أرقام الذي يظهر في التطبيق:
              </Step>
            </ol>
            <OtpInput
              value={code}
              onChange={setCode}
              onComplete={handleVerifyEnrol}
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
        </div>
      </SectionCard>
    );
  }

  if (step.kind === "backup") {
    return (
      <SectionCard
        icon={KeyRound}
        title="أكواد النسخ الاحتياطي"
        description="احفظ هذه الأكواد في مكان آمن. كل كود يُستخدم مرة واحدة فقط، ولن تتمكن من رؤيتها مجدداً."
        badge={<StatusBadge variant="warn">احفظها الآن</StatusBadge>}
        footer={
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setStep({ kind: "idle" })}
          >
            <Check className="size-4" />
            حفظت الأكواد
          </Button>
        }
      >
        <BackupCodesGrid codes={step.codes} />
      </SectionCard>
    );
  }

  // Default: not enabled, idle
  return (
    <SectionCard
      icon={ShieldAlert}
      title="المصادقة بخطوتين"
      description="فعّل المصادقة بخطوتين لإضافة طبقة حماية إضافية. ستحتاج كوداً من تطبيق المصادقة عند تسجيل الدخول."
      badge={<StatusBadge variant="muted">غير مفعّل</StatusBadge>}
      footer={
        <Button type="button" variant="primary" size="sm" onClick={handleEnable} disabled={pending}>
          <ShieldCheck className="size-4" />
          {pending ? "جاري التحضير…" : "تفعيل المصادقة"}
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FeatureRow icon={Smartphone} title="تطبيق مصادقة" subtitle="Google Authenticator أو ما يماثله" />
        <FeatureRow icon={KeyRound} title="أكواد نسخ احتياطي" subtitle="8 أكواد للطوارئ، تُستخدم مرة واحدة" />
      </div>
      {error && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-danger">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      )}
    </SectionCard>
  );
}

/* ─── helpers ────────────────────────────────────────────────────── */

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid place-items-center size-6 rounded-full bg-fg text-bg text-xs font-bold shrink-0 mt-0.5">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3.5">
      <span className="grid place-items-center size-9 rounded-xl bg-bg text-fg shrink-0">
        <Icon className="size-4" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-fg truncate">{title}</p>
        <p className="text-[11px] text-fg-muted truncate">{subtitle}</p>
      </div>
    </div>
  );
}

function SecretField({ secret }: { secret: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-xl bg-surface-2 p-3.5">
      <p className="text-[11px] uppercase tracking-widest font-bold text-fg-faint mb-1.5">
        أو أدخل المفتاح يدوياً
      </p>
      <div className="flex items-center gap-2">
        <code
          className="flex-1 font-mono text-sm font-bold text-fg tabular-nums break-all"
          dir="ltr"
        >
          {shown ? secret : "•".repeat(Math.min(secret.length, 24))}
        </code>
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? "إخفاء" : "إظهار"}
          className="grid place-items-center size-8 rounded-lg text-fg-muted hover:bg-bg hover:text-fg transition-colors shrink-0"
        >
          {shown ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
        <button
          type="button"
          onClick={copy}
          aria-label="نسخ"
          className="grid place-items-center size-8 rounded-lg text-fg-muted hover:bg-bg hover:text-fg transition-colors shrink-0"
        >
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

function BackupCodesGrid({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);

  function copyAll() {
    navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function downloadTxt() {
    const blob = new Blob(
      [
        "LinkUp — Backup Codes\n",
        "Single-use recovery codes. Generated " + new Date().toISOString() + "\n\n",
        codes.join("\n"),
        "\n",
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linkup-backup-codes-${Date.now()}.txt`;
    a.click();
    // Defer revocation so the browser has time to start the download.
    // Revoking immediately can cancel the in-flight download in some
    // browsers (Safari, older Firefox).
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-warn/10 border border-warn/30 p-4 flex items-start gap-3">
        <AlertCircle className="size-4 text-warn shrink-0 mt-0.5" />
        <p className="text-xs text-fg leading-relaxed">
          هذه آخر مرة تظهر فيها هذه الأكواد. احفظها في مدير كلمات مرور أو طباعتها وتخزينها في مكان آمن.
        </p>
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {codes.map((c, i) => (
          <li
            key={c}
            className="rounded-xl bg-fg text-bg px-3 py-2.5 text-center font-mono text-sm font-bold tabular-nums"
            dir="ltr"
          >
            <span className="block text-[10px] text-bg/60 mb-0.5">#{i + 1}</span>
            {c}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copyAll}>
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          {copied ? "تم النسخ" : "نسخ الكل"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={downloadTxt}>
          <Download className="size-4" />
          تنزيل (.txt)
        </Button>
      </div>
    </div>
  );
}

function DisableConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعطيل المصادقة بخطوتين؟</DialogTitle>
          <DialogDescription>
            سيتم حذف تطبيق المصادقة المسجَّل وجميع أكواد النسخ الاحتياطي بشكل نهائي. يمكنك إعادة التفعيل لاحقاً.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-danger/10 border border-danger/30 p-3 text-xs text-fg leading-relaxed flex items-start gap-2">
          <AlertCircle className="size-4 text-danger shrink-0 mt-0.5" />
          سيقل مستوى حماية حسابك بعد التعطيل.
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "جاري التعطيل…" : "نعم، تعطيل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
