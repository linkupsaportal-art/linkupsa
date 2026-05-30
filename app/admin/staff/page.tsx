import { PageHeader } from "@/components/admin/page-header";
import { createServiceClient } from "@/lib/supabase/server";
import { Users, Shield, UserCircle2, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

async function loadStaff() {
  const sb = createServiceClient();
  const { data } = await sb.auth.admin.listUsers({ page: 1, perPage: 50 });
  return data?.users ?? [];
}

export default async function StaffPage() {
  const users = await loadStaff();

  return (
    <>
      <PageHeader
        title="الموظفون والصلاحيات"
        eyebrow="الإدارة"
        description="حسابات الإدارة المسموح لها بالوصول للوحة التحكم."
      />

      <div className="space-y-5">
        <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5">
          <div className="flex items-start gap-3 mb-4 pb-4 border-b border-[hsl(var(--hairline))]">
            <div className="size-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Users className="size-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-fg">المستخدمون النشطون</h3>
              <p className="text-xs text-fg-muted mt-0.5">
                إجمالي:{" "}
                <span className="font-num font-bold text-fg">{users.length}</span> مستخدم
              </p>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="text-sm text-fg-muted text-center py-6">لا يوجد مستخدمون مسجلون.</div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline))]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-full bg-surface flex items-center justify-center shrink-0">
                      <UserCircle2 className="size-5 text-fg-muted" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-fg truncate">
                        {u.user_metadata?.display_name || u.email?.split("@")[0]}
                      </div>
                      <div className="text-[11px] text-fg-muted flex items-center gap-1 font-num" dir="ltr">
                        <Mail className="size-3" />
                        {u.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.factors && u.factors.length > 0 && (
                      <span
                        className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/25"
                        title="2FA مفعّل"
                      >
                        <Shield className="size-2.5" />
                        2FA
                      </span>
                    )}
                    <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-fg/10 text-fg border border-fg/20">
                      Admin
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5">
          <h3 className="font-bold text-fg mb-2">إدارة الصلاحيات (RBAC)</h3>
          <p className="text-sm text-fg-muted leading-relaxed mb-3">
            تخصيص أدوار وصلاحيات مفصّلة للموظفين (مدير، مشرف، موظف خدمة عملاء، رفع حد الأكواد فقط) سيتم تفعيله قريباً.
          </p>
          <p className="text-xs text-fg-faint">
            حالياً: كل المستخدمين المسجلين لهم صلاحية إدارة كاملة. للوحة المستقلة لرفع الحد، يتم استخدام نظام تسجيل دخول منفصل.
          </p>
        </div>
      </div>
    </>
  );
}
