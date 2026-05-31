"use server";

import { getCurrentUser, getCurrentRole } from "@/lib/supabase/server";
import { searchEverything, type SearchResults } from "@/lib/db/search";

/**
 * Command-palette search endpoint.
 *
 * Resolves the caller's store role from their membership (the access-control
 * source of truth) and runs a role-scoped search. A membership-less user
 * (fresh signup / pending invitee) gets nothing back — they have no store to
 * search, and this guarantees the global tables never leak to them.
 */
export async function globalSearchAction(query: string): Promise<SearchResults> {
  const empty: SearchResults = {
    orders: [], products: [], accounts: [], otp: [], bans: [], total: 0,
  };

  const user = await getCurrentUser();
  if (!user) return empty;

  const role = await getCurrentRole();
  if (!role) return empty; // no membership → no dashboard data

  const q = (query ?? "").trim();
  if (q.length < 2) return empty;

  try {
    return await searchEverything(q, role);
  } catch {
    return empty;
  }
}
