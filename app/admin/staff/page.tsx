import { PageHeader } from "@/components/admin/page-header";
import { createServiceClient, getCurrentUser, getCurrentRole } from "@/lib/supabase/server";
import { StaffManager, type StaffMember } from "@/components/admin/staff/staff-manager";
import { isRole, DEFAULT_ROLE, type Role } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

type PendingInvite = {
  id: string;
  storeName: string;
  role: Role;
  invitedByName: string;
  createdAt: string;
};

type SentInvite = {
  id: string;
  email: string;
  role: Role;
  status: string;
  createdAt: string;
};

/**
 * Loads the team. The staff list is NOT "every registered user" — it's:
 *   - the manager(s) (store owner)
 *   - users who ACCEPTED an invitation to this store
 *
 * This fixes the bug where a brand-new self-registered account appeared as
 * an employee: those users have no accepted invitation, so they're excluded.
 */
async function loadTeam(currentUserId: string): Promise<{
  members: StaffMember[];
  myPending: PendingInvite[];
  sentInvites: SentInvite[];
}> {
  const sb = createServiceClient();

  const [
    { data: authList },
    { data: profiles },
    { data: accepted },
    { data: mine },
    { data: sent },
  ] = await Promise.all([
    sb.auth.admin.listUsers({ page: 1, perPage: 200 }),
    sb.from("profiles").select("id, role, name, email"),
    // Accepted memberships → who belongs to the team (besides managers).
    sb.from("workspace_invitations").select("invitee_id").eq("status", "accepted"),
    // Pending invitations addressed to ME (accept/decline banner).
    sb
      .from("workspace_invitations")
      .select("id, store_name, role, invited_by_name, created_at")
      .eq("invitee_id", currentUserId)
      .eq("status", "pending"),
    // Invitations I (manager) sent that are still pending.
    sb
      .from("workspace_invitations")
      .select("id, invitee_email, role, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const roleById = new Map<string, Role>();
  const nameById = new Map<string, string>();
  for (const p of profiles ?? []) {
    roleById.set(p.id as string, isRole(p.role) ? p.role : DEFAULT_ROLE);
    if (p.name) nameById.set(p.id as string, p.name as string);
  }

  // Team = managers + accepted invitees + the current user.
  const teamIds = new Set<string>();
  for (const p of profiles ?? []) {
    if ((p.role as string) === "manager") teamIds.add(p.id as string);
  }
  for (const a of accepted ?? []) teamIds.add(a.invitee_id as string);
  teamIds.add(currentUserId);

  const authById = new Map((authList?.users ?? []).map((u) => [u.id, u]));
  const members: StaffMember[] = [...teamIds]
    .map((id) => {
      const u = authById.get(id);
      if (!u) return null;
      return {
        id,
        email: u.email ?? "—",
        name:
          nameById.get(id) ||
          (u.user_metadata?.name as string | undefined) ||
          u.email?.split("@")[0] ||
          "—",
        role: roleById.get(id) ?? DEFAULT_ROLE,
        has2fa: Array.isArray(u.factors) && u.factors.length > 0,
        isSelf: id === currentUserId,
      } as StaffMember;
    })
    .filter((m): m is StaffMember => m !== null);

  const myPending: PendingInvite[] = (mine ?? []).map((r) => ({
    id: r.id as string,
    storeName: (r.store_name as string) ?? "متجر",
    role: isRole(r.role) ? r.role : "support",
    invitedByName: (r.invited_by_name as string) ?? "مدير المتجر",
    createdAt: r.created_at as string,
  }));

  const sentInvites: SentInvite[] = (sent ?? []).map((r) => ({
    id: r.id as string,
    email: r.invitee_email as string,
    role: isRole(r.role) ? r.role : "support",
    status: r.status as string,
    createdAt: r.created_at as string,
  }));

  return { members, myPending, sentInvites };
}

export default async function StaffPage() {
  const [user, role] = await Promise.all([getCurrentUser(), getCurrentRole()]);
  const { members, myPending, sentInvites } = user
    ? await loadTeam(user.id)
    : { members: [], myPending: [], sentInvites: [] };
  const canManage = role === "manager";

  return (
    <>
      <PageHeader
        title="الموظفون والصلاحيات"
        eyebrow="الإدارة"
        description="إدارة حسابات الفريق وتعيين الأدوار والصلاحيات للوصول إلى اللوحة."
      />
      <StaffManager
        members={members}
        canManage={canManage}
        myPending={myPending}
        sentInvites={sentInvites}
      />
    </>
  );
}
