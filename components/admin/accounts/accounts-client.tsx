"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Eye, EyeOff, Database, ShieldCheck, Flame, Pause, Play } from "lucide-react";
import type { Account } from "@/lib/db/accounts";
import type { Product } from "@/lib/db/products";
import { HANDLER_LABELS } from "@/lib/db/products";
import {
  createAccountAction,
  deleteAccountAction,
  updateAccountStatusAction,
} from "@/app/admin/accounts/actions";

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
  const [showAddForm, setShowAddForm] = useState(false);
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
      setShowAddForm(false);
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
      next.has(id) ? next.delete(id) : next.add(id);
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="h-9 px-3 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="all">كل المنتجات ({initialAccounts.length})</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({initialAccounts.filter((a) => a.product_id === p.id).length})
            </option>
          ))}
        </select>
        <button
          onClick={() => { setShowAddForm(true); setError(null); }}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-accent text-accent-fg text-sm font-semibold hover:bg-accent/90 transition-colors"
        >
          <Plus className="size-4" />
          إضافة حساب
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <AccountForm
          products={products}
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
          isPending={isPending}
        />
      )}

      {/* Accounts list */}
      {filtered.length === 0 && !showAddForm ? (
        <EmptyState onAdd={() => setShowAddForm(true)} />
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

          {/* Usage bar */}
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

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleReveal}
            className="p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            title={revealed ? "إخفاء" : "عرض البيانات"}
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>

          {account.status === "active" ? (
            <button
              onClick={() => onStatusChange("paused")}
              disabled={isPending}
              className="p-2 rounded-lg text-fg-muted hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
              title="إيقاف مؤقت"
            >
              <Pause className="size-4" />
            </button>
          ) : account.status === "paused" ? (
            <button
              onClick={() => onStatusChange("active")}
              disabled={isPending}
              className="p-2 rounded-lg text-fg-muted hover:text-accent hover:bg-accent/10 transition-colors"
              title="تفعيل"
            >
              <Play className="size-4" />
            </button>
          ) : null}

          <button
            onClick={onDelete}
            disabled={isPending}
            className="p-2 rounded-lg text-fg-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Revealed credentials */}
      {revealed && (
        <div className="mt-3 pt-3 border-t border-[hsl(var(--hairline))] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <SecretField label="البريد الإلكتروني" value={account.email} />
          <SecretField label="كلمة المرور" value="••••••••" masked />
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

function SecretField({ label, value, masked }: { label: string; value?: string | null; masked?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-fg-faint">{label}: </span>
      <span className={`font-mono ${masked ? "tracking-widest" : ""} text-fg`}>{value}</span>
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
    <form onSubmit={onSubmit} className="rounded-2xl bg-surface-2 border border-[hsl(var(--hairline-strong))] p-4 space-y-3">
      <h3 className="text-sm font-semibold text-fg">حساب جديد</h3>

      <input type="hidden" name="handler_type" value={handlerType} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Product selector */}
        <div className="space-y-1">
          <label className="text-xs text-fg-muted">المنتج *</label>
          <select
            name="product_id"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            required
            className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Label */}
        <div className="space-y-1">
          <label className="text-xs text-fg-muted">اسم القاعدة *</label>
          <input
            name="label"
            required
            placeholder="مثال: Account #1"
            className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Email */}
        {["2fa_account", "steam_guard_account", "email_code_account", "normal_account"].includes(handlerType) && (
          <div className="space-y-1">
            <label className="text-xs text-fg-muted">البريد الإلكتروني</label>
            <input
              name="email"
              type="email"
              placeholder="account@example.com"
              className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}

        {/* Password */}
        {["2fa_account", "steam_guard_account", "email_code_account", "normal_account"].includes(handlerType) && (
          <div className="space-y-1">
            <label className="text-xs text-fg-muted">كلمة المرور</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}

        {/* TOTP Secret */}
        {handlerType === "2fa_account" && (
          <div className="space-y-1">
            <label className="text-xs text-fg-muted">TOTP Secret (2FA)</label>
            <input
              name="totp_secret"
              placeholder="JBSWY3DPEHPK3PXP"
              className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm font-mono text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}

        {/* Steam shared_secret */}
        {handlerType === "steam_guard_account" && (
          <div className="space-y-1">
            <label className="text-xs text-fg-muted">Steam shared_secret</label>
            <input
              name="steam_shared_secret"
              placeholder="base64 shared_secret"
              className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm font-mono text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}

        {/* Card code */}
        {handlerType === "recharge_card" && (
          <div className="space-y-1">
            <label className="text-xs text-fg-muted">كود البطاقة</label>
            <input
              name="card_code"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm font-mono text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}

        {/* Max usage */}
        <div className="space-y-1">
          <label className="text-xs text-fg-muted">الحد الأقصى للاستخدام</label>
          <input
            name="max_usage"
            type="number"
            min={1}
            defaultValue={1}
            className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Max OTP requests */}
        <div className="space-y-1">
          <label className="text-xs text-fg-muted">حد طلبات الكود</label>
          <input
            name="max_otp_requests"
            type="number"
            min={1}
            defaultValue={10}
            className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Instructions */}
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-fg-muted">التعليمات</label>
          <textarea
            name="instructions"
            rows={2}
            placeholder="تعليمات تظهر للعميل عند الاستلام"
            className="w-full px-3 py-2 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="h-9 px-4 rounded-xl bg-accent text-accent-fg text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "جاري الحفظ..." : "حفظ"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-xl text-fg-muted hover:text-fg text-sm transition-colors"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-12 text-center">
      <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-2 mb-4">
        <Database className="size-6 text-fg-muted" />
      </div>
      <h3 className="font-semibold text-fg mb-1">لا توجد حسابات بعد</h3>
      <p className="text-sm text-fg-muted mb-4">أضف الحسابات والأكواد التي ستُسلَّم للعملاء.</p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-accent text-accent-fg text-sm font-semibold hover:bg-accent/90 transition-colors"
      >
        <Plus className="size-4" />
        إضافة حساب
      </button>
    </div>
  );
}
