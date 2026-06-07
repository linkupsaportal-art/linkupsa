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
  XCircle,
  ExternalLink,
  Activity,
} from "lucide-react";
import type { ConnectedStore } from "@/app/admin/integrations/page";

/** Webhook endpoint — the single source of truth displayed to the user. */
const WEBHOOK_URL = "https://www.portaliosa.com/api/salla/webhook";

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
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Store logo or fallback icon */}
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

        {/* Status badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Webhook status */}
          {store.webhook_active ? (
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
              <Zap className="size-2.5" />
              ويب هوك فعّال
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
              <XCircle className="size-2.5" />
              لم يتم استقبال أحداث
            </span>
          )}

          {/* Connection badge */}
          <span className="hidden sm:inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/25">
            <CheckCircle2 className="size-2.5" />
            متصل
          </span>
        </div>
      </div>

      {/* Info row — store URL + event stats */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] sm:text-[11px] text-fg-muted">
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
          <span className="font-num" dir="ltr">
            آخر حدث: {lastEventLabel}
          </span>
        )}
      </div>

      {/* Webhook URL — inline with copy */}
      <WebhookUrlCopy />
    </div>
  );
}

function WebhookUrlCopy() {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(WEBHOOK_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.12em] text-fg-faint">
        <Webhook className="size-2.5 sm:size-3" />
        رابط الويب هوك
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div
          className="flex-1 min-w-0 rounded-lg bg-surface border border-[hsl(var(--hairline))] px-2 sm:px-3 py-1.5 sm:py-2 font-num text-[10px] sm:text-xs text-fg truncate select-all"
          dir="ltr"
        >
          {WEBHOOK_URL}
        </div>
        <button
          onClick={copy}
          title="نسخ الرابط"
          className="shrink-0 size-7 sm:size-8 inline-flex items-center justify-center rounded-lg bg-surface border border-[hsl(var(--hairline))] text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
        >
          {copied ? (
            <Check className="size-3 sm:size-3.5 text-accent" />
          ) : (
            <Copy className="size-3 sm:size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function WebhookSetupGuide() {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(WEBHOOK_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-4 p-3 sm:p-4 rounded-xl border border-dashed border-[hsl(var(--hairline-strong))] bg-surface/50 space-y-3">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Webhook className="size-4 text-accent" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-fg">إعداد الويب هوك في سلة</h4>
          <p className="text-[10px] sm:text-[11px] text-fg-muted">
            ضع هذا الرابط في إعدادات الويب هوك بلوحة سلة
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <div
          className="flex-1 min-w-0 rounded-lg bg-surface border border-[hsl(var(--hairline))] px-2 sm:px-3 py-2 font-num text-[10px] sm:text-xs text-fg truncate select-all"
          dir="ltr"
        >
          {WEBHOOK_URL}
        </div>
        <button
          onClick={copy}
          title="نسخ الرابط"
          className="shrink-0 h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-fg text-bg text-[10px] sm:text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="size-3 text-accent" />
              تم النسخ
            </>
          ) : (
            <>
              <Copy className="size-3" />
              نسخ
            </>
          )}
        </button>
      </div>

      <ol className="text-[10px] sm:text-[11px] text-fg-muted space-y-1 ps-4 list-decimal">
        <li>افتح لوحة تحكم سلة → الإعدادات → الويب هوك</li>
        <li>أضف ويب هوك جديد وألصق الرابط أعلاه</li>
        <li>فعّل الأحداث: <span className="font-bold text-fg">order.created</span> و <span className="font-bold text-fg">invoice.created</span></li>
        <li>احفظ — الطلبات ستصل تلقائياً للمنصة ✅</li>
      </ol>
    </div>
  );
}
