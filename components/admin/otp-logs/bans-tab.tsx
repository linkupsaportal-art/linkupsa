"use client";

import { useState, useTransition, useMemo } from "react";
import { ShieldBan, Plus, Trash2, Power, PowerOff, Sparkles, Timer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  createPhoneBan,
  deletePhoneBan,
  togglePhoneBan,
} from "@/app/admin/otp-logs/actions";
import type { PhoneBan } from "@/lib/db/phone-bans";
import { PhoneInput } from "@/components/ui/phone-input";
import { CustomSelect } from "@/components/ui/select";

const DURATION_OPTIONS: { label: string; minutes: number }[] = [
  { label: "دائم", minutes: 0 },
  { label: "1 ساعة", minutes: 60 },
  { label: "6 ساعات", minutes: 360 },
  { label: "12 ساعة", minutes: 720 },
  { label: "24 ساعة", minutes: 1440 },
  { label: "3 أيام", minutes: 4320 },
  { label: "7 أيام", minutes: 10080 },
];

export function BansTab({
  bans,
  products,
}: {
  bans: PhoneBan[];
  products: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const productOptions = useMemo(() => {
    return [
      { value: "", label: "حظر عام (كل المنتجات)" },
      ...products.map((p) => ({
        value: p.id,
        label: p.name,
      })),
    ];
  }, [products]);
  const [mobile, setMobile] = useState("");
  const [productId, setProductId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createPhoneBan({
        mobile,
        productId: productId || null,
        reason: reason || null,
        durationMinutes,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMobile("");
      setProductId("");
      setReason("");
      setDurationMinutes(0);
      setOpen(false);
    });
  }

  const active = bans.filter((b) => b.active).length;
  const auto = bans.filter((b) => b.auto_banned).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-fg-muted">
          إجمالي الحظر:{" "}
          <span className="font-num font-extrabold text-fg">{bans.length}</span>{" "}
          ·{" "}
          <span className="text-fg-faint">
            نشط: <span className="font-num text-fg-muted">{active}</span>
          </span>{" "}
          ·{" "}
          <span className="text-fg-faint">
            تلقائي: <span className="font-num text-fg-muted">{auto}</span>
          </span>
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-fg text-bg text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer">
              <Plus className="size-3.5" />
              حظر جديد
            </button>
          </DialogTrigger>
          <DialogContent className="theme-admin sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>حظر رقم جوال</DialogTitle>
              <DialogDescription>
                امنع رقم محدد من تنفيذ منتج معين، أو من جميع المنتجات.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Field label="رقم الجوال (مع رمز الدولة)" required>
                <PhoneInput
                  value={mobile}
                  onChange={(val) => setMobile(val)}
                  disabled={isPending}
                  placeholder="5X XXX XXXX"
                />
              </Field>
              <Field label="المنتج المحظور (اختياري)">
                <CustomSelect
                  value={productId}
                  onChange={(val) => setProductId(val)}
                  options={productOptions}
                  placeholder="حظر عام (كل المنتجات)"
                  disabled={isPending}
                />
              </Field>
              <Field label="السبب">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="مثال: محاولات احتيال متكررة"
                  className="px-3 py-2 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 resize-none"
                />
              </Field>
              <Field label="مدة الحظر">
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_OPTIONS.map((opt) => {
                    const active = durationMinutes === opt.minutes;
                    return (
                      <button
                        key={opt.minutes}
                        type="button"
                        onClick={() => setDurationMinutes(opt.minutes)}
                        className={`h-8 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          active
                            ? "bg-accent text-accent-fg"
                            : "bg-surface-2 text-fg-muted border border-[hsl(var(--hairline-strong))] hover:bg-surface hover:text-fg"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-fg-faint">
                  دائم = لا يُرفع تلقائياً، أنت من يرفعه يدوياً.
                </p>
              </Field>
              {error && (
                <div className="text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <button
                onClick={() => setOpen(false)}
                className="h-10 px-4 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-sm font-semibold text-fg hover:bg-surface-2 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={submit}
                disabled={isPending || !mobile.trim()}
                className="h-10 px-4 rounded-xl bg-fg text-bg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "جاري الحفظ..." : "حفظ الحظر"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {bans.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2 border-b border-[hsl(var(--hairline))]">
                <tr className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                  <th className="text-start px-4 py-3 font-semibold">الحالة</th>
                  <th className="text-start px-4 py-3 font-semibold">المصدر</th>
                  <th className="text-start px-4 py-3 font-semibold">رقم الجوال</th>
                  <th className="text-start px-4 py-3 font-semibold">المنتج المحظور</th>
                  <th className="text-start px-4 py-3 font-semibold">المدة</th>
                  <th className="text-start px-4 py-3 font-semibold">السبب</th>
                  <th className="text-start px-4 py-3 font-semibold">التاريخ</th>
                  <th className="text-end px-4 py-3 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--hairline))]">
                {bans.map((ban) => (
                  <BanRow key={ban.id} ban={ban} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function BanRow({ ban }: { ban: PhoneBan }) {
  const [isPending, startTransition] = useTransition();
  function toggle() {
    startTransition(async () => {
      await togglePhoneBan(ban.id, !ban.active);
    });
  }
  function remove() {
    if (!confirm("هل أنت متأكد من حذف هذا الحظر؟")) return;
    startTransition(async () => {
      await deletePhoneBan(ban.id);
    });
  }
  return (
    <tr className={`hover:bg-surface-2 transition-colors ${!ban.active ? "opacity-60" : ""}`}>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold border ${
            ban.active
              ? "bg-red-500/15 text-red-400 border-red-500/25"
              : "bg-fg-faint/15 text-fg-faint border-fg-faint/25"
          }`}
        >
          {ban.active ? "محظور" : "غير نشط"}
        </span>
      </td>
      <td className="px-4 py-3">
        {ban.auto_banned ? (
          <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-semibold bg-amber-500/15 text-black border border-amber-500/25">
            <Sparkles className="size-2.5" />
            تلقائي
          </span>
        ) : (
          <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold bg-surface-2 text-fg-muted border border-[hsl(var(--hairline))]">
            يدوي
          </span>
        )}
      </td>
      <td className="px-4 py-3 font-num text-sm text-fg" dir="ltr">
        {ban.mobile}
      </td>
      <td className="px-4 py-3 text-sm text-fg">
        {ban.product_name ?? <span className="text-fg-faint italic">حظر عام</span>}
      </td>
      <td className="px-4 py-3">
        <ExpiryChip expiresAt={ban.expires_at} active={ban.active} />
      </td>
      <td className="px-4 py-3 text-xs text-fg-muted max-w-xs">
        {ban.reason || <span className="text-fg-faint">—</span>}
      </td>
      <td className="px-4 py-3 text-xs text-fg-muted font-num" dir="ltr">
        {new Date(ban.created_at).toLocaleDateString("en-US", {
          year: "2-digit",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td className="px-4 py-3 text-end">
        <div className="inline-flex items-center gap-1">
          <button
            onClick={toggle}
            disabled={isPending}
            title={ban.active ? "إيقاف الحظر" : "تفعيل الحظر"}
            className="size-8 inline-flex items-center justify-center rounded-lg bg-surface-2 hover:bg-surface text-fg-muted hover:text-fg transition-colors cursor-pointer"
          >
            {ban.active ? <PowerOff className="size-3.5" /> : <Power className="size-3.5" />}
          </button>
          <button
            onClick={remove}
            disabled={isPending}
            title="حذف"
            className="size-8 inline-flex items-center justify-center rounded-lg bg-surface-2 hover:bg-red-500/10 text-fg-muted hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-fg-muted">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      {children}
    </label>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-12 text-center">
      <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-2 mb-4">
        <ShieldBan className="size-6 text-fg-muted" />
      </div>
      <h3 className="font-semibold text-fg mb-1">لا توجد أرقام محظورة</h3>
      <p className="text-sm text-fg-muted">
        أضف رقم جوال يدوياً، أو فعّل الحظر التلقائي من تبويب الإعدادات لإضافة الأرقام المسيئة تلقائياً.
      </p>
    </div>
  );
}

/* ── ExpiryChip ─────────────────────────────────────────────────────── */
function ExpiryChip({
  expiresAt,
  active,
}: {
  expiresAt: string | null;
  active: boolean;
}) {
  if (!expiresAt) {
    return (
      <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
        <Timer className="size-2.5" />
        دائم
      </span>
    );
  }
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) {
    return (
      <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-fg-faint/10 text-fg-faint border border-fg-faint/20">
        منتهي
      </span>
    );
  }
  const label = humanizeMs(ms);
  return (
    <span
      className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold border ${
        active
          ? "bg-amber-500/10 text-black border-amber-500/25"
          : "bg-fg-faint/10 text-fg-faint border-fg-faint/20"
      }`}
    >
      <Timer className="size-2.5" />
      ينتهي خلال {label}
    </span>
  );
}

function humanizeMs(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} س`;
  const days = Math.floor(hours / 24);
  return `${days} ي`;
}
