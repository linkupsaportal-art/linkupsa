import { PageHeader } from "@/components/admin/page-header";
import { createServiceClient } from "@/lib/supabase/server";
import {
  Settings as SettingsIcon,
  Globe,
  Lock,
  Database,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function loadStores() {
  const sb = createServiceClient();
  const { data } = await sb
    .from("salla_stores")
    .select("store_id, store_name, scope, installed_at, token_expires_at, uninstalled_at")
    .order("installed_at", { ascending: false });
  return data ?? [];
}

export default async function SettingsPage() {
  const stores = await loadStores();
  const active = stores.filter((s) => !s.uninstalled_at);

  return (
    <>
      <PageHeader
        title="إعدادات المتجر"
        eyebrow="الإدارة"
        description="معلومات الربط مع سلة، الأمان، والإعدادات العامة للمنصة."
      />

      <div className="space-y-5">
        {/* Connected Salla stores */}
        <Section
          icon={Globe}
          title="ربط المتاجر"
          description="المتاجر المربوطة عبر Salla."
        >
          {active.length === 0 ? (
            <div className="text-sm text-fg-muted text-center py-6">لا توجد متاجر مربوطة حالياً.</div>
          ) : (
            <div className="space-y-2">
              {active.map((s) => (
                <div
                  key={s.store_id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline))]"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-fg">{s.store_name}</div>
                    <div className="text-[11px] text-fg-muted font-num">Store ID: {s.store_id}</div>
                  </div>
                  <div className="text-end shrink-0">
                    <div className="text-[10px] text-fg-faint uppercase font-bold tracking-wider mb-1">
                      الصلاحيات
                    </div>
                    <div className="text-[11px] text-fg-muted truncate max-w-xs">
                      {s.scope?.split(" ").length ?? 0} scope مفعّل
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Security */}
        <Section
          icon={ShieldCheck}
          title="الأمان"
          description="إعدادات الحماية والتشفير."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SecurityItem
              label="2FA على لوحة التحكم"
              status="مفعّل"
              detail="مطلوب للأدمن — TOTP عبر Google Authenticator."
              ok
            />
            <SecurityItem
              label="تشفير الأسرار"
              status="AES-256-GCM"
              detail="كلمات المرور و TOTP و Steam والبطاقات مشفّرة في قاعدة البيانات بمفتاح خادمي."
              ok
            />
            <SecurityItem
              label="Row Level Security"
              status="مفعّل"
              detail="كل الجداول مؤمّنة على مستوى الصف."
              ok
            />
            <SecurityItem
              label="HTTPS / SSL"
              status="Vercel + Cloudflare"
              detail="شهادات تلقائية مع تجديد دائم."
              ok
            />
          </div>
        </Section>

        {/* Backups */}
        <Section
          icon={Database}
          title="النسخ الاحتياطي"
          description="حفظ تلقائي يومي على Supabase."
        >
          <div className="text-sm text-fg-muted leading-relaxed space-y-2">
            <p>
              النسخ الاحتياطي اليومي مفعّل افتراضياً على Supabase. آخر 7 أيام محفوظة على خطة Free، و30 يوم على Pro.
            </p>
            <p className="text-xs text-fg-faint">
              للاستعادة: تواصل مع المطوّر أو استخدم لوحة Supabase مباشرة.
            </p>
          </div>
        </Section>

        {/* External links */}
        <Section icon={ExternalLink} title="روابط مرجعية" description="">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <ExternalLinkRow
              label="صفحة استلام الطلبات"
              href="https://www.portaliosa.com/pickup"
            />
            <ExternalLinkRow label="موقع المتجر" href="https://www.portaliosa.com" />
          </div>
        </Section>
      </div>
    </>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof SettingsIcon;
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

function SecurityItem({
  label,
  status,
  detail,
  ok,
}: {
  label: string;
  status: string;
  detail: string;
  ok: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-bold text-fg-muted">{label}</span>
        <span
          className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold border ${
            ok
              ? "bg-accent/15 text-black border-accent/25"
              : "bg-red-500/15 text-red-400 border-red-500/25"
          }`}
        >
          <Lock className="size-2.5" />
          {status}
        </span>
      </div>
      <p className="text-[11px] text-fg-muted leading-relaxed">{detail}</p>
    </div>
  );
}

function ExternalLinkRow({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] hover:bg-surface transition-colors group"
    >
      <span className="text-sm font-semibold text-fg">{label}</span>
      <ExternalLink className="size-3.5 text-fg-faint group-hover:text-fg transition-colors" />
    </a>
  );
}
