"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical, Gauge, RefreshCw, Repeat, Ban, Archive, ArchiveRestore,
  Trash2, Loader2, X, Send, RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/db/orders";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  raiseOrderLimitAction,
  editOrderUsageAction,
  reassignOrderAccountAction,
  stopOrderAction,
  setOrderArchivedAction,
  deleteOrderAction,
  resendOrderNotificationAction,
  renewOrderAction,
} from "@/app/admin/orders/actions";

export type AccountOption = {
  id: string;
  label: string;
  productId: string;
  productName: string | null;
  status: string;
  usage: number;
  maxUsage: number;
};

type ModalKind = "limit" | "usage" | "reassign" | null;

/**
 * Per-order action menu — the operational toolbox from the spec. Renders a
 * kebab dropdown; each item opens the relevant themed modal or a confirm
 * dialog. All mutations call server actions and refresh on success.
 */
export function OrderRowActions({
  order,
  accounts,
  canManage,
  canDelete,
}: {
  order: Order;
  accounts: AccountOption[];
  canManage: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmResend, setConfirmResend] = useState(false);
  const [confirmRenew, setConfirmRenew] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!canManage && !canDelete) return null;

  const isArchived = !!order.archived_at;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const res = await fn();
        if (res.ok) router.refresh();
        else alert(res.error ?? "تعذّر تنفيذ العملية");
        resolve();
      });
    });
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="إجراءات"
          className="grid place-items-center size-8 rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreVertical className="size-4" />}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
            <div className="absolute end-0 mt-1 z-20 w-52 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] shadow-lg p-1">
              {canManage && (
                <>
                  <MenuItem icon={Gauge} label="رفع حد الأكواد" onClick={() => { setOpen(false); setModal("limit"); }} />
                  <MenuItem icon={RefreshCw} label="تعديل الاستهلاك" onClick={() => { setOpen(false); setModal("usage"); }} />
                  <MenuItem icon={Repeat} label="تغيير الحساب" onClick={() => { setOpen(false); setModal("reassign"); }} />
                  <MenuItem icon={Send} label="إعادة إرسال البيانات" onClick={() => { setOpen(false); setConfirmResend(true); }} />
                  <MenuItem icon={RotateCw} label="تجديد الاشتراك" onClick={() => { setOpen(false); setConfirmRenew(true); }} />
                  <MenuItem icon={Ban} label="إيقاف الطلب" onClick={() => { setOpen(false); setConfirmStop(true); }} danger />
                  <MenuItem
                    icon={isArchived ? ArchiveRestore : Archive}
                    label={isArchived ? "استعادة من الأرشيف" : "أرشفة الطلب"}
                    onClick={() => { setOpen(false); setConfirmArchive(true); }}
                  />
                </>
              )}
              {canDelete && (
                <MenuItem icon={Trash2} label="حذف الطلب" onClick={() => { setOpen(false); setConfirmDelete(true); }} danger />
              )}
            </div>
          </>
        )}
      </div>

      {/* Raise limit */}
      {modal === "limit" && (
        <LimitModal
          order={order}
          onClose={() => setModal(null)}
          onSubmit={(newLimit, reason) =>
            run(() => raiseOrderLimitAction({ orderId: order.id, newLimit, reason })).then(() => setModal(null))
          }
        />
      )}

      {/* Edit usage */}
      {modal === "usage" && (
        <UsageModal
          order={order}
          onClose={() => setModal(null)}
          onSubmit={(count) =>
            run(() => editOrderUsageAction({ orderId: order.id, otpRequestCount: count })).then(() => setModal(null))
          }
        />
      )}

      {/* Reassign account */}
      {modal === "reassign" && (
        <ReassignModal
          order={order}
          accounts={accounts.filter((a) => !order.product_id || a.productId === order.product_id)}
          onClose={() => setModal(null)}
          onSubmit={(accountId) =>
            run(() => reassignOrderAccountAction({ orderId: order.id, accountId })).then(() => setModal(null))
          }
        />
      )}

      <ConfirmDialog
        open={confirmStop}
        onOpenChange={setConfirmStop}
        tone="danger"
        title="إيقاف هذا الطلب؟"
        description="سيتم وضع الطلب كملغى ولن يتمكن العميل من الاستلام."
        confirmLabel="إيقاف الطلب"
        onConfirm={() => run(() => stopOrderAction({ orderId: order.id }))}
      />

      <ConfirmDialog
        open={confirmResend}
        onOpenChange={setConfirmResend}
        title="إعادة إرسال البيانات؟"
        description="سيُعاد إرسال رابط الاستلام للعميل عبر القنوات المفعّلة (إيميل/واتساب)."
        confirmLabel="إعادة الإرسال"
        onConfirm={() => run(() => resendOrderNotificationAction({ orderId: order.id }))}
      />

      <ConfirmDialog
        open={confirmRenew}
        onOpenChange={setConfirmRenew}
        title="تجديد اشتراك الطلب؟"
        description="سيُعاد تعيين عداد الاستهلاك إلى صفر وتفعيل الطلب من جديد، مع استعادته من الأرشيف إن كان مؤرشفاً."
        confirmLabel="تجديد الاشتراك"
        onConfirm={() => run(() => renewOrderAction({ orderId: order.id }))}
      />

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title={isArchived ? "استعادة الطلب؟" : "أرشفة الطلب؟"}
        description={isArchived ? "سيعود الطلب إلى القائمة النشطة." : "سيُنقل الطلب إلى الأرشيف ويختفي من القائمة النشطة."}
        confirmLabel={isArchived ? "استعادة" : "أرشفة"}
        onConfirm={() => run(() => setOrderArchivedAction({ orderId: order.id, archived: !isArchived }))}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        tone="danger"
        title="حذف الطلب نهائياً؟"
        description="لا يمكن التراجع عن هذا الإجراء. يُفضّل الأرشفة بدل الحذف."
        confirmLabel="حذف نهائي"
        onConfirm={() => run(() => deleteOrderAction({ orderId: order.id }))}
      />
    </>
  );
}

