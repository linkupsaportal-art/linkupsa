import { Archive, RotateCcw, Trash2, Database } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { createServiceClient, getCurrentRole } from "@/lib/supabase/server";
import { CleanupButtons } from "@/components/admin/archives/cleanup-buttons";

export const dynamic = "force-dynamic";

async function loadArchiveStats() {
  const sb = createServiceClient();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  const [oldOrders, oldOtpLogs, totalOrders, totalOtpLogs] = await Promise.all([
    sb.from("orders").select("id", { count: "exact", head: true }).lte("created_at", ninetyDaysAgo),
    sb.from("otp_logs").select("id", { count: "exact", head: true }).lte("requested_at", ninetyDaysAgo),
    sb.from("orders").select("id", { count: "exact", head: true }),
    sb.from("otp_logs").select("id", { count: "exact", head: true }),
  ]);

  return {
    oldOrders: oldOrders.count ?? 0,
    oldOtpLogs: oldOtpLogs.count ?? 0,
    totalOrders: totalOrders.count ?? 0,
    totalOtpLogs: totalOtpLogs.count ?? 0,
    cutoffDate: ninetyDaysAgo,
  };
}

export default async function ArchivesPage() {
  const [stats, role] = await Promise.all([loadArchiveStats(), getCurrentRole()]);
  const canManage = role === "manager";

  return (
    <>
      <PageHeader
        title="الأرشيف"
        eyebrow="الإدارة"
        description="الطلبات القديمة وسجلات OTP المؤرشفة. نُبقي البيانات الحديثة سريعة الوصول، والقديمة في الأرشيف."
      />

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ArchiveCard
            icon={Archive}
            title="الطلبات القديمة"
            description="الطلبات التي مضى عليها أكثر من 90 يوم"
            old={stats.oldOrders}
            total={stats.totalOrders}
          />
          <ArchiveCard
            icon={Database}
            title="سجلات أكواد التحقق"
            description="سجلات OTP الأقدم من 90 يوم"
            old={stats.oldOtpLogs}
            total={stats.totalOtpLogs}
          />
        </div>

        <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
              <RotateCcw className="size-5 text-fg-muted" />
            </div>
            <div>
              <h3 className="font-bold text-fg mb-1">سياسة الأرشفة الحالية</h3>
              <ul className="text-sm text-fg-muted leading-relaxed space-y-1 mt-2">
                <li>• الطلبات تُؤرشف تلقائياً بعد المدة المحددة في الإعدادات (افتراضي 90 يوم).</li>
                <li>• سجلات أكواد التحقق تُحذف تلقائياً بعد المدة المحددة (افتراضي 90 يوم).</li>
                <li>• كل البيانات الحساسة (كلمات المرور، أسرار 2FA و Steam) مشفّرة بـ AES-256-GCM.</li>
                <li>• مهمة الصيانة الليلية تعمل تلقائياً عبر Vercel Cron، والنسخ الاحتياطي اليومي عبر قاعدة البيانات.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-6">
          <h3 className="font-bold text-fg mb-3 flex items-center gap-2">
            <Trash2 className="size-4 text-fg-muted" />
            تنظيف يدوي
          </h3>
          <p className="text-sm text-fg-muted mb-4">
            النظام ينظّف البيانات القديمة تلقائياً كل ليلة عبر مهمة Vercel Cron حسب سياسة الاحتفاظ. يمكنك أيضاً تشغيلها يدوياً الآن.
          </p>
          {canManage ? (
            <CleanupButtons />
          ) : (
            <p className="text-xs text-fg-faint">التشغيل اليدوي متاح للمدير فقط.</p>
          )}
        </div>
      </div>
    </>
  );
}

function ArchiveCard({
  icon: Icon,
  title,
  description,
  old,
  total,
}: {
  icon: typeof Archive;
  title: string;
  description: string;
  old: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((old / total) * 100) : 0;
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="size-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
          <Icon className="size-5" />
        </div>
        <div className="text-end">
          <div className="font-num font-extrabold text-2xl text-fg">{old}</div>
          <div className="text-[10px] text-fg-faint uppercase font-bold tracking-wider">مؤهل للأرشفة</div>
        </div>
      </div>
      <h3 className="font-bold text-fg mb-1">{title}</h3>
      <p className="text-xs text-fg-muted">{description}</p>
      <div className="mt-3 pt-3 border-t border-[hsl(var(--hairline))]">
        <div className="flex items-center justify-between text-[11px] text-fg-muted mb-1">
          <span>إجمالي السجلات</span>
          <span className="font-num font-bold text-fg">{total}</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}
