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
 * Loads the team from `store_members` (the access-control source of truth),
 * scoped to the store the current user manages. This fixes the bug where a
 * brand-new self-registered account appeared as an employee: only explicit
 * members (owner + accepted invitees) of THIS store are listed.
 */
async function loadTeam(currentUserId: string): Promise<{
  members: StaffMember[];
  myPending: PendingInvite[];
  sentInvites: SentInvite[];
}> {
  const sb = createServiceClient();

  const { data: myMembership } = await sb
    .from("store_members")
    .select("store_id")
    .eq("user_id", currentUserId)
    .order("is_owner", { ascending: false })
    .limit(1)
    .maybeSingle();
  const storeId = myMembership?.store_id ?? null;

  const [{ data: authList }, { data: rawMembers }, { data: mine }, { data: sent }] =
    await Promise.all([
      sb.auth.admin.listUsers({ page: 1, perPage: 200 }),
      storeId
        ? sb
            .from("store_members")
            .select("user_id, role, is_owner")
            .eq("store_id", storeId)
            .order("is_owner", { ascending: false })
        : Promise.resolve({ data: [] as { user_id: string; role: string; is_owner: boolean }[] }),
      sb
        .from("workspace_invitations")
        .select("id, store_name, role, invited_by_name, created_at")
        .eq("invitee_id", currentUserId)
        .eq("status", "pending"),
      storeId
        ? sb
            .from("workspace_invitations")
            .select("id, invitee_email, role, status, created_at")
            .eq("store_id", storeId)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
        : Promise.resolve({
            data: [] as {
              id: string; invitee_email: string; role: string; status: string; created_at: string;
            }[],
          }),
    ]);

  const memberRows = rawMembers ?? [];
  const memberIds = memberRows.map((m) => m.user_id as string);
  const { data: profiles } = memberIds.length
    ? await sb.from("profiles").select("id, name").in("id", memberIds)
    : { data: [] as { id: string; name: string | null }[] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id as string, (p.name as string) ?? ""]));
  const authById = new Map((authList?.users ?? []).map((u) => [u.id, u]));

  const members: StaffMember[] = memberRows
    .map((m) => {
      const u = authById.get(m.user_id as string);
      if (!u) return null;
      return {
        id: m.user_id as string,
        email: u.email ?? "—",
        name:
          nameById.get(m.user_id as string) ||
          (u.user_metadata?.name as string | undefined) ||
          u.email?.split("@")[0] ||
          "—",
        role: isRole(m.role) ? m.role : DEFAULT_ROLE,
        has2fa: Array.isArray(u.factors) && u.factors.length > 0,
        isSelf: (m.user_id as string) === currentUserId,
        isOwner: !!m.is_owner,
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
