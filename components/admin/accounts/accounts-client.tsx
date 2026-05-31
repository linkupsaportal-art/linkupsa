"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Eye, EyeOff, Database, Pause, Play, Package, AlertTriangle, Key, Lock, Mail, FileText, CreditCard, Gamepad2, RefreshCw, Check, Copy } from "lucide-react";
import type { Account } from "@/lib/db/accounts";
import type { Product } from "@/lib/db/products-types";
import { HANDLER_LABELS } from "@/lib/db/products-types";
import { CustomSelect } from "@/components/ui/select";
import {
  createAccountAction,
  deleteAccountAction,
  updateAccountStatusAction,
  revealAccountSecretsAction,
  updateAccountEmailConfigAction,
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

  // Modern UI states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewAccountDetails, setViewAccountDetails] = useState<Account | null>(null);
  const [viewSecrets, setViewSecrets] = useState<{ password?: string | null; totpSecret?: string | null; steamSharedSecret?: string | null; cardCode?: string | null } | null>(null);
  const [loadingSecrets, setLoadingSecrets] = useState(false);
  const [editEmailAccount, setEditEmailAccount] = useState<Account | null>(null);

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

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;
    startTransition(async () => {
      const res = await deleteAccountAction(deleteTargetId);
      if (res?.error) { setError(res.error); return; }
      setDeleteTargetId(null);
      refresh();
    });
  }

  async function handleViewDetails(account: Account) {
    setViewAccountDetails(account);
    setLoadingSecrets(true);
    setViewSecrets(null);
    try {
      const res = await revealAccountSecretsAction(account.id);
      if ("error" in res) {
        setError(res.error ?? "حدث خطأ أثناء تحميل البيانات");
      } else {
        setViewSecrets(res);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingSecrets(false);
    }
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
        <CustomSelect
          value={filterProduct}
          onChange={setFilterProduct}
          options={[
            { value: "all", label: `كل المنتجات (${initialAccounts.length})`, icon: <Package className="size-4" /> },
            ...products.map((p) => ({
              value: p.id,
              label: `${p.name} (${initialAccounts.filter((a) => a.product_id === p.id).length})`,
              icon: <Package className="size-4" />,
            })),
          ]}
          className="max-w-xs"
        />
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
              onToggleReveal={() => handleViewDetails(account)}
              onDelete={() => setDeleteTargetId(account.id)}
              onStatusChange={(s) => handleStatusChange(account.id, s)}
              onEditEmail={() => setEditEmailAccount(account)}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Modern UI Delete Dialog */}
      <Dialog open={!!deleteTargetId} onOpenChange={(o) => !o && setDeleteTargetId(null)}>        <DialogContent className="max-w-md">
          <DialogHeader dir="rtl">
            <div className="flex items-center gap-3 text-red-500 mb-2">
              <div className="size-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="size-5" />
              </div>
              <DialogTitle>تأكيد حذف الحساب</DialogTitle>
            </div>
            <DialogDescription className="text-right leading-relaxed text-sm">
              هل أنت متأكد تماماً من رغبتك في حذف هذا الحساب؟ هذا الإجراء سيقوم بإزالة الحساب نهائياً من قاعدة البيانات ولا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 flex-row-reverse">
            <button
              type="button"
              disabled={isPending}
              onClick={handleConfirmDelete}
              className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? "جاري الحذف..." : "حذف نهائي"}
            </button>
            <button
              type="button"
              onClick={() => setDeleteTargetId(null)}
              className="h-10 px-4 rounded-xl border border-[hsl(220_18%_14%/0.10)] text-[hsl(222_30%_6%)] text-sm font-semibold hover:bg-[hsl(60_14%_94%)] transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modern UI View Details Dialog */}
      <Dialog open={!!viewAccountDetails} onOpenChange={(o) => !o && setViewAccountDetails(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader dir="rtl">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-accent/20 flex items-center justify-center text-accent-fg">
                <Database className="size-5" />
              </div>
              <DialogTitle>تفاصيل الحساب الكاملة</DialogTitle>
            </div>
            <DialogDescription className="text-right text-xs">
              بيانات الحساب والمخزون الحالية المسترجعة بأمان من قاعدة البيانات.
            </DialogDescription>
          </DialogHeader>

          {viewAccountDetails && (
            <div className="space-y-4 my-4 text-right" dir="rtl">
              {/* Account basic info */}
              <div className="grid grid-cols-2 gap-3 bg-[hsl(200_14%_97%)] p-4 rounded-2xl border border-[hsl(220_18%_14%/0.08)]">
                <div>
                  <div className="text-[10px] font-bold text-fg-faint uppercase">اسم الحساب (Label)</div>
                  <div className="text-sm font-extrabold text-fg">{viewAccountDetails.label}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-fg-faint uppercase">نوع التسليم</div>
                  <div className="text-sm font-extrabold text-fg">{HANDLER_LABELS[viewAccountDetails.handler_type]}</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-[hsl(var(--hairline-strong))] flex items-center justify-between text-xs">
                  <span className="text-fg-muted font-bold">معدل الاستخدام الفعلي:</span>
                  <span className="font-num font-extrabold text-fg">{viewAccountDetails.current_usage} / {viewAccountDetails.max_usage}</span>
                </div>
              </div>

              {/* Decrypted credentials */}
              <div className="space-y-3">
                {viewAccountDetails.email && (
                  <CredentialRow label="البريد الإلكتروني / اسم الدخول" value={viewAccountDetails.email} icon={<Mail className="size-4" />} />
                )}

                {loadingSecrets ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 bg-[hsl(200_14%_97%)] rounded-2xl border border-[hsl(220_18%_14%/0.08)]">
                    <RefreshCw className="size-6 text-accent animate-spin" />
                    <span className="text-xs font-bold text-fg-muted">جاري فك تشفير البيانات الحساسة بأمان...</span>
                  </div>
                ) : viewSecrets ? (
                  <>
                    {viewSecrets.password && (
                      <CredentialRow label="كلمة المرور" value={viewSecrets.password} icon={<Lock className="size-4" />} isPassword />
                    )}
                    {viewSecrets.totpSecret && (
                      <CredentialRow label="TOTP Secret (2FA)" value={viewSecrets.totpSecret} icon={<Key className="size-4" />} />
                    )}
                    {viewSecrets.steamSharedSecret && (
                      <CredentialRow label="Steam Shared Secret" value={viewSecrets.steamSharedSecret} icon={<Gamepad2 className="size-4" />} />
                    )}
                    {viewSecrets.cardCode && (
                      <CredentialRow label="كود البطاقة الرقمية" value={viewSecrets.cardCode} icon={<CreditCard className="size-4" />} />
                    )}
                  </>
                ) : (
                  <div className="text-xs text-danger font-semibold bg-danger/10 border border-danger/20 p-3.5 rounded-xl">
                    حدث خطأ أثناء محاولة استرجاع البيانات الحساسة.
                  </div>
                )}
              </div>

              {/* Instructions */}
              {viewAccountDetails.instructions && (
                <div className="bg-[hsl(200_14%_97%)] p-4 rounded-2xl border border-[hsl(220_18%_14%/0.08)] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-fg-faint uppercase">
                    <FileText className="size-4" />
                    تعليمات الاستخدام للعميل
                  </div>
                  <div className="text-xs font-semibold text-fg leading-relaxed whitespace-pre-wrap">{viewAccountDetails.instructions}</div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setViewAccountDetails(null)}
              className="h-10 px-5 rounded-xl bg-[hsl(222_30%_6%)] text-[hsl(72_86%_62%)] text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer w-full"
            >
              إغلاق نافذة البيانات
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Edit IMAP settings for email-code accounts */}
      <Dialog open={!!editEmailAccount} onOpenChange={(o) => !o && setEditEmailAccount(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل إعدادات البريد (IMAP)</DialogTitle>
            <DialogDescription>
              حدّث بيانات قراءة كود الإيميل لهذا الحساب. اترك كلمة مرور التطبيق فارغة للإبقاء على الحالية.
            </DialogDescription>
          </DialogHeader>
          {editEmailAccount && (
            <EditEmailForm
              account={editEmailAccount}
              onDone={() => { setEditEmailAccount(null); refresh(); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


function AccountRow({
  account,
  onToggleReveal,
  onDelete,
  onStatusChange,
  onEditEmail,
  isPending,
}: {
  account: Account;
  onToggleReveal: () => void;
  onDelete: () => void;
  onStatusChange: (s: Account["status"]) => void;
  onEditEmail: () => void;
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
            title="عرض التفاصيل الكاملة"
            aria-label="عرض التفاصيل الكاملة"
          >
            <Eye className="size-4" />
          </button>

          {account.handler_type === "email_code_account" && (
            <button
              type="button"
              onClick={onEditEmail}
              className="p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
              title="تعديل إعدادات البريد (IMAP)"
              aria-label="تعديل إعدادات البريد"
            >
              <Mail className="size-4" />
            </button>
          )}

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
    </div>
  );
}

function CredentialRow({
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
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
      </div>
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
          <CustomSelect
            name="product_id"
            value={selectedProduct}
            onChange={setSelectedProduct}
            options={products.map((p) => ({
              value: p.id,
              label: p.name,
              icon: <Package className="size-4" />,
            }))}
            disabled={isPending}
          />
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

        {handlerType === "email_code_account" && (
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-[hsl(200_14%_97%)] border border-[hsl(220_18%_14%/0.08)] p-4">
            <div className="sm:col-span-2">
              <p className="text-[11px] font-bold text-fg-muted mb-1">
                إعدادات بريد الحساب (IMAP) — لقراءة كود التحقق تلقائياً
              </p>
              <p className="text-[10px] text-fg-faint leading-relaxed">
                لجيميل: المضيف <code className="font-mono">imap.gmail.com</code> والمنفذ <code className="font-mono">993</code>،
                وكلمة المرور يجب أن تكون «App Password» (16 حرف) وليست كلمة مرور الحساب.
              </p>
            </div>
            <Field label="IMAP Host">
              <input name="imap_host" placeholder="imap.gmail.com" className="form-input font-mono" dir="ltr" />
            </Field>
            <Field label="Port">
              <input name="imap_port" type="number" defaultValue={993} className="form-input font-mono" dir="ltr" />
            </Field>
            <Field label="البريد (User)">
              <input name="imap_user" placeholder="account@gmail.com" className="form-input font-mono" dir="ltr" />
            </Field>
            <Field label="App Password">
              <input name="imap_password" type="password" placeholder="xxxx xxxx xxxx xxxx" className="form-input font-mono" dir="ltr" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="فلتر المُرسِل (اختياري)">
                <input name="imap_from" placeholder="netflix.com" className="form-input font-mono" dir="ltr" />
              </Field>
            </div>
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

function EditEmailForm({
  account,
  onDone,
}: {
  account: Account;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function submit(formData: FormData) {
    formData.set("account_id", account.id);
    setMsg(null);
    startTransition(async () => {
      const res = await updateAccountEmailConfigAction(formData);
      if (res && "error" in res && res.error) {
        setMsg(res.error);
      } else {
        onDone();
      }
    });
  }

  return (
    <form action={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs font-bold text-fg-muted mb-1.5">IMAP Host</span>
          <input name="imap_host" defaultValue="imap.gmail.com" placeholder="imap.gmail.com" className="form-input font-mono" dir="ltr" required />
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-fg-muted mb-1.5">Port</span>
          <input name="imap_port" type="number" defaultValue={993} className="form-input font-mono" dir="ltr" />
        </label>
        <label className="block sm:col-span-2">
          <span className="block text-xs font-bold text-fg-muted mb-1.5">البريد (User)</span>
          <input name="imap_user" defaultValue={account.email ?? ""} placeholder="account@gmail.com" className="form-input font-mono" dir="ltr" required />
        </label>
        <label className="block sm:col-span-2">
          <span className="block text-xs font-bold text-fg-muted mb-1.5">App Password (اتركه فارغاً للإبقاء على الحالي)</span>
          <input name="imap_password" type="password" placeholder="••••••••••••••••" className="form-input font-mono" dir="ltr" />
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-fg-muted mb-1.5">فلتر المُرسِل (اختياري)</span>
          <input name="imap_from" placeholder="netflix.com" className="form-input font-mono" dir="ltr" />
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-fg-muted mb-1.5">نمط الكود Regex (اختياري)</span>
          <input name="imap_code_regex" placeholder="\\b(\\d{4,8})\\b" className="form-input font-mono" dir="ltr" />
        </label>
      </div>
      {msg && <p className="text-xs text-danger font-semibold">{msg}</p>}
      <DialogFooter>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-accent text-accent-fg text-sm font-bold hover:bg-accent-hi disabled:opacity-50"
        >
          {pending && <RefreshCw className="size-4 animate-spin" />}
          حفظ الإعدادات
        </button>
      </DialogFooter>
    </form>
  );
}
