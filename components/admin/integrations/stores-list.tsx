"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Check,
  Globe,
  Store as StoreIcon,
  Webhook,
  Zap,
  ZapOff,
  ExternalLink,
  Activity,
  ShieldCheck,
  FileCode2,
  Clock,
} from "lucide-react";
import type { ConnectedStore } from "@/app/admin/integrations/page";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Webhook endpoint URL shown to the user. */
const WEBHOOK_URL = "https://www.portaliosa.com/api/salla/webhook";

/** Event types the webhook expects from Salla. */
const REQUIRED_EVENTS = [
  { name: "invoice.created", desc: "فاتورة جديدة — المعالجة الأساسية" },
  { name: "order.created", desc: "طلب جديد — تسليم تلقائي" },
];

const OPTIONAL_EVENTS = [
  { name: "order.updated", desc: "تحديث حالة طلب" },
  { name: "order.cancelled", desc: "إلغاء طلب" },
  { name: "order.refunded", desc: "استرجاع طلب" },
];

/* ------------------------------------------------------------------ */
/*  Main List                                                          */
/* ------------------------------------------------------------------ */

export function StoresList({ stores }: { stores: ConnectedStore[] }) {
  if (stores.length === 0) {
    return (
      <p className="text-sm text-fg-muted text-center py-6">لا توجد متاجر مربوطة.</p>
    );
  }
  return (
    <div className="space-y-3">
      {stores.map((s) => (
        <StoreRow key={s.store_id} store={s} />
      ))}

      {/* Global webhook setup guide */}
      <WebhookSetupGuide />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Store Row                                                          */
/* ------------------------------------------------------------------ */

function StoreRow({ store }: { store: ConnectedStore }) {
  const installedAt = new Date(store.installed_at).toLocaleDateString("en-US", {
    year: "2-digit",
    month: "short",
    day: "numeric",
  });

  const lastEventLabel = store.last_event_at
    ? new Date(store.last_event_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : null;

  return (
    <div className="p-3 sm:p-4 rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="size-9 sm:size-10 rounded-xl bg-surface border border-[hsl(var(--hairline))] flex items-center justify-center shrink-0 overflow-hidden">
            {store.store_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.store_logo_url}
                alt={store.store_name ?? "store logo"}
                width={40}
                height={40}
                className="object-cover size-full"
              />
            ) : (
              <StoreIcon className="size-4 sm:size-5 text-fg-muted" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs sm:text-sm text-fg truncate">
              {store.store_name ?? "متجر بدون اسم"}
            </div>
            <div className="text-[10px] sm:text-[11px] text-fg-muted font-num mt-0.5" dir="ltr">
              ID: {store.store_id} · منذ {installedAt}
            </div>
          </div>
        </div>

        {/* Webhook status badge */}
        {store.webhook_active ? (
          <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
            <Zap className="size-2.5" />
            ويب هوك فعّال
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[9px] sm:text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
            <ZapOff className="size-2.5" />
            غير مفعّل
          </span>
        )}
      </div>

      {/* Info chips — store URL + event stats */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] sm:text-[11px] text-fg-muted">
        {store.store_url && (
          <a
            href={store.store_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-bold text-accent hover:underline"
            dir="ltr"
          >
            <Globe className="size-3" />
            {store.store_domain ?? store.store_url}
            <ExternalLink className="size-2.5 opacity-60" />
          </a>
        )}

        {store.events_7d > 0 && (
          <span className="inline-flex items-center gap-1 font-num">
            <Activity className="size-3 text-fg-faint" />
            {store.events_7d} حدث (7 أيام)
          </span>
        )}

        {lastEventLabel && (
          <span className="inline-flex items-center gap-1 font-num">
            <Clock className="size-3 text-fg-faint" />
            آخر حدث: <span dir="ltr">{lastEventLabel}</span>
          </span>
        )}

        {!store.webhook_active && store.events_7d === 0 && (
          <span className="text-red-400 font-semibold">
            لم يُستقبل أي حدث — تأكد من إعداد الويب هوك في سلة
          </span>
        )}

        {!store.webhook_active && store.events_7d > 0 && (
          <span className="text-amber-500 font-semibold">
            لم تصل أحداث في آخر 48 ساعة — الويب هوك قد يكون معطّل
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Webhook Setup Guide — full config reference                        */
/* ------------------------------------------------------------------ */

function WebhookSetupGuide() {
  return (
    <div className="mt-4 p-3 sm:p-4 rounded-xl border border-dashed border-[hsl(var(--hairline-strong))] bg-surface/50 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Webhook className="size-4 text-accent" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-fg">إعداد الويب هوك في سلة</h4>
          <p className="text-[10px] sm:text-[11px] text-fg-muted">
            المعلومات اللازمة لربط متجرك
          </p>
        </div>
      </div>

      {/* Webhook URL */}
      <ConfigField
        icon={<Globe className="size-3.5 text-accent" />}
        label="رابط الويب هوك (URL)"
        value={WEBHOOK_URL}
        copyable
      />

      {/* Security header */}
      <ConfigField
        icon={<ShieldCheck className="size-3.5 text-accent" />}
        label="طريقة التحقق (Security)"
        value="Token — يُضاف في إعدادات Headers بسلة"
        hint="في سلة: أضف Custom Header باسم authorization وقيمته التوكن المتفق عليه"
      />

      {/* Required Events */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.12em] text-fg-faint">
          <FileCode2 className="size-3" />
          الأحداث المطلوبة (Events)
        </div>
        <div className="grid gap-1.5">
          {REQUIRED_EVENTS.map((ev) => (
            <div
              key={ev.name}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface border border-[hsl(var(--hairline))]"
            >
              <CheckCircle2 className="size-3 text-accent shrink-0" />
              <code className="text-[10px] sm:text-[11px] font-num font-bold text-fg" dir="ltr">
                {ev.name}
              </code>
              <span className="text-[9px] sm:text-[10px] text-fg-muted">— {ev.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Events */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.12em] text-fg-faint">
          <FileCode2 className="size-3" />
          أحداث اختيارية
        </div>
        <div className="grid gap-1.5">
          {OPTIONAL_EVENTS.map((ev) => (
            <div
              key={ev.name}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface border border-[hsl(var(--hairline))] opacity-70"
            >
              <span className="size-3 rounded-full border border-[hsl(var(--hairline-strong))] shrink-0" />
              <code className="text-[10px] sm:text-[11px] font-num font-bold text-fg" dir="ltr">
                {ev.name}
              </code>
              <span className="text-[9px] sm:text-[10px] text-fg-muted">— {ev.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step-by-step */}
      <div className="border-t border-[hsl(var(--hairline))] pt-3 mt-3">
        <p className="text-[10px] sm:text-[11px] font-bold text-fg-faint uppercase tracking-widest mb-2">
          خطوات الإعداد
        </p>
        <ol className="text-[10px] sm:text-[11px] text-fg-muted space-y-1.5 ps-4 list-decimal leading-relaxed">
          <li>افتح لوحة تحكم سلة → <span className="font-bold text-fg">الإعدادات → Webhooks</span></li>
          <li>اضغط <span className="font-bold text-fg">إضافة ويب هوك جديد</span></li>
          <li>ألصق الرابط أعلاه في حقل <span className="font-bold text-fg">URL</span></li>
          <li>اختر طريقة التحقق <span className="font-bold text-fg">Token</span> وأدخل التوكن</li>
          <li>فعّل الأحداث: <code className="font-num font-bold text-fg" dir="ltr">invoice.created</code> + <code className="font-num font-bold text-fg" dir="ltr">order.created</code></li>
          <li>احفظ — الطلبات ستصل تلقائياً للمنصة ✅</li>
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Config Field — reusable row with label + value + copy              */
/* ------------------------------------------------------------------ */

function ConfigField({
  icon,
  label,
  value,
  hint,
  copyable = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.12em] text-fg-faint">
        {icon}
        {label}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div
          className="flex-1 min-w-0 rounded-lg bg-surface border border-[hsl(var(--hairline))] px-2 sm:px-3 py-1.5 sm:py-2 font-num text-[10px] sm:text-xs text-fg truncate select-all"
          dir="ltr"
        >
          {value}
        </div>
        {copyable && (
          <button
            onClick={copy}
            title="نسخ"
            className="shrink-0 h-7 sm:h-8 px-2.5 inline-flex items-center gap-1 rounded-lg bg-fg text-bg text-[9px] sm:text-[10px] font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="size-3 text-accent" />
                <span className="hidden sm:inline">تم</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span className="hidden sm:inline">نسخ</span>
              </>
            )}
          </button>
        )}
      </div>
      {hint && (
        <p className="text-[9px] sm:text-[10px] text-fg-faint leading-relaxed">{hint}</p>
      )}
    </div>
  );
}
