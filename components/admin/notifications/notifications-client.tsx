"use client";

import { useState } from "react";
import {
  Mail,
  MessageCircle,
  Smartphone,
  Send,
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
import { TelegramConfigDialog } from "./telegram-config-dialog";

type ChannelKind = "email" | "whatsapp" | "sms" | "telegram";

const CHANNEL_META: Record<
  ChannelKind,
  { label: string; icon: React.ElementType; color: string; tone: string }
> = {
  email: {
    label: "البريد الإلكتروني",
    icon: Mail,
    color: "text-blue-400 bg-blue-400/10",
    tone: "blue",
  },
  whatsapp: {
    label: "واتساب",
    icon: MessageCircle,
    color: "text-emerald-400 bg-emerald-400/10",
    tone: "emerald",
  },
  sms: {
    label: "رسائل SMS",
    icon: Smartphone,
    color: "text-orange-400 bg-orange-400/10",
    tone: "orange",
  },
  telegram: {
    label: "تليجرام",
    icon: Send,
    color: "text-sky-400 bg-sky-400/10",
    tone: "sky",
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
  const [openTelegram, setOpenTelegram] = useState(false);

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
            kind="telegram"
            cfg={byKind("telegram")}
            onConfigure={() => setOpenTelegram(true)}
          />
          <ChannelCard kind="email" cfg={byKind("email")} disabled />
          <ChannelCard kind="sms" cfg={byKind("sms")} disabled />
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
      <TelegramConfigDialog
        open={openTelegram}
        onOpenChange={setOpenTelegram}
        initial={(byKind("telegram")?.config as Record<string, unknown> | undefined) ?? {}}
        initialEnabled={byKind("telegram")?.enabled ?? false}
      />
    </div>
  );
}

/* ─── Channel card ───────────────────────────────────────────────────── */

function ChannelCard({
  kind,
  cfg,
  onConfigure,
  disabled,
}: {
  kind: ChannelKind;
  cfg?: NotificationChannel;
  onConfigure?: () => void;
  disabled?: boolean;
}) {
  const meta = CHANNEL_META[kind];
  const Icon = meta.icon;
  const configured = !!cfg && Object.keys(cfg.config ?? {}).length > 0;
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
        {!disabled ? (
          <button
            onClick={onConfigure}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface-2 hover:bg-surface text-fg text-xs font-bold border border-[hsl(var(--hairline-strong))] transition-colors cursor-pointer"
          >
            <Settings className="size-3.5" />
            {configured ? "تعديل الإعدادات" : "إعداد القناة"}
          </button>
        ) : (
          <span className="inline-flex items-center h-8 px-3 rounded-lg bg-surface-2 text-fg-faint text-xs font-bold border border-[hsl(var(--hairline-strong))]">
            قريباً
          </span>
        )}
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
  if (kind === "telegram") {
    if (!cfg?.config?.bot_token) {
      return "أنشئ بوت من BotFather واربطه هنا لاستقبال نسخة من كل طلب وكل حظر.";
    }
    return "متصل ببوت تيليجرام. كل طلب وكل حظر يصل لك مباشرة على المحادثة.";
  }
  if (kind === "email") return "يستخدم Resend مع قالب HTML احترافي. مفعّل افتراضياً لكل المنتجات.";
  if (kind === "sms") return "بانتظار ربط مزود محلي (Unifonic / Mobily).";
  return "";
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
