"use client";

import { useState } from "react";
import {
  Mail,
  CheckCircle2,
  XCircle,
  Settings,
  Shield,
  Globe,
  KeyRound,
  AtSign,
  Reply,
  Info,
} from "lucide-react";
import type {
  NotificationChannel,
  NotificationDispatchSummary,
} from "@/lib/db/notifications";
import { EmailConfigDialog } from "@/components/admin/notifications/email-config-dialog";

/* ─── Main Component ─────────────────────────────────────────────────── */

export function EmailMessagesClient({
  channel,
  dispatches,
}: {
  channel: NotificationChannel | null;
  dispatches: NotificationDispatchSummary[];
}) {
  const [openConfig, setOpenConfig] = useState(false);

  const configured = !!channel;
  const enabled = !!channel?.enabled;
  const cfg = channel?.config as Record<string, unknown> | undefined;

  const from = (cfg?.from as string | undefined) ?? "—";
  const domain = (cfg?.verified_domain as string | undefined) ?? "—";
  const replyTo = (cfg?.reply_to as string | undefined) ?? "—";
  const hasApiKey = !!(cfg?.api_key as string | undefined);

  return (
    <div className="space-y-6">
      {/* ── Status Hero Card ───────────────────────────────────────── */}
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 border-b border-[hsl(var(--hairline))]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center bg-blue-500/15 text-blue-400 shrink-0">
              <Mail className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-fg text-sm sm:text-base">
                  البريد الإلكتروني — Resend
                </h3>
                <StatusBadge configured={configured} enabled={enabled} />
              </div>
              <p className="text-xs text-fg-muted mt-0.5">
                مرآة كاملة لرسائل الواتساب + تنبيهات الحظر عبر البريد
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpenConfig(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-surface-2 hover:bg-surface text-fg text-xs font-bold border border-[hsl(var(--hairline-strong))] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Settings className="size-3.5" />
            {configured ? "تعديل الإعدادات" : "إعداد القناة"}
          </button>
        </div>

        {/* Config Details */}
        {configured ? (
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <ConfigCard
                icon={<KeyRound className="size-4" />}
                label="مفتاح API"
                value={hasApiKey ? "••••••••" : "افتراضي المنصة"}
                iconColor="text-amber-400 bg-amber-400/10"
              />
              <ConfigCard
                icon={<Globe className="size-4" />}
                label="النطاق الموثّق"
                value={domain}
                iconColor="text-blue-400 bg-blue-400/10"
                mono
              />
              <ConfigCard
                icon={<AtSign className="size-4" />}
                label="عنوان المرسل"
                value={from}
                iconColor="text-emerald-400 bg-emerald-400/10"
                mono
              />
              <ConfigCard
                icon={<Reply className="size-4" />}
                label="عنوان الرد"
                value={replyTo}
                iconColor="text-purple-400 bg-purple-400/10"
                mono
              />
            </div>

            {/* What gets sent */}
            <div className="mt-4 rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-fg-muted leading-relaxed">
                  <strong className="text-fg block mb-1">
                    ماذا يصل العميل عبر البريد؟
                  </strong>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>
                      تأكيد الطلب الجاهز للاستلام مع زر مباشر لصفحة الاستلام.
                    </li>
                    <li>
                      نسخة من تنبيه الحظر إذا تم تقييد رقمه (مع المدة والسبب).
                    </li>
                    <li>
                      دعوات الموظفين الجدد للوحة التحكم (مع الدور الممنوح).
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 text-center">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-2 mb-4">
              <Shield className="size-6 text-fg-muted" />
            </div>
            <h3 className="font-semibold text-fg mb-1">لم يتم الإعداد بعد</h3>
            <p className="text-sm text-fg-muted max-w-md mx-auto">
              أضف مفتاح Resend API لتفعيل إشعارات البريد الإلكتروني
              التلقائية للعملاء.
            </p>
          </div>
        )}
      </div>

      {/* ── Email Templates Preview ────────────────────────────────── */}
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-[hsl(var(--hairline))]">
          <h3 className="text-sm font-bold text-fg">قوالب البريد المتاحة</h3>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TemplateCard
              emoji="✓"
              emojiBg="bg-accent/20"
              title="طلب جاهز للاستلام"
              description="يُرسل تلقائياً عند تنفيذ الطلب — يحتوي رقم الطلب، المنتج، وزر الاستلام."
            />
            <TemplateCard
              emoji="⚠️"
              emojiBg="bg-amber-500/20"
              title="تنبيه حظر الرقم"
              description="يُرسل عند حظر رقم العميل — يوضح السبب ومدة الحظر."
            />
            <TemplateCard
              emoji="👥"
              emojiBg="bg-blue-500/20"
              title="دعوة موظف"
              description="يُرسل عند إضافة موظف جديد — يوضح الدور الممنوح ورابط الدخول."
            />
          </div>
        </div>
      </div>

      {/* ── Dispatch History ────────────────────────────────────────── */}
      <DispatchTable dispatches={dispatches} />

      {/* ── Config Dialog ──────────────────────────────────────────── */}
      <EmailConfigDialog
        open={openConfig}
        onOpenChange={setOpenConfig}
        initial={cfg ?? {}}
        initialEnabled={enabled}
      />
    </div>
  );
}

/* ─── Sub-Components ─────────────────────────────────────────────────── */

function ConfigCard({
  icon,
  label,
  value,
  iconColor,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3 flex items-start gap-2.5">
      <div
        className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-fg-faint font-bold uppercase tracking-wider mb-0.5">
          {label}
        </div>
        <div
          className={`text-sm font-semibold truncate text-fg ${
            mono ? "font-mono text-xs" : ""
          }`}
          dir={mono ? "ltr" : undefined}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  emoji,
  emojiBg,
  title,
  description,
}: {
  emoji: string;
  emojiBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3 sm:p-4">
      <div
        className={`inline-flex size-9 items-center justify-center rounded-xl ${emojiBg} text-lg mb-2.5`}
      >
        {emoji}
      </div>
      <h4 className="font-bold text-fg text-xs sm:text-sm mb-1">{title}</h4>
      <p className="text-[11px] text-fg-muted leading-relaxed">{description}</p>
    </div>
  );
}

function StatusBadge({
  configured,
  enabled,
}: {
  configured: boolean;
  enabled: boolean;
}) {
  if (!configured) {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-fg-faint/15 text-fg-faint border border-fg-faint/25">
        غير معد
      </span>
    );
  }
  if (!enabled) {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-amber-500/15 text-black border border-amber-500/25">
        موقوف
      </span>
    );
  }
  return (
    <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-accent/15 text-black border border-accent/25">
      مفعّل
    </span>
  );
}

