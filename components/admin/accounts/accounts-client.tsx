"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Eye, EyeOff, Database, Pause, Play } from "lucide-react";
import type { Account } from "@/lib/db/accounts";
import type { Product } from "@/lib/db/products-types";
import { HANDLER_LABELS } from "@/lib/db/products-types";
import {
  createAccountAction,
  deleteAccountAction,
  updateAccountStatusAction,
} from "@/app/admin/accounts/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_LABELS: Record<Account["status"], string> = {
  active: "نشط",
  paused: "موقوف",
  full: "ممتلئ",
  retired: "متقاعد",
};

const STATUS_COLORS: Record<Account["status"], string> = {
  active: "bg-accent/15 text-accent",
  paused: "bg-yellow-500/15 text-yellow-400",
  full: "bg-red-500/15 text-red-400",
  retired: "bg-fg-faint/15 text-fg-faint",
};

export function AccountsClient({
  initialAccounts,
  products,
}: {
  initialAccounts: Account[];
  products: Product[];
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() { window.location.reload(); }

  const filtered = filterProduct === "all"
    ? initialAccounts
    : initialAccounts.filter((a) => a.product_id === filterProduct);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createAccountAction(fd);
      if (res?.error) { setError(res.error); return; }
      setShowAddDialog(false);
      refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا الحساب؟ لا يمكن التراجع.")) return;
    startTransition(async () => {
      const res = await deleteAccountAction(id);
      if (res?.error) { setError(res.error); return; }
      refresh();
    });
  }

  async function handleStatusChange(id: string, status: Account["status"]) {
    startTransition(async () => {
      await updateAccountStatusAction(id, status);
      refresh();
    });
  }

  function toggleReveal(id: string) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="h-9 px-3 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
        >
          <option value="all">كل المنتجات ({initialAccounts.length})</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({initialAccounts.filter((a) => a.product_id === p.id).length})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => { setShowAddDialog(true); setError(null); }}
          disabled={products.length === 0}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-accent text-accent-fg text-sm font-semibold hover:bg-accent-hi transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          title={products.length === 0 ? "أضف منتجاً أولاً" : "إضافة حساب"}
        >
          <Plus className="size-4" />
          إضافة حساب
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          onAdd={() => setShowAddDialog(true)}
          hasProducts={products.length > 0}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              revealed={revealedIds.has(account.id)}
              onToggleReveal={() => toggleReveal(account.id)}
              onDelete={() => handleDelete(account.id)}
              onStatusChange={(s) => handleStatusChange(account.id, s)}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>حساب جديد</DialogTitle>
            <DialogDescription>أضف بيانات حساب جديد للمخزون. تُشفّر الحقول الحساسة قبل الحفظ.</DialogDescription>
          </DialogHeader>
          <AccountForm
            products={products}
            onSubmit={handleCreate}
            onCancel={() => setShowAddDialog(false)}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountRow({
  account,
  revealed,
  onToggleReveal,
  onDelete,
  onStatusChange,
  isPending,
}: {
  account: Account;
  revealed: boolean;
  onToggleReveal: () => void;
  onDelete: () => void;
  onStatusChange: (s: Account["status"]) => void;
  isPending: boolean;
}) {
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-fg">{account.label}</span>
            <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold ${STATUS_COLORS[account.status]}`}>
              {STATUS_LABELS[account.status]}
            </span>
            <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold bg-surface-2 text-fg-muted">
              {HANDLER_LABELS[account.handler_type]}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-fg-muted">
            {account.email && <span>{account.email}</span>}
            {account.product_name && <span className="text-fg-faint">{account.product_name}</span>}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.min(100, (account.current_usage / account.max_usage) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-fg-faint font-num">
              {account.current_usage}/{account.max_usage}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleReveal}
            className="p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
            title={revealed ? "إخفاء" : "عرض البيانات"}
            aria-label={revealed ? "إخفاء" : "عرض البيانات"}
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>

          {account.status === "active" ? (
            <button
              type="button"
              onClick={() => onStatusChange("paused")}
              disabled={isPending}
              className="p-2 rounded-lg text-fg-muted hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="إيقاف مؤقت"
              aria-label="إيقاف مؤقت"
            >
              <Pause className="size-4" />
            </button>
          ) : account.status === "paused" ? (
            <button
              type="button"
              onClick={() => onStatusChange("active")}
              disabled={isPending}
              className="p-2 rounded-lg text-fg-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="تفعيل"
              aria-label="تفعيل"
            >
              <Play className="size-4" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="p-2 rounded-lg text-fg-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
            aria-label="حذف"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {revealed && (
        <div className="mt-3 pt-3 border-t border-[hsl(var(--hairline))] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {account.email && (
            <div>
              <span className="text-fg-faint">البريد الإلكتروني: </span>
              <span className="text-fg">{account.email}</span>
            </div>
          )}
          <div>
            <span className="text-fg-faint">كلمة المرور: </span>
            <span className="font-mono tracking-widest text-fg">••••••••</span>
          </div>
          {account.instructions && (
            <div className="sm:col-span-2">
              <span className="text-fg-faint">التعليمات: </span>
              <span className="text-fg">{account.instructions}</span>
            </div>
          )}
          <div className="sm:col-span-2 flex gap-4 text-fg-faint">
            <span>حد الأكواد: {account.max_otp_requests}</span>
            <span>Cooldown: {account.otp_cooldown_seconds}s</span>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountForm({
  products,
  onSubmit,
  onCancel,
  isPending,
}: {
  products: Product[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id ?? "");
  const selectedProductData = products.find((p) => p.id === selectedProduct);
  const handlerType = selectedProductData?.handler_type ?? "normal_account";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="handler_type" value={handlerType} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="المنتج *">
          <select
            name="product_id"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            required
            className="form-input"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>

        <Field label="اسم القاعدة *">
          <input
            name="label"
            required
            placeholder="مثال: Account #1"
            className="form-input"
          />
        </Field>

        {["2fa_account", "steam_guard_account", "email_code_account", "normal_account"].includes(handlerType) && (
          <>
            <Field label="البريد الإلكتروني">
              <input
                name="email"
                type="email"
                placeholder="account@example.com"
                className="form-input"
              />
            </Field>
            <Field label="كلمة المرور">
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                className="form-input"
              />
            </Field>
          </>
        )}

        {handlerType === "2fa_account" && (
          <div className="sm:col-span-2">
            <Field label="TOTP Secret (2FA)">
              <input
                name="totp_secret"
                placeholder="JBSWY3DPEHPK3PXP"
                className="form-input font-mono"
              />
            </Field>
          </div>
        )}

        {handlerType === "steam_guard_account" && (
          <div className="sm:col-span-2">
            <Field label="Steam shared_secret">
              <input
                name="steam_shared_secret"
                placeholder="base64 shared_secret"
                className="form-input font-mono"
              />
            </Field>
          </div>
        )}

        {handlerType === "recharge_card" && (
          <div className="sm:col-span-2">
            <Field label="كود البطاقة">
              <input
                name="card_code"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="form-input font-mono"
              />
            </Field>
          </div>
        )}

        <Field label="الحد الأقصى للاستخدام">
          <input
            name="max_usage"
            type="number"
            min={1}
            defaultValue={1}
            className="form-input"
          />
        </Field>

        <Field label="حد طلبات الكود">
          <input
            name="max_otp_requests"
            type="number"
            min={1}
            defaultValue={10}
            className="form-input"
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="التعليمات">
            <textarea
              name="instructions"
              rows={2}
              placeholder="تعليمات تظهر للعميل عند الاستلام"
              className="form-input resize-none"
            />
          </Field>
        </div>
      </div>

      <DialogFooter>
        <button
          type="submit"
          disabled={isPending}
          className="h-10 px-4 rounded-xl bg-[hsl(222_30%_6%)] text-[hsl(72_86%_62%)] text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "جاري الحفظ..." : "إنشاء"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-4 rounded-xl border border-[hsl(220_18%_14%/0.10)] text-[hsl(222_30%_6%)] text-sm font-semibold hover:bg-[hsl(60_14%_94%)] transition-colors cursor-pointer"
        >
          إلغاء
        </button>
      </DialogFooter>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[hsl(220_8%_30%)]">{label}</label>
      {children}
    </div>
  );
}

function EmptyState({ onAdd, hasProducts }: { onAdd: () => void; hasProducts: boolean }) {
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-12 text-center">
      <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-2 mb-4">
        <Database className="size-6 text-fg-muted" />
      </div>
      <h3 className="font-semibold text-fg mb-1">
        {hasProducts ? "لا توجد حسابات بعد" : "أضف منتجاً أولاً"}
      </h3>
      <p className="text-sm text-fg-muted mb-4">
        {hasProducts
          ? "أضف الحسابات والأكواد التي ستُسلَّم للعملاء."
          : "تحتاج إلى إنشاء منتج قبل إضافة الحسابات."}
      </p>
      {hasProducts && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-accent text-accent-fg text-sm font-semibold hover:bg-accent-hi transition-colors cursor-pointer"
        >
          <Plus className="size-4" />
          إضافة حساب
        </button>
      )}
    </div>
  );
}