function MenuItem({
  icon: Icon, label, onClick, danger,
}: {
  icon: typeof Gauge; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors text-start",
        danger ? "text-danger hover:bg-danger/10" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {label}
    </button>
  );
}

/* ── Modals ─────────────────────────────────────────────────────────────── */
function LimitModal({
  order, onClose, onSubmit,
}: {
  order: Order;
  onClose: () => void;
  onSubmit: (newLimit: number, reason?: string) => void;
}) {
  const [value, setValue] = useState(String(order.otp_request_limit));
  const [reason, setReason] = useState("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>رفع حد الأكواد</DialogTitle>
          <DialogDescription>
            الحد الحالي: <b>{order.otp_request_limit}</b> · الاستهلاك: <b>{order.otp_request_count}</b>
          </DialogDescription>
        </DialogHeader>
        <label className="block text-xs font-bold text-fg-muted mb-1.5">الحد الجديد</label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          dir="ltr"
          className={inputCls}
        />
        <label className="block text-xs font-bold text-fg-muted mb-1.5 mt-3">السبب (اختياري)</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} placeholder="مثال: طلب العميل" />
        <DialogFooter className="mt-2">
          <button
            type="button"
            onClick={() => onSubmit(Math.max(0, parseInt(value || "0", 10)), reason || undefined)}
            className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-fg text-bg text-sm font-bold hover:bg-[hsl(var(--surface-4))]"
          >
            حفظ
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UsageModal({
  order, onClose, onSubmit,
}: {
  order: Order; onClose: () => void; onSubmit: (count: number) => void;
}) {
  const [value, setValue] = useState(String(order.otp_request_count));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>تعديل الاستهلاك</DialogTitle>
          <DialogDescription>عدّل عداد طلبات الأكواد المستهلكة لهذا الطلب.</DialogDescription>
        </DialogHeader>
        <input type="number" value={value} onChange={(e) => setValue(e.target.value)} dir="ltr" className={inputCls} />
        <DialogFooter className="mt-2">
          <button
            type="button"
            onClick={() => onSubmit(Math.max(0, parseInt(value || "0", 10)))}
            className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-fg text-bg text-sm font-bold hover:bg-[hsl(var(--surface-4))]"
          >
            حفظ
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReassignModal({
  order, accounts, onClose, onSubmit,
}: {
  order: Order;
  accounts: AccountOption[];
  onClose: () => void;
  onSubmit: (accountId: string) => void;
}) {
  const [selected, setSelected] = useState<string>("");
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تغيير الحساب المرتبط</DialogTitle>
          <DialogDescription>
            اختر حساباً بديلاً من نفس المنتج. الحساب الحالي:{" "}
            <b>{order.account_label ?? "—"}</b>
          </DialogDescription>
        </DialogHeader>
        {accounts.length === 0 ? (
          <p className="text-sm text-fg-muted py-4 text-center">لا توجد حسابات متاحة لنفس المنتج.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {accounts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-start transition-colors",
                  selected === a.id
                    ? "border-accent bg-accent/10"
                    : "border-[hsl(var(--hairline))] hover:bg-surface-2",
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-fg truncate">{a.label}</p>
                  <p className="text-[11px] text-fg-muted">{a.productName ?? "—"} · {a.status}</p>
                </div>
                <span className="text-[11px] font-num text-fg-muted shrink-0" dir="ltr">
                  {a.usage}/{a.maxUsage}
                </span>
              </button>
            ))}
          </div>
        )}
        <DialogFooter className="mt-2">
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onSubmit(selected)}
            className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-fg text-bg text-sm font-bold hover:bg-[hsl(var(--surface-4))] disabled:opacity-50"
          >
            تأكيد التغيير
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const inputCls = "w-full h-10 px-3 rounded-xl border border-[hsl(var(--hairline-strong))] bg-surface text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent";
