"use client";

import { useState } from "react";
import {
  MessageCircle,
  CheckCircle2,
  XCircle,
  Settings,
  Shield,
  Zap,
  Info,
  Smartphone,
  FileText,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type {
  NotificationChannel,
  NotificationDispatchSummary,
} from "@/lib/db/notifications";
import { WhatsAppConfigDialog } from "@/components/admin/notifications/whatsapp-config-dialog";

/* ─── Main Component ─────────────────────────────────────────────────── */

export function WhatsAppMessagesClient({
  channel,
  dispatches,
}: {
  channel: NotificationChannel | null;
  dispatches: NotificationDispatchSummary[];
}) {
  const [activeMode, setActiveMode] = useState<"api" | "standard">("api");
  const [openApiConfig, setOpenApiConfig] = useState(false);

  const apiConfigured = !!channel;
  const apiEnabled = !!channel?.enabled;

  const modes = [
    {
      id: "api" as const,
      label: "واتساب API المؤسسي",
      subtitle: "Enterprise",
      icon: Zap,
      iconBg: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    },
    {
      id: "standard" as const,
      label: "واتساب بزنس العادي",
      subtitle: "Standard",
      icon: Smartphone,
      iconBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              className={`text-start p-4 sm:p-5 rounded-2xl border transition-all duration-150 relative cursor-pointer outline-none select-none flex flex-col justify-between ${
                isActive
                  ? "bg-surface border-accent shadow-[0_4px_20px_rgba(0,0,0,0.05)] ring-1 ring-accent/15"
                  : "bg-surface/50 border-[hsl(var(--hairline))] hover:bg-surface hover:border-[hsl(var(--hairline-strong))]"
              }`}
            >
              {isActive && (
                <div className="absolute top-4 left-4 size-5 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
                  <CheckCircle2 className="size-3" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`size-11 sm:size-12 rounded-xl flex items-center justify-center shrink-0 border ${m.iconBg}`}>
                  <Icon className="size-5 sm:size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-fg text-sm sm:text-base">
                      {m.label}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-fg-faint bg-surface-2 px-2 py-0.5 rounded-full">
                      {m.subtitle}
                    </span>
                  </div>

                  {m.id === "api" ? (
                    <StatusBadge configured={apiConfigured} enabled={apiEnabled} />
                  ) : (
                    <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-amber-500/15 text-black border border-amber-500/25 mt-1">
                      قريباً
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {activeMode === "api" ? (
        <ApiModeContent
          channel={channel}
          configured={apiConfigured}
          enabled={apiEnabled}
          onOpenConfig={() => setOpenApiConfig(true)}
          dispatches={dispatches}
        />
      ) : (
        <StandardModeContent />
      )}

      {/* ── Config Dialog (API) ────────────────────────────────────── */}
      <WhatsAppConfigDialog
        open={openApiConfig}
        onOpenChange={setOpenApiConfig}
        initial={
          (channel?.config as Record<string, unknown> | undefined) ?? {}
        }
        initialEnabled={apiEnabled}
      />
    </div>
  );
}

/* ─── API Mode (Enterprise) Content ──────────────────────────────────── */

function ApiModeContent({
  channel,
  configured,
  enabled,
  onOpenConfig,
  dispatches,
}: {
  channel: NotificationChannel | null;
  configured: boolean;
  enabled: boolean;
  onOpenConfig: () => void;
  dispatches: NotificationDispatchSummary[];
}) {
  const cfg = channel?.config as Record<string, unknown> | undefined;
  const tpl =
    (cfg?.default_template as string | undefined) ?? "order_ready_v1";
  const host =
    (cfg?.host as string | undefined) ?? "akgroup.api.karzoun.chat";
  const storeName = (cfg?.store_name as string | undefined) ?? "—";

  return (
    <div className="space-y-4">
      {/* Enterprise API Warning Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 flex items-start gap-3">
        <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-fg text-sm">تنبيه حول واتساب API المؤسسي (Enterprise)</h4>
          <p className="text-xs text-fg-muted leading-relaxed" dir="rtl">
            لا يمكن بدء المحادثات مع العملاء إلا باستخدام **قوالب رسائل معتمدة من ميتا**. ومع ذلك، إذا قام العميل بإرسال رسالة إليك خلال الـ 24 ساعة الماضية، يمكنك الرد عليه بحرية وبدون استخدام قوالب.
          </p>
          <p className="text-[11px] text-fg-faint leading-relaxed font-mono" dir="ltr">
            ⚠️ WhatsApp Business API (Enterprise): Cannot initiate conversations with customers unless using Meta-approved message templates. However, if the customer has sent a message within the last 24 hours, you can reply using regular free-form messages.
          </p>
        </div>
      </div>

      {/* Config Overview Card */}
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 border-b border-[hsl(var(--hairline))]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center bg-blue-500/15 text-blue-400 shrink-0">
              <Zap className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-fg text-sm sm:text-base">
                واتساب API — كرزون شات
              </h3>
              <p className="text-xs text-fg-muted">
                إرسال إشعارات تلقائية عبر قوالب ميتا المعتمدة
              </p>
            </div>
          </div>
          <button
            onClick={onOpenConfig}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-surface-2 hover:bg-surface text-fg text-xs font-bold border border-[hsl(var(--hairline-strong))] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Settings className="size-3.5" />
            {configured ? "تعديل الإعدادات" : "إعداد القناة"}
          </button>
        </div>

        {/* Config Details Grid */}
        {configured ? (
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <ConfigItem
                label="الحالة"
                value={enabled ? "مفعّل" : "موقوف"}
                valueClass={enabled ? "text-accent" : "text-amber-500"}
              />
              <ConfigItem label="قالب التسليم" value={tpl} mono />
              <ConfigItem label="السيرفر" value={host} mono />
              <ConfigItem label="اسم المتجر" value={storeName} />
            </div>

            {/* How it works */}
            <div className="mt-4 rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-fg-muted leading-relaxed">
                  <strong className="text-fg block mb-1">كيف يعمل؟</strong>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>
                      عند تنفيذ أي طلب، يُرسل قالب{" "}
                      <code className="text-[11px] bg-surface px-1 py-0.5 rounded font-mono">
                        {tpl}
                      </code>{" "}
                      المعتمد من ميتا تلقائياً.
                    </li>
                    <li>
                      إذا رد العميل خلال 24 ساعة، يمكن الرد برسائل حرة بدون
                      قالب.
                    </li>
                    <li>خارج نافذة الـ 24 ساعة، القوالب المعتمدة فقط.</li>
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
              أدخل بيانات حسابك في كرزون شات لتفعيل الإشعارات التلقائية عبر
              واتساب API.
            </p>
          </div>
        )}
      </div>

      {/* Dispatch History */}
      <DispatchTable dispatches={dispatches} />
    </div>
  );
}

/* ─── Standard Mode Content ──────────────────────────────────────────── */

function StandardModeContent() {
  return (
    <div className="space-y-4">
      {/* Feature List Card */}
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[hsl(var(--hairline))]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-400 shrink-0">
              <Smartphone className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-fg text-sm sm:text-base">
                واتساب بزنس العادي
              </h3>
              <p className="text-xs text-fg-muted">
                تواصل مباشر بدون قوالب معتمدة من ميتا
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <FeatureCard
              icon={<MessageCircle className="size-4" />}
              title="محادثات مباشرة"
              description="أرسل رسائل نصية، صور، وملفات مباشرة للعملاء بدون أي قيود على القوالب."
            />
            <FeatureCard
              icon={<FileText className="size-4" />}
              title="بدون قوالب"
              description="لا يتطلب موافقة ميتا على أي قالب — تواصل فوري وحر مع عملائك."
            />
            <FeatureCard
              icon={<Clock className="size-4" />}
              title="بدون نافذة زمنية"
              description="تواصل في أي وقت بدون قيود نافذة الـ 24 ساعة المفروضة على API المؤسسي."
            />
            <FeatureCard
              icon={<Shield className="size-4" />}
              title="إعداد بسيط"
              description="فقط ربط رقم واتساب بزنس العادي — بدون مطورين أو بنية تحتية معقدة."
            />
          </div>

          {/* Coming Soon Banner */}
          <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center bg-emerald-500/20 text-emerald-400 shrink-0">
                <Zap className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-fg text-sm mb-1">
                  قريباً — قيد التطوير
                </h4>
                <p className="text-xs text-fg-muted leading-relaxed">
                  نعمل حالياً على دمج واتساب بزنس العادي في المنصة. سيتيح لك هذا
                  الخيار إرسال رسائل مباشرة لعملائك بدون الحاجة لقوالب ميتا
                  المعتمدة. سنعلمك فور جاهزيته.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared Sub-Components ──────────────────────────────────────────── */

function ConfigItem({
  label,
  value,
  mono,
  valueClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3">
      <div className="text-[11px] text-fg-faint font-bold uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className={`text-sm font-semibold truncate ${valueClass ?? "text-fg"} ${
          mono ? "font-mono text-xs" : ""
        }`}
        dir={mono ? "ltr" : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3 sm:p-4 flex items-start gap-3">
      <div className="size-8 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className="font-bold text-fg text-xs sm:text-sm mb-0.5">
          {title}
        </h4>
        <p className="text-[11px] sm:text-xs text-fg-muted leading-relaxed">
          {description}
        </p>
      </div>
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
      <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-fg-faint/15 text-fg-faint border border-fg-faint/25 mt-1">
        غير معد
      </span>
    );
  }
  if (!enabled) {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-amber-500/15 text-black border border-amber-500/25 mt-1">
        موقوف
      </span>
    );
  }
  return (
    <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-accent/15 text-black border border-accent/25 mt-1">
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
          <MessageCircle className="size-6 text-fg-muted" />
        </div>
        <h3 className="font-semibold text-fg mb-1">
          لا توجد رسائل واتساب مرسلة بعد
        </h3>
        <p className="text-sm text-fg-muted">
          ستظهر هنا كل رسائل الواتساب المرسلة تلقائياً مع حالة كل رسالة.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-[hsl(var(--hairline))]">
        <h3 className="text-sm font-bold text-fg">آخر رسائل الواتساب</h3>
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
              const succeeded = d.succeeded.includes("whatsapp");
              const failed = d.failed.some((f) => f.channel === "whatsapp");
              const failError =
                d.failed.find((f) => f.channel === "whatsapp")?.error ?? "";

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
