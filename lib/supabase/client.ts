"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Singleton Supabase client for the browser.
 * Reads/writes auth cookies via the SSR helper so server actions and the
 * middleware see the same session.
 */
export function createClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
