"use client";

import { Trash2, Eye, Pause, Play, Mail, Pencil } from "lucide-react";
import type { Account } from "@/lib/db/accounts";
import { HANDLER_LABELS } from "@/lib/db/products-types";

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

export function AccountRow({
  account,
  onToggleReveal,
  onDelete,
  onStatusChange,
  onEditEmail,
  onEdit,
  isPending,
}: {
  account: Account;
  onToggleReveal: () => void;
  onDelete: () => void;
  onStatusChange: (s: Account["status"]) => void;
  onEditEmail: () => void;
  onEdit: () => void;
  isPending: boolean;
}) {
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-4 transition-all hover:border-[hsl(var(--hairline-strong))]">
      <div className="flex items-start gap-3 justify-between">
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
            {account.email && <span dir="ltr">{account.email}</span>}
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

        <div className="flex items-center gap-1 shrink-0" dir="ltr">
          <button
            type="button"
            onClick={onToggleReveal}
            className="p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
            title="عرض التفاصيل الكاملة"
            aria-label="عرض التفاصيل الكاملة"
          >
            <Eye className="size-4" />
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="p-2 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
            title="تعديل بيانات الحساب"
            aria-label="تعديل بيانات الحساب"
          >
            <Pencil className="size-4" />
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