function DispatchTable({
  dispatches,
}: {
  dispatches: NotificationDispatchSummary[];
}) {
  if (dispatches.length === 0) {
    return (
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-8 sm:p-12 text-center">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-2 mb-4">
          <Mail className="size-6 text-fg-muted" />
        </div>
        <h3 className="font-semibold text-fg mb-1">
          لا توجد رسائل بريد مرسلة بعد
        </h3>
        <p className="text-sm text-fg-muted">
          ستظهر هنا كل رسائل البريد الإلكتروني المرسلة مع حالة كل رسالة.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-[hsl(var(--hairline))]">
        <h3 className="text-sm font-bold text-fg">آخر رسائل البريد</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-2 border-b border-[hsl(var(--hairline))]">
            <tr className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
              <th className="text-start px-4 py-3 font-semibold">#الطلب</th>
              <th className="text-start px-4 py-3 font-semibold hidden sm:table-cell">
                العميل
              </th>
              <th className="text-start px-4 py-3 font-semibold hidden md:table-cell">
                المنتج
              </th>
              <th className="text-start px-4 py-3 font-semibold">الحالة</th>
              <th className="text-start px-4 py-3 font-semibold">الوقت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--hairline))]">
            {dispatches.map((d) => {
              const succeeded = d.succeeded.includes("email");
              const failed = d.failed.some((f) => f.channel === "email");
              const failError =
                d.failed.find((f) => f.channel === "email")?.error ?? "";

              return (
                <tr
                  key={d.order_id}
                  className="hover:bg-surface-2 transition-colors"
                >
                  <td className="px-4 py-3 font-num font-semibold text-fg">
                    #{d.order_reference ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-fg hidden sm:table-cell">
                    {d.customer_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-fg hidden md:table-cell">
                    {d.product_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {succeeded ? (
                      <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-accent/15 text-black border border-accent/25">
                        <CheckCircle2 className="size-2.5" />
                        نجح
                      </span>
                    ) : failed ? (
                      <span
                        className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25"
                        title={failError}
                      >
                        <XCircle className="size-2.5" />
                        فشل
                      </span>
                    ) : (
                      <span className="text-[10px] text-fg-faint">—</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3 text-xs text-fg-muted font-num"
                    dir="ltr"
                  >
                    {new Date(d.notification_sent_at).toLocaleString("en-US", {
                      year: "2-digit",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
