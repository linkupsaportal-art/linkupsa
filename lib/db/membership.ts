import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { type Role, isRole } from "@/lib/auth/rbac";

/**
 * Store membership resolution — the access-control source of truth.
 *
 * Access to the admin dashboard requires a `store_members` row. This replaces
 * the old (buggy) model where a global `profiles.role` granted access to the
 * single shared store, which meant ANY new registration became a co-owner.
 *
 * - getActiveMembership(userId): the membership for the user's active store
 *   (the store they own, or the first store they were granted access to).
 * - listMemberships(userId): every store the user belongs to (for switcher).
 */

export type Membership = {
  storeId: number;
  role: Role;
  isOwner: boolean;
};

/** All stores the user is a member of, owner stores first. */
export async function listMemberships(userId: string): Promise<Membership[]> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("store_members")
    .select("store_id, role, is_owner")
    .eq("user_id", userId)
    .order("is_owner", { ascending: false })
    .order("created_at", { ascending: true });
  return (data ?? []).map((m) => ({
    storeId: m.store_id as number,
    role: isRole(m.role) ? m.role : "support",
    isOwner: !!m.is_owner,
  }));
}

/**
 * The membership for the active store. Honors an optional preferred store id
 * (from the workspace-switcher cookie); falls back to the first membership.
 * Returns null when the user belongs to NO store — they have no dashboard
 * access and the layout should bounce them out.
 */
export async function getActiveMembership(
  userId: string,
  preferredStoreId?: string | null,
): Promise<Membership | null> {
  const memberships = await listMemberships(userId);
  if (memberships.length === 0) return null;
  if (preferredStoreId) {
    const match = memberships.find((m) => String(m.storeId) === preferredStoreId);
    if (match) return match;
  }
  return memberships[0];
}

/**
 * True when the user has at least one PENDING invitation. Used to grant a
 * membership-less user temporary access to /admin/staff so they can accept.
 */
export async function hasPendingInvitation(userId: string): Promise<boolean> {
  const sb = createServiceClient();
  const { count } = await sb
    .from("workspace_invitations")
    .select("id", { count: "exact", head: true })
    .eq("invitee_id", userId)
    .eq("status", "pending");
  return (count ?? 0) > 0;
}
