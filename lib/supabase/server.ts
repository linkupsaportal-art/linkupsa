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
 * Cached RBAC role lookup for the current user. Reads profiles.role via the
 * service client (bypasses RLS — trusted server context). Defaults to
 * "manager" if no row/role found so legacy users keep working, but returns
 * null when there's no authenticated user at all.
 */
export const getCurrentRole = cache(async (): Promise<import("@/lib/auth/rbac").Role | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    const admin = createServiceClient();
    const { data } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = data?.role;
    const { isRole, DEFAULT_ROLE } = await import("@/lib/auth/rbac");
    return isRole(role) ? role : DEFAULT_ROLE;
  } catch {
    const { DEFAULT_ROLE } = await import("@/lib/auth/rbac");
    return DEFAULT_ROLE;
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
