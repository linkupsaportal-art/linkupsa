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
      .select("status")
      .gte("received_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const counts = (eventStats.data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    stores: (stores.data ?? []) as ConnectedStore[],
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
        title="ربط المتجر و Webhooks"
        eyebrow="التواصل والربط"
        description="حالة الربط مع المتجر، الأحداث الواردة، ومعالجة الطلبات."
      />

      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Stat icon={Store} label="متاجر مربوطة" value={active.length} tone="ok" />
          <Stat icon={Activity} label="أحداث 7 أيام" value={total} tone="neutral" />
          <Stat
            icon={CheckCircle2}
            label="نُفذت بنجاح"
            value={counts.succeeded ?? 0}
            tone="ok"
          />
          <Stat
            icon={Clock}
            label="قيد الانتظار"
            value={counts.pending ?? 0}
            tone={(counts.pending ?? 0) > 0 ? "warn" : "neutral"}
          />
          <Stat
            icon={AlertCircle}
            label="فشلت"
            value={counts.failed ?? 0}
            tone={(counts.failed ?? 0) > 0 ? "bad" : "neutral"}
          />
        </div>

        {/* Connected stores */}
        <Section icon={Store} title="المتاجر المربوطة" description="كل متجر مرتبط بالمنصة.">
          <StoresList stores={active} />
        </Section>

        {/* Webhook events with drain controls */}
        <Section
          icon={Webhook}
          title="آخر الأحداث الواردة"
          description="آخر 20 حدث استقبلته المنصة. الأحداث تُعالج تلقائياً، ويمكنك تشغيل المعالج الآن إذا احتجت."
        >
          <IntegrationsClient
            events={events as IntegrationEvent[]}
            pending={counts.pending ?? 0}
            failed={counts.failed ?? 0}
          />
        </Section>

        {/* Webhook URL */}
        <Section
          icon={Webhook}
          title="عنوان Webhook"
          description="الرابط المستخدم لاستقبال الأحداث من المتجر."
        >
          <div
            className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3 font-num text-xs text-fg"
            dir="ltr"
          >
            https://salla-webhook-proxy.linkup.workers.dev/
          </div>
          <p className="text-[11px] text-fg-faint mt-2 leading-relaxed">
            الأحداث تمر عبر طبقة حماية على Cloudflare لتسريع الاستجابة، ثم تُحفظ وتُعالج تلقائياً.
          </p>
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
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-fg-faint">{label}</span>
        <div className={`size-7 rounded-lg flex items-center justify-center ${colors[tone]}`}>
          <Icon className="size-3.5" />
        </div>
      </div>
      <div className="font-num font-extrabold text-2xl text-fg">{value}</div>
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
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5">
      <div className="flex items-start gap-3 mb-4 pb-4 border-b border-[hsl(var(--hairline))]">
        <div className="size-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
          <Icon className="size-5 text-fg-muted" />
        </div>
        <div>
          <h3 className="font-bold text-fg">{title}</h3>
          {description && <p className="text-xs text-fg-muted mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
