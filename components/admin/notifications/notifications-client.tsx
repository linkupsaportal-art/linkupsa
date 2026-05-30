"use client";

import {
  Mail,
  MessageCircle,
  Smartphone,
  Send,
  CheckCircle2,
  XCircle,
  BellRing,
} from "lucide-react";
import type {
  NotificationChannel,
  NotificationDispatchSummary,
} from "@/lib/db/notifications";

const CHANNEL_META = {
  email: { label: "البريد الإلكتروني", icon: Mail, color: "text-blue-400 bg-blue-400/10" },
  whatsapp: { label: "واتساب", icon: MessageCircle, color: "text-emerald-400 bg-emerald-400/10" },
  sms: { label: "رسائل SMS", icon: Smartphone, color: "text-orange-400 bg-orange-400/10" },
  telegram: { label: "تليجرام", icon: Send, color: "text-sky-400 bg-sky-400/10" },
} as const;

export function NotificationsClient({
  channels,
  dispatches,
}: {
  channels: NotificationChannel[];
  dispatches: NotificationDispatchSummary[];
}) {
  return (
    <div className="space-y-6">
      {/* Channels grid */}
      <section>
        <h2 className="text-sm font-bold text-fg-muted mb-3">قنوات التواصل المتاحة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(["email", "whatsapp", "sms", "telegram"] as const).map((kind) => {
            const cfg = channels.find((c) => c.channel === kind);
            const meta = CHANNEL_META[kind];
            const Icon = meta.icon;
            return (
              <div
                key={kind}
                className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-4 flex items-start gap-3"
              >
                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                  <Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-fg">{meta.label}</h3>
                    <span
                      className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold border ${
                        cfg?.enabled
                          ? "bg-accent/15 text-accent border-accent/25"
                          : "bg-fg-faint/15 text-fg-faint border-fg-faint/25"
                      }`}
                    >
                      {cfg?.enabled ? "مفعّل" : "غير مفعل"}
                    </span>
                  </div>
                  <p className="text-xs text-fg-muted leading-relaxed">{describe(kind, cfg)}</p>
                </div>
              </div>
            );
          })}
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
                              {CHANNEL_META[c as keyof typeof CHANNEL_META]?.label ?? c}
                            </span>
                          ))}
                          {d.failed.map((f) => (
                            <span
                              key={`f-${f.channel}`}
                              className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25"
                              title={f.error}
                            >
                              <XCircle className="size-2.5" />
                              {CHANNEL_META[f.channel as keyof typeof CHANNEL_META]?.label ?? f.channel}
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
    </div>
  );
}

function describe(kind: string, cfg?: NotificationChannel) {
  if (!cfg) return "غير مكوّن — يحتاج إعداد المزود.";
  const provider = (cfg.config?.provider as string) ?? "—";
  switch (kind) {
    case "whatsapp":
      return `المزود: ${provider}. يرسل قالب رسمي معتمد من ميتا عند تنفيذ الطلب.`;
    case "email":
      return "يستخدم Resend مع قالب HTML احترافي. مفعّل افتراضياً لكل المنتجات.";
    case "sms":
      return "بانتظار ربط مزود محلي (Unifonic / Mobily).";
    case "telegram":
      return "بانتظار إعداد Bot Token من BotFather.";
    default:
      return "";
  }
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
