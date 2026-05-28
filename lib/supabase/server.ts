import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
