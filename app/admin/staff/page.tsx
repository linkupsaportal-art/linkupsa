import { PageHeader } from "@/components/admin/page-header";
import { createServiceClient, getCurrentUser, getCurrentRole } from "@/lib/supabase/server";
import { StaffManager, type StaffMember } from "@/components/admin/staff/staff-manager";
import { isRole, DEFAULT_ROLE, type Role } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

/**
 * Loads every admin/staff user, joining their RBAC role from `profiles` and
 * their 2FA status from Supabase Auth factors. Role is the source of truth
 * in `profiles.role`; auth metadata is kept in sync as a convenience copy.
 */
async function loadStaff(currentUserId: string): Promise<StaffMember[]> {
  const sb = createServiceClient();

  const [{ data: list }, { data: profiles }] = await Promise.all([
    sb.auth.admin.listUsers({ page: 1, perPage: 200 }),
    sb.from("profiles").select("id, role, name"),
  ]);

  const roleById = new Map<string, Role>();
  const nameById = new Map<string, string>();
  for (const p of profiles ?? []) {
    roleById.set(p.id as string, isRole(p.role) ? p.role : DEFAULT_ROLE);
    if (p.name) nameById.set(p.id as string, p.name as string);
  }

  return (list?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? "—",
    name:
      nameById.get(u.id) ||
      (u.user_metadata?.name as string | undefined) ||
      (u.user_metadata?.display_name as string | undefined) ||
      u.email?.split("@")[0] ||
      "—",
    role: roleById.get(u.id) ?? DEFAULT_ROLE,
    has2fa: Array.isArray(u.factors) && u.factors.length > 0,
    isSelf: u.id === currentUserId,
  }));
}

export default async function StaffPage() {
  const [user, role] = await Promise.all([getCurrentUser(), getCurrentRole()]);
  const members = user ? await loadStaff(user.id) : [];
  const canManage = role === "manager";

  return (
    <>
      <PageHeader
        title="الموظفون والصلاحيات"
        eyebrow="الإدارة"
        description="إدارة حسابات الفريق وتعيين الأدوار والصلاحيات للوصول إلى اللوحة."
      />
      <StaffManager members={members} canManage={canManage} />
    </>
  );
}
