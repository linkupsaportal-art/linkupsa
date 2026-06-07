"use client";

import { useState, useTransition } from "react";
import { Plus, Database, AlertTriangle, Package } from "lucide-react";
import type { Account } from "@/lib/db/accounts";
import type { Product } from "@/lib/db/products-types";
import { CustomSelect } from "@/components/ui/select";
import {
  createAccountAction,
  updateAccountAction,
  deleteAccountAction,
  updateAccountStatusAction,
  revealAccountSecretsAction,
} from "@/app/admin/accounts/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Import subcomponents
import { AccountRow } from "./account-row";
import { AccountForm } from "./add-account-dialog";
import { EditAccountForm } from "./edit-account-dialog";
import { ViewDetailsDialog } from "./view-details-dialog";
import { EditEmailForm } from "./edit-email-dialog";

export function AccountsClient({
  initialAccounts,
  products,
}: {
  initialAccounts: Account[];
  products: Product[];
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Modern UI states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewAccountDetails, setViewAccountDetails] = useState<Account | null>(null);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [viewSecrets, setViewSecrets] = useState<{
    password?: string | null;
    totpSecret?: string | null;
    steamSharedSecret?: string | null;
    cardCode?: string | null;
    active2faCode?: string | null;
    active2faExpiresIn?: number | null;
  } | null>(null);
  const [loadingSecrets, setLoadingSecrets] = useState(false);
  const [editEmailAccount, setEditEmailAccount] = useState<Account | null>(null);

  function refresh() {
    window.location.reload();
  }

  const filtered = filterProduct === "all"
    ? initialAccounts
    : initialAccounts.filter((a) => a.product_id === filterProduct);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createAccountAction(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setShowAddDialog(false);
      refresh();
    });
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateAccountAction(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setEditAccount(null);
      refresh();
    });
  }

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;
    startTransition(async () => {
      const res = await deleteAccountAction(deleteTargetId);
      if (res?.error) {
        setError(res.error);
        return;
      }
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

  return (
    <div className="space-y-4" dir="rtl">
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 text-right">
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
              onEdit={() => setEditAccount(account)}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Modern UI Delete Dialog */}
      <Dialog open={!!deleteTargetId} onOpenChange={(o) => !o && setDeleteTargetId(null)}>
        <DialogContent className="max-w-md">
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
        {viewAccountDetails && (
          <ViewDetailsDialog
            account={viewAccountDetails}
            loadingSecrets={loadingSecrets}
            viewSecrets={viewSecrets}
            onRefresh={() => handleViewDetails(viewAccountDetails)}
            onClose={() => setViewAccountDetails(null)}
          />
        )}
      </Dialog>

      {/* Account Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">حساب جديد</DialogTitle>
            <DialogDescription className="text-right">أضف بيانات حساب جديد للمخزون. تُشفّر الحقول الحساسة قبل الحفظ.</DialogDescription>
          </DialogHeader>
          <AccountForm
            products={products}
            onSubmit={handleCreate}
            onCancel={() => setShowAddDialog(false)}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Account Edit Dialog */}
      <Dialog open={!!editAccount} onOpenChange={(o) => !o && setEditAccount(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader dir="rtl">
            <DialogTitle className="text-right">تعديل الحساب</DialogTitle>
            <DialogDescription className="text-right">قم بتعديل بيانات هذا الحساب. اترك حقول كلمة المرور والرموز فارغة للإبقاء على الحالية.</DialogDescription>
          </DialogHeader>
          {editAccount && (
            <EditAccountForm
              account={editAccount}
              products={products}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditAccount(null)}
              isPending={isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit IMAP settings for email-code accounts */}
      <Dialog open={!!editEmailAccount} onOpenChange={(o) => !o && setEditEmailAccount(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader dir="rtl">
            <DialogTitle className="text-right">تعديل إعدادات البريد (IMAP)</DialogTitle>
            <DialogDescription className="text-right">
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

function EmptyState({ onAdd, hasProducts }: { onAdd: () => void; hasProducts: boolean }) {
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-12 text-center" dir="rtl">
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
