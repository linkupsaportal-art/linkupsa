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

  // Membership is the source of truth for which stores the user can access.
  const { data: memberships } = await sb
    .from("store_members")
    .select("store_id, role, is_owner")
    .eq("user_id", userId)
    .order("is_owner", { ascending: false })
    .order("created_at", { ascending: true });

  const list: Workspace[] = [];
  for (const m of memberships ?? []) {
    const { data: store } = await sb
      .from("salla_stores")
      .select("store_name, store_domain, store_logo_url")
      .eq("store_id", m.store_id)
      .maybeSingle();
    list.push({
      id: String(m.store_id),
      name: (store?.store_name as string | null) || "متجر سلة",
      domain: (store?.store_domain as string | null) ?? null,
      role: (m.role as Role) ?? "support",
      logoUrl: (store?.store_logo_url as string | null) ?? null,
      current: false,
    });
  }

  // Fallback placeholder so the switcher renders for a user with no store.
  if (list.length === 0) {
    const { data: profile } = await sb
      .from("profiles")
      .select("store_name")
      .eq("id", userId)
      .maybeSingle();
    list.push({
      id: "self",
      name: (profile?.store_name as string | null) || "متجري",
      domain: null,
      role: "manager",
      logoUrl: null,
      current: true,
    });
  } else {
    list[0].current = true;
  }

  return list;
}

export { ROLE_LABELS };
