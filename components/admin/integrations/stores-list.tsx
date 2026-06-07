"use client";

import { useState, useTransition } from "react";
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
  Clock,
  Fingerprint,
  Loader2,
  Signal,
  SignalZero,
  XCircle,
} from "lucide-react";
import type { ConnectedStore } from "@/app/admin/integrations/page";
import { checkWebhookConnectionAction } from "@/app/admin/integrations/actions";
import type { ConnectionStatus } from "@/app/admin/integrations/actions";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Webhook endpoint URL shown to the user. */
const WEBHOOK_URL = "https://www.portaliosa.com/api/salla/webhook";
const WEBHOOK_TOKEN = "9ab2fd0f47c89fc3ed7f57b7142065b8d33b206d55faf2cfa75b4e413cb76e66";

/* ------------------------------------------------------------------ */
/*  Main List                                                          */
/* ------------------------------------------------------------------ */

export function StoresList({
  stores,
  webhookKey,
  userId,
}: {
  stores: ConnectedStore[];
  webhookKey: string | null;
  userId: string | null;
}) {
  return (
    <div className="space-y-3">
      {stores.length > 0 &&
        stores.map((s) => <StoreRow key={s.store_id} store={s} />)}

      {stores.length === 0 && (
        <p className="text-sm text-fg-muted text-center py-4">
          لا توجد متاجر مربوطة بعد. أعد الويب هوك في سلة وسيتم ربط متجرك تلقائياً.
        </p>
      )}

      {/* Global webhook setup guide */}
      <WebhookSetupGuide webhookKey={webhookKey} />

      {/* Connection check */}
      {userId && <ConnectionChecker userId={userId} />}
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

function WebhookSetupGuide({ webhookKey }: { webhookKey: string | null }) {
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
            أدخل هذه القيم في صفحة إعداد الويب هوك بلوحة سلة
          </p>
        </div>
      </div>

      {/* ── Salla Fields ── */}

      {/* 1. رابط الحدث */}
      <ConfigField
        icon={<Globe className="size-3.5 text-accent" />}
        label="رابط الحدث"
        value={WEBHOOK_URL}
        copyable
        hint="رابط الخدمة الذي سيتم ارسال بيانات الحدث اليه، يبدأ الرابط بـ https و يلزم ان يدعم استقبال البيانات عن طريق POST Request"
      />

      {/* 2. authorization */}
      <ConfigField
        icon={<ShieldCheck className="size-3.5 text-accent" />}
        label="authorization"
        value={WEBHOOK_TOKEN}
        copyable
      />

      {/* 3. x-salla-security-strategy */}
      <ConfigField
        icon={<ShieldCheck className="size-3.5 text-accent" />}
        label="x-salla-security-strategy"
        value="Token"
        copyable
      />

      {/* 4. x-portaliosa-key (per-user identification key) */}
      {webhookKey && (
        <ConfigField
          icon={<Fingerprint className="size-3.5 text-accent" />}
          label="x-portaliosa-key"
          value={webhookKey}
          copyable
          hint="مفتاح خاص بحسابك — أضفه كـ Request Header Parameter في سلة لربط متجرك تلقائياً بحسابك"
        />
      )}
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

/* ------------------------------------------------------------------ */
/*  Connection Checker — verify webhook is wired                       */
/* ------------------------------------------------------------------ */

function ConnectionChecker({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ConnectionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  function check() {
    setError(null);
    startTransition(async () => {
      const res = await checkWebhookConnectionAction(userId);
      if (res.ok && res.data) {
        setResult(res.data);
      } else if (!res.ok) {
        setError(res.error);
      }
    });
  }

  return (
    <div className="mt-3 p-3 sm:p-4 rounded-xl border border-[hsl(var(--hairline))] bg-surface/50">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-8 rounded-lg bg-surface-2 flex items-center justify-center">
            <Signal className="size-4 text-fg-muted" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-fg">فحص الاتصال</h4>
            <p className="text-[10px] text-fg-muted">
              تحقق من وصول أحداث الويب هوك بنجاح
            </p>
          </div>
        </div>

        <button
          onClick={check}
          disabled={isPending}
          className="shrink-0 h-8 sm:h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-fg text-bg text-[10px] sm:text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              جاري الفحص...
            </>
          ) : (
            <>
              <Signal className="size-3.5" />
              فحص الاتصال
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`mt-3 p-3 rounded-lg border ${
            result.connected
              ? "border-emerald-500/25 bg-emerald-500/5"
              : "border-amber-500/25 bg-amber-500/5"
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            {result.connected ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-xs sm:text-sm font-bold text-emerald-600">
                  متصل ✅
                </span>
              </>
            ) : (
              <>
                <SignalZero className="size-4 text-amber-500" />
                <span className="text-xs sm:text-sm font-bold text-amber-600">
                  لم يُستقبل أي حدث بعد
                </span>
              </>
            )}
          </div>

          {result.connected && (
            <div className="space-y-1 text-[10px] sm:text-[11px] text-fg-muted">
              <p>
                <span className="font-bold">إجمالي الأحداث:</span>{" "}
                <span className="font-num">{result.totalEvents}</span>
              </p>
              {result.lastEventAt && (
                <p>
                  <span className="font-bold">آخر حدث:</span>{" "}
                  <span className="font-num" dir="ltr">
                    {new Date(result.lastEventAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                </p>
              )}
              {result.lastEventType && (
                <p>
                  <span className="font-bold">نوع آخر حدث:</span>{" "}
                  <code className="font-num bg-surface px-1 rounded text-[9px]">
                    {result.lastEventType}
                  </code>
                </p>
              )}
              {result.activeStoreIds.length > 0 && (
                <p>
                  <span className="font-bold">متاجر نشطة (7 أيام):</span>{" "}
                  <span className="font-num">
                    {result.activeStoreIds.join(", ")}
                  </span>
                </p>
              )}
            </div>
          )}

          {!result.connected && (
            <p className="text-[10px] sm:text-[11px] text-fg-muted leading-relaxed">
              تأكد من إعداد الويب هوك في سلة بالقيم أعلاه. بعد الإعداد، اضغط
              &quot;اختبار الويب هوك&quot; من لوحة سلة ثم أعد الفحص هنا.
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 rounded-lg border border-red-500/25 bg-red-500/5">
          <div className="flex items-center gap-2">
            <XCircle className="size-4 text-red-400" />
            <span className="text-xs font-bold text-red-500">
              حدث خطأ: {error}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
