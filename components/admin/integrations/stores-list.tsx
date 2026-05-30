"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  Store as StoreIcon,
} from "lucide-react";
import { refreshStoreInfoAction } from "@/app/admin/integrations/actions";
import type { ConnectedStore } from "@/app/admin/integrations/page";

export function StoresList({ stores }: { stores: ConnectedStore[] }) {
  if (stores.length === 0) {
    return (
      <p className="text-sm text-fg-muted text-center py-6">لا توجد متاجر مربوطة.</p>
    );
  }
  return (
    <div className="space-y-2">
      {stores.map((s) => (
        <StoreRow key={s.store_id} store={s} />
      ))}
    </div>
  );
}

function StoreRow({ store }: { store: ConnectedStore }) {
  const [isRefreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setError(null);
    startRefresh(async () => {
      const r = await refreshStoreInfoAction(store.store_id);
      if (!r.ok) setError(r.error);
    });
  }

  const installedAt = new Date(store.installed_at).toLocaleDateString("en-US", {
    year: "2-digit",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline))]">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Store logo or fallback icon */}
        <div className="size-10 rounded-xl bg-surface border border-[hsl(var(--hairline))] flex items-center justify-center shrink-0 overflow-hidden">
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
            <StoreIcon className="size-5 text-fg-muted" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm text-fg truncate">
            {store.store_name ?? "متجر بدون اسم"}
          </div>

          {store.store_url ? (
            <a
              href={store.store_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-accent hover:underline group"
              dir="ltr"
            >
              <Globe className="size-3" />
              {store.store_domain ?? store.store_url}
              <ExternalLink className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>
          ) : (
            <div className="mt-1 text-[11px] text-fg-faint">
              لم يتم جلب رابط المتجر بعد. اضغط زر التحديث.
            </div>
          )}

          <div className="text-[11px] text-fg-muted font-num mt-1" dir="ltr">
            ID: {store.store_id} · ربط منذ {installedAt}
          </div>

          {error && (
            <div className="mt-1.5 text-[11px] text-red-400 font-semibold">{error}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={refresh}
          disabled={isRefreshing}
          title="تحديث بيانات المتجر من سلة"
          className="size-8 inline-flex items-center justify-center rounded-lg bg-surface border border-[hsl(var(--hairline))] text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isRefreshing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
        </button>
        <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/25">
          <CheckCircle2 className="size-2.5" />
          نشط
        </span>
      </div>
    </div>
  );
}
