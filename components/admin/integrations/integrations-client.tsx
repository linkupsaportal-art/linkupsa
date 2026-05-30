"use client";

import { useState, useTransition } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import {
  drainWebhookQueueAction,
  retryWebhookEventAction,
} from "@/app/admin/integrations/actions";
import type { IntegrationEvent } from "@/app/admin/integrations/page";

export function IntegrationsClient({
  events,
  pending,
  failed,
}: {
  events: IntegrationEvent[];
  pending: number;
  failed: number;
}) {
  const [isDraining, startDrain] = useTransition();
  const [drainResult, setDrainResult] = useState<string | null>(null);
  const [drainError, setDrainError] = useState<string | null>(null);

  function drain() {
    setDrainResult(null);
    setDrainError(null);
    startDrain(async () => {
      const r = await drainWebhookQueueAction();
      if (!r.ok) {
        setDrainError(r.error);
        return;
      }
      const d = r.data;
      if (!d) {
        setDrainResult("تمت المعالجة.");
        return;
      }
      setDrainResult(
        `تمت المعالجة: ${d.processed} حدث طلب، ${d.fulfilled} تم تنفيذه، ${d.skipped} تم تجاوزه، ${d.errors} فشل، ${d.ackedNonOrder} حدث أُغلق.`,
      );
    });
  }

  const showActions = pending > 0 || failed > 0;

  return (
    <div className="space-y-3">
      {showActions && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-fg-muted">
            {pending > 0 && (
              <span>
                {pending} حدث ينتظر المعالجة.
              </span>
            )}{" "}
            {failed > 0 && (
              <span className="text-red-400 font-semibold">{failed} حدث فشل ويحتاج إعادة محاولة.</span>
            )}
          </div>
          <button
            onClick={drain}
            disabled={isDraining}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-fg text-bg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {isDraining ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            {isDraining ? "جاري المعالجة..." : "تشغيل المعالج الآن"}
          </button>
        </div>
      )}

      {drainError && (
        <div className="flex items-start gap-2 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{drainError}</span>
        </div>
      )}
      {drainResult && (
        <div className="flex items-start gap-2 text-xs text-accent font-semibold bg-accent/10 border border-accent/20 px-3 py-2 rounded-lg">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <span>{drainResult}</span>
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-sm text-fg-muted text-center py-6">لم تصل أحداث بعد.</p>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-semibold text-fg-muted uppercase tracking-wider border-b border-[hsl(var(--hairline))]">
                <th className="text-start py-2 font-semibold">الحدث</th>
                <th className="text-start py-2 font-semibold">الحالة</th>
                <th className="text-start py-2 font-semibold">الخطأ</th>
                <th className="text-start py-2 font-semibold">الوقت</th>
                <th className="text-end py-2 font-semibold">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--hairline))]">
              {events.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: IntegrationEvent }) {
  const [isRetrying, startRetry] = useTransition();
  function retry() {
    startRetry(async () => {
      await retryWebhookEventAction(event.id);
    });
  }
  const canRetry = event.status === "failed" || event.status === "pending";
  return (
    <tr>
      <td className="py-2.5 text-xs text-fg font-bold">{event.event}</td>
      <td className="py-2.5">
        <StatusBadge status={event.status} />
      </td>
      <td
        className="py-2.5 text-[11px] text-fg-muted max-w-xs truncate"
        title={event.error ?? ""}
      >
        {event.error || <span className="text-fg-faint">—</span>}
      </td>
      <td className="py-2.5 text-[11px] text-fg-muted font-num" dir="ltr">
        {new Date(event.received_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td className="py-2.5 text-end">
        {canRetry ? (
          <button
            onClick={retry}
            disabled={isRetrying}
            title="إعادة المحاولة"
            className="size-7 inline-flex items-center justify-center rounded-lg bg-surface-2 hover:bg-surface text-fg-muted hover:text-fg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isRetrying ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <RotateCcw className="size-3" />
            )}
          </button>
        ) : (
          <span className="text-fg-faint text-[10px]">—</span>
        )}
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; cls: string; Icon: typeof Clock }
  > = {
    succeeded: {
      label: "نجح",
      cls: "bg-accent/15 text-accent border-accent/25",
      Icon: CheckCircle2,
    },
    failed: {
      label: "فشل",
      cls: "bg-red-500/15 text-red-400 border-red-500/25",
      Icon: AlertCircle,
    },
    pending: {
      label: "ينتظر",
      cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
      Icon: Clock,
    },
    processing: {
      label: "قيد المعالجة",
      cls: "bg-blue-500/15 text-blue-400 border-blue-500/25",
      Icon: Activity,
    },
    skipped: {
      label: "متجاوز",
      cls: "bg-fg-faint/15 text-fg-faint border-fg-faint/25",
      Icon: Clock,
    },
  };
  const meta = map[status] ?? map.pending;
  const Icon = meta.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold border ${meta.cls}`}
    >
      <Icon className="size-2.5" />
      {meta.label}
    </span>
  );
}
