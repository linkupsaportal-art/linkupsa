import { PageHeader } from "@/components/admin/page-header";
import { createServiceClient } from "@/lib/supabase/server";
import { Activity, AlertCircle, CheckCircle2, Clock, Store, Webhook } from "lucide-react";
import { IntegrationsClient } from "@/components/admin/integrations/integrations-client";
import { StoresList } from "@/components/admin/integrations/stores-list";

export const dynamic = "force-dynamic";

export type ConnectedStore = {
  store_id: number;
  store_name: string | null;
  store_url: string | null;
  store_domain: string | null;
  store_logo_url: string | null;
  installed_at: string;
  uninstalled_at: string | null;
  /** Whether any webhook events have been received from this store. */
  webhook_active: boolean;
  /** Count of events received in the last 7 days. */
  events_7d: number;
  /** Last event received timestamp. */
  last_event_at: string | null;
};

async function loadIntegrationData() {
  const sb = createServiceClient();

  const [stores, recentEvents, eventStats] = await Promise.all([
    sb
      .from("salla_stores")
      .select(
        "store_id, store_name, store_url, store_domain, store_logo_url, installed_at, uninstalled_at",
      )
      .order("installed_at", { ascending: false }),
    sb
      .from("webhook_events")
      .select("id, event, status, error, received_at, processed_at")
      .order("received_at", { ascending: false })
      .limit(20),
    sb
      .from("webhook_events")
      .select("status, store_id, received_at")
      .gte("received_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const counts = (eventStats.data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  // Per-store webhook stats (7-day window)
  const storeEventCounts = new Map<number, { count: number; lastAt: string | null }>();
  for (const evt of eventStats.data ?? []) {
    const sid = evt.store_id as number | null;
    if (!sid) continue;
    const existing = storeEventCounts.get(sid);
    if (existing) {
      existing.count++;
      if (!existing.lastAt || evt.received_at > existing.lastAt) {
        existing.lastAt = evt.received_at as string;
      }
    } else {
      storeEventCounts.set(sid, { count: 1, lastAt: evt.received_at as string });
    }
  }

  // Enrich stores with webhook activity info
  const enrichedStores: ConnectedStore[] = (stores.data ?? []).map((s) => {
    const stats = storeEventCounts.get(s.store_id);
    return {
      ...s,
      webhook_active: (stats?.count ?? 0) > 0,
      events_7d: stats?.count ?? 0,
      last_event_at: stats?.lastAt ?? null,
    };
  });

  return {
    stores: enrichedStores,
    events: recentEvents.data ?? [],
    counts,
    total: eventStats.data?.length ?? 0,
  };
}

export default async function IntegrationsPage() {
  const { stores, events, counts, total } = await loadIntegrationData();
  const active = stores.filter((s) => !s.uninstalled_at);

  return (
    <>
      <PageHeader
        title="Webhooks والربط"
        eyebrow="التواصل والربط"
        description="حالة استقبال الأحداث من سلة عبر الويب هوك ومعالجة الطلبات."
      />

      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat icon={Store} label="متاجر نشطة" value={active.length} tone="ok" />
          <Stat icon={Activity} label="أحداث 7 أيام" value={total} tone="neutral" />
          <Stat
            icon={CheckCircle2}
            label="نُفذت بنجاح"
            value={counts.succeeded ?? 0}
            tone="ok"
          />
          <Stat
            icon={AlertCircle}
            label="فشلت"
            value={(counts.failed ?? 0) + (counts.pending ?? 0)}
            tone={(counts.failed ?? 0) + (counts.pending ?? 0) > 0 ? "bad" : "neutral"}
          />
        </div>

        {/* Connected stores with webhook info */}
        <Section icon={Store} title="المتاجر المربوطة" description="كل متجر مرتبط بالمنصة وحالة الويب هوك.">
          <StoresList stores={active} />
        </Section>

        {/* Webhook events with drain controls */}
        <Section
          icon={Webhook}
          title="آخر الأحداث الواردة"
          description="آخر 20 حدث استقبلته المنصة. الأحداث تُعالج تلقائياً."
        >
          <IntegrationsClient
            events={events as IntegrationEvent[]}
            pending={counts.pending ?? 0}
            failed={counts.failed ?? 0}
          />
        </Section>
      </div>
    </>
  );
}

export type IntegrationEvent = {
  id: string;
  event: string;
  status: string;
  error: string | null;
  received_at: string;
  processed_at: string | null;
};

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Webhook;
  label: string;
  value: number;
  tone: "ok" | "bad" | "warn" | "neutral";
}) {
  const colors = {
    ok: "bg-accent/10 text-accent",
    bad: "bg-red-500/10 text-red-400",
    warn: "bg-amber-500/10 text-amber-500",
    neutral: "bg-surface-2 text-fg-muted",
  } as const;
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.15em] text-fg-faint">{label}</span>
        <div className={`size-6 sm:size-7 rounded-lg flex items-center justify-center ${colors[tone]}`}>
          <Icon className="size-3 sm:size-3.5" />
        </div>
      </div>
      <div className="font-num font-extrabold text-xl sm:text-2xl text-fg">{value}</div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Webhook;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-4 sm:p-5">
      <div className="flex items-start gap-3 mb-4 pb-4 border-b border-[hsl(var(--hairline))]">
        <div className="size-9 sm:size-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
          <Icon className="size-4 sm:size-5 text-fg-muted" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm sm:text-base text-fg">{title}</h3>
          {description && <p className="text-[11px] sm:text-xs text-fg-muted mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
