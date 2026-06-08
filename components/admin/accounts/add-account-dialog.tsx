"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import type { Product } from "@/lib/db/products-types";
import { CustomSelect } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

export function AccountForm({
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
    <form onSubmit={onSubmit} className="space-y-3" dir="rtl">
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
            enableSearch={true}
            addButton={{
              label: "إضافة منتج جديد",
              href: "/admin/products"
            }}
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
      </div>

      <DialogFooter className="gap-2 pt-3">
        <button
          type="submit"
          disabled={isPending}
          className="h-10 px-5 rounded-xl bg-[hsl(222_30%_6%)] text-[hsl(72_86%_62%)] text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "جاري الحفظ..." : "إنشاء"}
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
