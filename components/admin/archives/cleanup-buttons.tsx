"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  archiveOldOrdersAction,
  cleanupOtpLogsAction,
} from "@/app/admin/archives/actions";

/**
 * Manual cleanup controls — runs the same retention logic as the nightly cron,
 * on demand. Each button confirms first, then shows the affected count.
 */
export function CleanupButtons() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmOtp, setConfirmOtp] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function runArchive() {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const res = await archiveOldOrdersAction();
        setMsg(res.ok ? { kind: "ok", text: res.message } : { kind: "err", text: res.error });
        if (res.ok) router.refresh();
        resolve();
      });
    });
  }

  function runOtp() {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const res = await cleanupOtpLogsAction();
        setMsg(res.ok ? { kind: "ok", text: res.message } : { kind: "err", text: res.error });
        if (res.ok) router.refresh();
        resolve();
      });
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmArchive(true)}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-fg text-bg text-sm font-bold hover:bg-[hsl(var(--surface-4))] disabled:opacity-50 transition-colors"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Archive className="size-3.5" />}
          أرشفة الطلبات الآن
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmOtp(true)}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-[hsl(var(--hairline-strong))] text-fg text-sm font-bold hover:bg-surface-2 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="size-3.5" />
          تنظيف سجلات OTP الآن
        </button>
      </div>

      {msg && (
        <p className={cn("text-xs font-semibold", msg.kind === "ok" ? "text-success" : "text-danger")}>
          {msg.text}
        </p>
      )}

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title="أرشفة الطلبات القديمة الآن؟"
        description="ستُؤرشف كل الطلبات الأقدم من مدة الاحتفاظ المحددة. يمكن استعادتها لاحقاً."
        confirmLabel="أرشفة الآن"
        onConfirm={runArchive}
      />
      <ConfirmDialog
        open={confirmOtp}
        onOpenChange={setConfirmOtp}
        tone="danger"
        title="حذف سجلات OTP القديمة؟"
        description="سيُحذف نهائياً كل سجل أقدم من مدة الاحتفاظ. لا يمكن التراجع."
        confirmLabel="حذف الآن"
        onConfirm={runOtp}
      />
    </div>
  );
}
