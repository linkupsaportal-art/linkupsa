"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import type { Account } from "@/lib/db/accounts";
import type { Product } from "@/lib/db/products-types";
import { CustomSelect } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

export function EditAccountForm({
  account,
  products,
  onSubmit,
  onCancel,
  isPending,
}: {
  account: Account;
  products: Product[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [selectedProduct, setSelectedProduct] = useState(account.product_id);
  const selectedProductData = products.find((p) => p.id === selectedProduct);
  const handlerType = selectedProductData?.handler_type ?? account.handler_type;

  return (
    <form onSubmit={onSubmit} className="space-y-3" dir="rtl">
      <input type="hidden" name="id" value={account.id} />
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
            defaultValue={account.label}
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
                defaultValue={account.email ?? ""}
                placeholder="account@example.com"
                className="form-input"
              />
            </Field>
            <Field label="كلمة المرور (اتركه فارغاً للإبقاء على الحالية)">
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
            <Field label="TOTP Secret (2FA) (اتركه فارغاً للإبقاء على الحالي)">
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
            <Field label="Steam shared_secret (اتركه فارغاً للإبقاء على الحالي)">
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
            <Field label="كود البطاقة (اتركه فارغاً للإبقاء على الحالي)">
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
            defaultValue={account.max_usage}
            className="form-input"
          />
        </Field>

        <Field label="حد طلبات الكود">
          <input
            name="max_otp_requests"
            type="number"
            min={1}
            defaultValue={account.max_otp_requests}
            className="form-input"
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="التعليمات">
            <textarea
              name="instructions"
              rows={2}
              defaultValue={account.instructions ?? ""}
              placeholder="تعليمات تظهر للعميل عند الاستلام"
              className="form-input resize-none"
            />
          </Field>
        </div>
      </div>

      <DialogFooter className="gap-2 pt-3">
        <button
          type="submit"
          disabled={isPending}
          className="h-10 px-5 rounded-xl bg-[hsl(222_30%_6%)] text-[hsl(72_86%_62%)] text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-5 rounded-xl border border-[hsl(220_18%_14%/0.10)] text-[hsl(222_30%_6%)] text-sm font-semibold hover:bg-[hsl(60_14%_94%)] transition-colors cursor-pointer"
        >
          إلغاء
        </button>
      </DialogFooter>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 text-right">
      <label className="text-xs font-semibold text-[hsl(220_8%_30%)]">{label}</label>
      {children}
    </div>
  );
}
