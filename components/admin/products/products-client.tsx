"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, ToggleLeft, ToggleRight, Package } from "lucide-react";
import { type Product, type HandlerType, HANDLER_LABELS } from "@/lib/db/products-types";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductStatusAction,
  addProductOptionAction,
  deleteProductOptionAction,
} from "@/app/admin/products/actions";

const HANDLER_TYPES: HandlerType[] = [
  "2fa_account",
  "steam_guard_account",
  "email_code_account",
  "normal_account",
  "recharge_card",
  "digital_file",
];

export function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOptionFor, setAddOptionFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    // Re-fetch by navigating — Next.js revalidatePath handles this
    window.location.reload();
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createProductAction(fd);
      if (res?.error) { setError(res.error); return; }
      setShowAddForm(false);
      refresh();
    });
  }

  async function handleUpdate(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateProductAction(id, fd);
      if (res?.error) { setError(res.error); return; }
      setEditingId(null);
      refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا المنتج؟ لا يمكن التراجع.")) return;
    startTransition(async () => {
      const res = await deleteProductAction(id);
      if (res?.error) { setError(res.error); return; }
      refresh();
    });
  }

  async function handleToggle(id: string, current: "active" | "inactive") {
    startTransition(async () => {
      await toggleProductStatusAction(id, current === "active" ? "inactive" : "active");
      refresh();
    });
  }

  async function handleAddOption(productId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addProductOptionAction(productId, fd);
      if (res?.error) { setError(res.error); return; }
      setAddOptionFor(null);
      refresh();
    });
  }

  async function handleDeleteOption(id: string) {
    if (!confirm("حذف هذا الخيار؟")) return;
    startTransition(async () => {
      await deleteProductOptionAction(id);
      refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Add product button */}
      <div className="flex justify-end">
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); setError(null); }}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-accent text-accent-fg text-sm font-semibold hover:bg-accent/90 transition-colors"
        >
          <Plus className="size-4" />
          إضافة منتج
        </button>
      </div>

      {/* Add product form */}
      {showAddForm && (
        <ProductForm
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
          isPending={isPending}
        />
      )}

      {/* Products list */}
      {products.length === 0 && !showAddForm ? (
        <EmptyState onAdd={() => setShowAddForm(true)} />
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
              {/* Product row */}
              {editingId === product.id ? (
                <div className="p-4">
                  <ProductForm
                    product={product}
                    onSubmit={(e) => handleUpdate(product.id, e)}
                    onCancel={() => setEditingId(null)}
                    isPending={isPending}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4">
                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                    className="text-fg-muted hover:text-fg transition-colors"
                  >
                    {expandedId === product.id
                      ? <ChevronDown className="size-4" />
                      : <ChevronRight className="size-4" />}
                  </button>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-fg truncate">{product.name}</span>
                      {product.name_ar && (
                        <span className="text-xs text-fg-muted">{product.name_ar}</span>
                      )}
                      <HandlerBadge type={product.handler_type} />
                      <StatusBadge status={product.status} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-fg-muted">
                      <span>{product.options?.length ?? 0} خيار</span>
                      {product.salla_product_id && (
                        <span>Salla #{product.salla_product_id}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggle(product.id, product.status)}
                      disabled={isPending}
                      className="p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
                      title={product.status === "active" ? "إيقاف" : "تفعيل"}
                    >
                      {product.status === "active"
                        ? <ToggleRight className="size-4 text-accent" />
                        : <ToggleLeft className="size-4" />}
                    </button>
                    <button
                      onClick={() => { setEditingId(product.id); setExpandedId(null); }}
                      className="p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={isPending}
                      className="p-2 rounded-lg text-fg-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Options panel */}
              {expandedId === product.id && editingId !== product.id && (
                <div className="border-t border-[hsl(var(--hairline))] bg-surface-2 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">الخيارات</span>
                    <button
                      onClick={() => setAddOptionFor(addOptionFor === product.id ? null : product.id)}
                      className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-semibold"
                    >
                      <Plus className="size-3" />
                      إضافة خيار
                    </button>
                  </div>

                  {/* Add option form */}
                  {addOptionFor === product.id && (
                    <form onSubmit={(e) => handleAddOption(product.id, e)} className="flex flex-wrap gap-2 mb-3">
                      <input
                        name="name"
                        placeholder="الاسم (مثال: شهر)"
                        required
                        className="h-8 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <input
                        name="name_ar"
                        placeholder="الاسم بالعربي (اختياري)"
                        className="h-8 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <input
                        name="salla_option_value"
                        placeholder="قيمة خيار سلة (اختياري)"
                        className="h-8 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="h-8 px-3 rounded-lg bg-accent text-accent-fg text-xs font-semibold hover:bg-accent/90 transition-colors"
                      >
                        حفظ
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddOptionFor(null)}
                        className="h-8 px-3 rounded-lg text-fg-muted hover:text-fg text-xs"
                      >
                        إلغاء
                      </button>
                    </form>
                  )}

                  {/* Options list */}
                  {(product.options?.length ?? 0) === 0 ? (
                    <p className="text-xs text-fg-faint py-2">لا توجد خيارات بعد.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {product.options?.map((opt) => (
                        <div
                          key={opt.id}
                          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-surface border border-[hsl(var(--hairline-strong))] text-xs text-fg"
                        >
                          <span>{opt.name}</span>
                          {opt.salla_option_value && (
                            <span className="text-fg-faint">({opt.salla_option_value})</span>
                          )}
                          <button
                            onClick={() => handleDeleteOption(opt.id)}
                            className="text-fg-faint hover:text-red-400 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductForm({
  product,
  onSubmit,
  onCancel,
  isPending,
}: {
  product?: Product;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-surface-2 border border-[hsl(var(--hairline-strong))] p-4 space-y-3">
      <h3 className="text-sm font-semibold text-fg mb-3">
        {product ? "تعديل المنتج" : "منتج جديد"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-fg-muted">الاسم *</label>
          <input
            name="name"
            defaultValue={product?.name}
            required
            placeholder="مثال: ChatGPT Plus"
            className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-fg-muted">الاسم بالعربي</label>
          <input
            name="name_ar"
            defaultValue={product?.name_ar ?? ""}
            placeholder="اختياري"
            className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-fg-muted">نوع التسليم *</label>
          <select
            name="handler_type"
            defaultValue={product?.handler_type ?? "normal_account"}
            required
            className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {HANDLER_TYPES.map((t) => (
              <option key={t} value={t}>{HANDLER_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-fg-muted">رقم منتج سلة</label>
          <input
            name="salla_product_id"
            type="number"
            defaultValue={product?.salla_product_id ?? ""}
            placeholder="اختياري — للربط التلقائي"
            className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        {product && (
          <div className="space-y-1">
            <label className="text-xs text-fg-muted">الحالة</label>
            <select
              name="status"
              defaultValue={product.status}
              className="w-full h-9 px-3 rounded-lg bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="active">نشط</option>
              <option value="inactive">موقوف</option>
            </select>
          </div>
        )}
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs text-fg-muted">الوصف</label>
          <textarea
            name="description"
            defaultValue={product?.description ?? ""}
            rows={2}
            placeholder="وصف اختياري"
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

function HandlerBadge({ type }: { type: HandlerType }) {
  const colors: Record<HandlerType, string> = {
    "2fa_account": "bg-purple-500/15 text-purple-400",
    steam_guard_account: "bg-blue-500/15 text-blue-400",
    email_code_account: "bg-yellow-500/15 text-yellow-400",
    normal_account: "bg-green-500/15 text-green-400",
    recharge_card: "bg-orange-500/15 text-orange-400",
    digital_file: "bg-pink-500/15 text-pink-400",
  };
  return (
    <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold ${colors[type]}`}>
      {HANDLER_LABELS[type]}
    </span>
  );
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold ${
      status === "active"
        ? "bg-accent/15 text-accent"
        : "bg-fg-faint/15 text-fg-faint"
    }`}>
      {status === "active" ? "نشط" : "موقوف"}
    </span>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-12 text-center">
      <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-2 mb-4">
        <Package className="size-6 text-fg-muted" />
      </div>
      <h3 className="font-semibold text-fg mb-1">لا توجد منتجات بعد</h3>
      <p className="text-sm text-fg-muted mb-4">أضف منتجك الأول لبدء تسليم الطلبات تلقائياً.</p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-accent text-accent-fg text-sm font-semibold hover:bg-accent/90 transition-colors"
      >
        <Plus className="size-4" />
        إضافة منتج
      </button>
    </div>
  );
}
