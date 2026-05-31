import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { env } from "@/lib/env";

/**
 * Per-request Supabase client for Server Components / Server Actions / Route Handlers.
 * Cookies are read from the request and writes are forwarded to the response
 * (Next.js handles the actual Set-Cookie header on the streaming response).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies — middleware refreshes session instead.
        }
      },
    },
  });
}

/**
 * Cached `getUser()` per request — React cache deduplicates calls within the
 * same render tree so multiple Server Components can call this without each
 * one hitting Supabase Auth's REST API.
 *
 * Used by the admin layout + any page/component that needs the current user.
 */
export const getCurrentUser = cache(async () => {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
});

/**
 * Cached RBAC role lookup for the current user. Now reads the user's role
 * from their ACTIVE store membership (store_members) — the access-control
 * source of truth — instead of the global profiles.role. Returns null when
 * the user has no membership (no dashboard access) OR no auth session.
 */
export const getCurrentRole = cache(async (): Promise<import("@/lib/auth/rbac").Role | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    const admin = createServiceClient();
    const { data } = await admin
      .from("store_members")
      .select("role, is_owner")
      .eq("user_id", user.id)
      .order("is_owner", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null; // no membership → no access
    const { isRole } = await import("@/lib/auth/rbac");
    return isRole(data.role) ? data.role : null;
  } catch {
    return null;
  }
});

/**
 * Privileged client used ONLY in trusted server contexts (server actions,
 * route handlers) to bypass RLS for OTP verification, profile elevation,
 * etc. Never expose this client to the browser.
 */
export function createServiceClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env (see .env.example).",
    );
  }
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
