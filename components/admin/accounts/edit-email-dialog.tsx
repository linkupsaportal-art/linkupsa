"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import type { Account } from "@/lib/db/accounts";
import { updateAccountEmailConfigAction } from "@/app/admin/accounts/actions";
import { DialogFooter } from "@/components/ui/dialog";

export function EditEmailForm({
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
    <form action={submit} className="space-y-3" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
        <label className="block text-right">
          <span className="block text-xs font-bold text-fg-muted mb-1.5">IMAP Host</span>
          <input name="imap_host" defaultValue="imap.gmail.com" placeholder="imap.gmail.com" className="form-input font-mono" dir="ltr" required />
        </label>
        <label className="block text-right">
          <span className="block text-xs font-bold text-fg-muted mb-1.5">Port</span>
          <input name="imap_port" type="number" defaultValue={993} className="form-input font-mono" dir="ltr" />
        </label>
        <label className="block sm:col-span-2 text-right">
          <span className="block text-xs font-bold text-fg-muted mb-1.5">البريد (User)</span>
          <input name="imap_user" defaultValue={account.email ?? ""} placeholder="account@gmail.com" className="form-input font-mono" dir="ltr" required />
        </label>
        <label className="block sm:col-span-2 text-right">
          <span className="block text-xs font-bold text-fg-muted mb-1.5">App Password (اتركه فارغاً للإبقاء على الحالي)</span>
          <input name="imap_password" type="password" placeholder="••••••••••••••••" className="form-input font-mono" dir="ltr" />
        </label>
        <label className="block text-right">
          <span className="block text-xs font-bold text-fg-muted mb-1.5">فلتر المُرسِل (اختياري)</span>
          <input name="imap_from" placeholder="netflix.com" className="form-input font-mono" dir="ltr" />
        </label>
        <label className="block text-right">
          <span className="block text-xs font-bold text-fg-muted mb-1.5">نمط الكود Regex (اختياري)</span>
          <input name="imap_code_regex" placeholder="\\b(\\d{4,8})\\b" className="form-input font-mono" dir="ltr" />
        </label>
      </div>
      {msg && <p className="text-xs text-danger font-semibold text-right">{msg}</p>}
      <DialogFooter className="pt-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-accent text-accent-fg text-sm font-bold hover:bg-accent-hi disabled:opacity-50 cursor-pointer"
        >
          {pending && <RefreshCw className="size-4 animate-spin" />}
          حفظ الإعدادات
        </button>
      </DialogFooter>
    </form>
  );
}
