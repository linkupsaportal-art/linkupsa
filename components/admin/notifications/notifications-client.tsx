"use client";

import { useState } from "react";
import {
  Mail,
  MessageCircle,
  CheckCircle2,
  XCircle,
  BellRing,
  Settings,
} from "lucide-react";
import type {
  NotificationChannel,
  NotificationDispatchSummary,
} from "@/lib/db/notifications";
import { WhatsAppConfigDialog } from "./whatsapp-config-dialog";
import { EmailConfigDialog } from "./email-config-dialog";

type ChannelKind = "email" | "whatsapp";

const CHANNEL_META: Record<
  ChannelKind,
  { label: string; icon: React.ElementType; color: string }
> = {
  email: {
    label: "البريد الإلكتروني",
    icon: Mail,
    color: "text-blue-400 bg-blue-400/10",
  },
  whatsapp: {
    label: "واتساب",
    icon: MessageCircle,
    color: "text-emerald-400 bg-emerald-400/10",
  },
};

export function NotificationsClient({
  channels,
  dispatches,
}: {
  channels: NotificationChannel[];
  dispatches: NotificationDispatchSummary[];
}) {
  const [openWhatsApp, setOpenWhatsApp] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);

  const byKind = (k: ChannelKind) => channels.find((c) => c.channel === k);

  return (
    <div className="space-y-6">
      {/* Channels grid */}
      <section>
        <h2 className="text-sm font-bold text-fg-muted mb-3">قنوات التواصل المتاحة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ChannelCard
            kind="whatsapp"
            cfg={byKind("whatsapp")}
            onConfigure={() => setOpenWhatsApp(true)}
          />
          <ChannelCard
            kind="email"
            cfg={byKind("email")}
            onConfigure={() => setOpenEmail(true)}
          />
        </div>
      </section>

      {/* Recent dispatches */}
      <section>
        <h2 className="text-sm font-bold text-fg-muted mb-3">آخر الإشعارات المرسلة</h2>
        {dispatches.length === 0 ? (
          <EmptyDispatches />
        ) : (
          <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-2 border-b border-[hsl(var(--hairline))]">
                  <tr className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                    <th className="text-start px-4 py-3 font-semibold">#الطلب</th>
                    <th className="text-start px-4 py-3 font-semibold">العميل</th>
                    <th className="text-start px-4 py-3 font-semibold">المنتج</th>
                    <th className="text-start px-4 py-3 font-semibold">القنوات</th>
                    <th className="text-start px-4 py-3 font-semibold">الوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--hairline))]">
                  {dispatches.map((d) => (
                    <tr key={d.order_id} className="hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-3 font-num font-semibold text-fg">
                        #{d.order_reference ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-fg">{d.customer_name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-fg">{d.product_name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {d.succeeded.map((c) => (
                            <span
                              key={`s-${c}`}
                              className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/25"
                              title="نجح"
                            >
                              <CheckCircle2 className="size-2.5" />
                              {CHANNEL_META[c as ChannelKind]?.label ?? c}
                            </span>
                          ))}
                          {d.failed.map((f) => (
                            <span
                              key={`f-${f.channel}`}
                              className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25"
                              title={f.error}
                            >
                              <XCircle className="size-2.5" />
                              {CHANNEL_META[f.channel as ChannelKind]?.label ?? f.channel}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-fg-muted font-num" dir="ltr">
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Dialogs */}
      <WhatsAppConfigDialog
        open={openWhatsApp}
        onOpenChange={setOpenWhatsApp}
        initial={(byKind("whatsapp")?.config as Record<string, unknown> | undefined) ?? {}}
        initialEnabled={byKind("whatsapp")?.enabled ?? false}
      />
      <EmailConfigDialog
        open={openEmail}
        onOpenChange={setOpenEmail}
        initial={(byKind("email")?.config as Record<string, unknown> | undefined) ?? {}}
        initialEnabled={byKind("email")?.enabled ?? false}
      />
    </div>
  );
}

/* ─── Channel card ───────────────────────────────────────────────────── */

function ChannelCard({
  kind,
  cfg,
  onConfigure,
}: {
  kind: ChannelKind;
  cfg?: NotificationChannel;
  onConfigure: () => void;
}) {
  const meta = CHANNEL_META[kind];
  const Icon = meta.icon;
  // Email "configured" really means a row exists. We default to enabled by
  // simply having no row at all = not configured. Once the operator opens
  // the dialog and saves, the row turns the card green.
  const configured = !!cfg;
  const enabled = !!cfg?.enabled;

  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-4 flex items-start gap-3">
      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-bold text-fg">{meta.label}</h3>
          <StatusBadge configured={configured} enabled={enabled} />
        </div>
        <p className="text-xs text-fg-muted leading-relaxed mb-3">{describe(kind, cfg)}</p>
        <button
          onClick={onConfigure}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface-2 hover:bg-surface text-fg text-xs font-bold border border-[hsl(var(--hairline-strong))] transition-colors cursor-pointer"
        >
          <Settings className="size-3.5" />
          {configured ? "تعديل الإعدادات" : "إعداد القناة"}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ configured, enabled }: { configured: boolean; enabled: boolean }) {
  if (!configured) {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-fg-faint/15 text-fg-faint border border-fg-faint/25">
        غير معد
      </span>
    );
  }
  if (!enabled) {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
        موقوف
      </span>
    );
  }
  return (
    <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/25">
      مفعّل
    </span>
  );
}

function describe(kind: ChannelKind, cfg?: NotificationChannel): string {
  if (kind === "whatsapp") {
    if (!cfg?.config?.app_token) {
      return "أدخل بيانات حسابك في كرزون شات لتفعيل إشعارات الواتساب التلقائية للعملاء.";
    }
    const tpl = (cfg.config.default_template as string) ?? "—";
    return `قالب التسليم: ${tpl}. يرسل رسالة معتمدة من ميتا فور تنفيذ كل طلب.`;
  }
  // email
  if (!cfg) {
    return "بريد العميل يستلم تأكيد الطلب الجاهز ونفس تنبيه الواتساب — اضغط للتفعيل.";
  }
  const from = (cfg.config?.from as string) || "العنوان الافتراضي";
  return `يرسل من: ${from}. مرآة كاملة لرسائل الواتساب وتنبيهات الحظر.`;
}

function EmptyDispatches() {
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-12 text-center">
      <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-2 mb-4">
        <BellRing className="size-6 text-fg-muted" />
      </div>
      <h3 className="font-semibold text-fg mb-1">لا توجد إشعارات مرسلة بعد</h3>
      <p className="text-sm text-fg-muted">
        ستظهر هنا كل إشعارات الطلبات تلقائياً مع تفاصيل القنوات الناجحة والفاشلة.
      </p>
    </div>
  );
}
