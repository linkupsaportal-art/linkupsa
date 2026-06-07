import { PageHeader } from "@/components/admin/page-header";
import { createServiceClient, getCurrentUser } from "@/lib/supabase/server";
import { Activity, AlertCircle, CheckCircle2, Clock, Store, Webhook } from "lucide-react";
import { IntegrationsClient } from "@/components/admin/integrations/integrations-client";
import { StoresList } from "@/components/admin/integrations/stores-list";
import { getOrCreateWebhookKey } from "@/lib/salla/auto-link";

export const dynamic = "force-dynamic";

export type ConnectedStore = {
  store_id: number;
  store_name: string | null;
  store_url: string | null;
  store_domain: string | null;
  store_logo_url: string | null;
  installed_at: string;
  uninstalled_at: string | null;
  /** Whether real invoice/order events arrived in the last 48 h. */
  webhook_active: boolean;
  /** Count of events received in the last 7 days. */
  events_7d: number;
  /** Last event received timestamp (all-time). */
  last_event_at: string | null;
};

/**
 * Only these event types count toward "webhook is wired":
 * app.* and test.* are handshake/install events, not real traffic.
 */
const REAL_EVENT_PREFIXES = ["order.", "invoice."];

async function loadIntegrationData() {
  const sb = createServiceClient();

  const now = Date.now();
  const cutoff7d = new Date(now - 7 * 24 * 60 * 60_000).toISOString();
  const cutoff48h = new Date(now - 48 * 60 * 60_000).toISOString();

  const [stores, recentEvents, events7d, events48h] = await Promise.all([
    sb
      .from("salla_stores")
      .select(
        "store_id, store_name, store_url, store_domain, store_logo_url, installed_at, uninstalled_at",
      )
      .order("installed_at", { ascending: false }),
    sb
      .from("webhook_events")
      .select("id, event, status, error, received_at, processed_at, store_id")
      .order("received_at", { ascending: false })
      .limit(20),
    // 7-day stats for counts
    sb
      .from("webhook_events")
      .select("status, store_id, received_at, event")
      .gte("received_at", cutoff7d),
    // 48-hour check for "active" detection — only real events
    sb
      .from("webhook_events")
      .select("store_id, event, received_at")
      .gte("received_at", cutoff48h),
  ]);

  // Global status counts
  const counts = (events7d.data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  // Per-store 7-day stats
  const store7d = new Map<number, { count: number; lastAt: string | null }>();
  for (const evt of events7d.data ?? []) {
    const sid = evt.store_id as number | null;
    if (!sid) continue;
    const existing = store7d.get(sid);
    if (existing) {
      existing.count++;
      if (!existing.lastAt || (evt.received_at as string) > existing.lastAt) {
        existing.lastAt = evt.received_at as string;
      }
    } else {
      store7d.set(sid, { count: 1, lastAt: evt.received_at as string });
    }
  }

  // Per-store 48h "active" — only real events (order.*, invoice.*)
  const storeActive48h = new Set<number>();
  for (const evt of events48h.data ?? []) {
    const sid = evt.store_id as number | null;
    const eventName = evt.event as string;
    if (!sid) continue;
    if (REAL_EVENT_PREFIXES.some((p) => eventName.startsWith(p))) {
      storeActive48h.add(sid);
    }
  }

  // Enrich stores
  const enrichedStores: ConnectedStore[] = (stores.data ?? []).map((s) => {
    const stats = store7d.get(s.store_id);
    return {
      ...s,
      webhook_active: storeActive48h.has(s.store_id),
      events_7d: stats?.count ?? 0,
      last_event_at: stats?.lastAt ?? null,
    };
  });

  return {
    stores: enrichedStores,
    events: recentEvents.data ?? [],
    counts,
    total: events7d.data?.length ?? 0,
  };
}

export default async function IntegrationsPage() {
  const { stores, events, counts, total } = await loadIntegrationData();
  const active = stores.filter((s) => !s.uninstalled_at);

  // Fetch the current user's personal webhook key for display
  const user = await getCurrentUser();
  const webhookKey = user ? await getOrCreateWebhookKey(user.id) : null;

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
            label="فشلت / ينتظر"
            value={(counts.failed ?? 0) + (counts.pending ?? 0)}
            tone={(counts.failed ?? 0) + (counts.pending ?? 0) > 0 ? "bad" : "neutral"}
          />
        </div>

        {/* Connected stores with webhook info */}
        <Section icon={Store} title="المتاجر المربوطة" description="كل متجر مرتبط بالمنصة وحالة الويب هوك الفعلية.">
          <StoresList stores={active} webhookKey={webhookKey} userId={user?.id ?? null} />
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
  store_id?: number | null;
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
