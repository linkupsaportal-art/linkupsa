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

  // The user's role (single source of truth for now).
  const { data: profile } = await sb
    .from("profiles")
    .select("role, store_name")
    .eq("id", userId)
    .maybeSingle();
  const role = (profile?.role as Role) ?? "manager";

  // Connected stores. In single-tenant mode this is the shared store list.
  const { data: stores } = await sb
    .from("salla_stores")
    .select("store_id, store_name, store_domain, store_logo_url")
    .is("uninstalled_at", null)
    .order("installed_at", { ascending: true });

  const list: Workspace[] = (stores ?? []).map((s, i) => ({
    id: String(s.store_id),
    name: (s.store_name as string | null) || "متجر سلة",
    domain: (s.store_domain as string | null) ?? null,
    role,
    logoUrl: (s.store_logo_url as string | null) ?? null,
    current: i === 0, // first/primary store is the active context for now
  }));

  // No connected store yet → show the user's own placeholder workspace so the
  // switcher still renders meaningfully right after signup.
  if (list.length === 0) {
    list.push({
      id: "self",
      name: (profile?.store_name as string | null) || "متجري",
      domain: null,
      role,
      logoUrl: null,
      current: true,
    });
  }

  return list;
}

export { ROLE_LABELS };
