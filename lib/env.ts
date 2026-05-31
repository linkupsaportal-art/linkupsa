/**
 * Validated environment variables.
 *
 * `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_*` are server-only — referencing
 * them from a "use client" file is a build-time error in Next.js.
 */
function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env: ${name}. See .env.example.`);
  }
  return value;
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  // Server-only secrets — empty string at build time is fine; runtime callers
  // (createServiceClient, sendOtpEmail) throw if these are still empty when
  // actually invoked.
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  // Optional — has a sensible default sender, override per environment.
  RESEND_FROM: process.env.RESEND_FROM ?? "LinkUp <noreply@portaliosa.com>",
  // Salla — server-only. Empty at build is fine; webhook handler refuses to
  // run without WEBHOOK_TOKEN, so a misconfigured deploy fails closed.
  SALLA_APP_ID: process.env.SALLA_APP_ID ?? "",
  SALLA_CLIENT_ID: process.env.SALLA_CLIENT_ID ?? "",
  SALLA_CLIENT_SECRET: process.env.SALLA_CLIENT_SECRET ?? "",
  SALLA_WEBHOOK_TOKEN: process.env.SALLA_WEBHOOK_TOKEN ?? "",
  // Public site base URL used to build absolute links in emails (invites,
  // notifications). Falls back to the production domain.
  SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.SITE_URL?.replace(/\/$/, "") ||
    "https://linkupdash.portaliosa.com",
} as const;
