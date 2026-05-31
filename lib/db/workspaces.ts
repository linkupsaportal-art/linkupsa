import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { ROLE_LABELS, type Role } from "@/lib/auth/rbac";

/**
 * Workspace resolution for the navbar workspace switcher.
 *
 * The platform is currently single-tenant: there is one shared store
 * dashboard, and invited staff work on it with their assigned role. This
 * resolver returns the list of workspaces a user can switch between.
 *
 * Today that list is: the connected store(s) in `salla_stores` (usually one),
 * each tagged with the user's role. The shape is intentionally a list so that
 * when true multi-tenant membership lands (a `memberships` table linking users
 * to multiple stores with per-store roles), this function expands without the
 * UI changing.
 */

export type Workspace = {
  /** Stable id used as the switcher value. Store id, or "self" fallback. */
  id: string;
  /** Display name (store name or the user's own store_name). */
  name: string;
  /** Optional storefront domain for subtitle display. */
  domain: string | null;
  /** The current user's role in this workspace. */
  role: Role;
  /** Logo URL if available. */
  logoUrl: string | null;
  /** True for the workspace currently being viewed. */
  current: boolean;
};

export async function getWorkspacesForUser(userId: string): Promise<Workspace[]> {
  const sb = createServiceClient();

  // The user's role + own store name.
  const { data: profile } = await sb
    .from("profiles")
    .select("role, store_name")
    .eq("id", userId)
    .maybeSingle();
  const ownRole = (profile?.role as Role) ?? "manager";

  const list: Workspace[] = [];

  // 1. If the user is a manager, their own store(s) are workspaces.
  if (ownRole === "manager") {
    const { data: stores } = await sb
      .from("salla_stores")
      .select("store_id, store_name, store_domain, store_logo_url")
      .is("uninstalled_at", null)
      .order("installed_at", { ascending: true });
    for (const s of stores ?? []) {
      list.push({
        id: String(s.store_id),
        name: (s.store_name as string | null) || "متجر سلة",
        domain: (s.store_domain as string | null) ?? null,
        role: "manager",
        logoUrl: (s.store_logo_url as string | null) ?? null,
        current: false,
      });
    }
  }

  // 2. Workspaces the user ACCEPTED an invitation for (this is what the
  //    request means by "based on invitations he accepted").
  const { data: accepted } = await sb
    .from("workspace_invitations")
    .select("store_id, store_name, role")
    .eq("invitee_id", userId)
    .eq("status", "accepted");

  for (const inv of accepted ?? []) {
    const sid = String(inv.store_id);
    if (list.some((w) => w.id === sid)) continue; // already present (manager-owned)
    // Enrich with store info if available.
    const { data: store } = await sb
      .from("salla_stores")
      .select("store_name, store_domain, store_logo_url")
      .eq("store_id", inv.store_id)
      .maybeSingle();
    list.push({
      id: sid,
      name: (store?.store_name as string | null) || (inv.store_name as string | null) || "متجر سلة",
      domain: (store?.store_domain as string | null) ?? null,
      role: (inv.role as Role) ?? "support",
      logoUrl: (store?.store_logo_url as string | null) ?? null,
      current: false,
    });
  }

  // 3. Fallback: no workspace at all → show the user's own placeholder so the
  //    switcher renders meaningfully right after signup.
  if (list.length === 0) {
    list.push({
      id: "self",
      name: (profile?.store_name as string | null) || "متجري",
      domain: null,
      role: ownRole,
      logoUrl: null,
      current: true,
    });
  } else {
    list[0].current = true;
  }

  return list;
}

export { ROLE_LABELS };
