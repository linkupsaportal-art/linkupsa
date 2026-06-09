/**
 * Validated environment variables.
 *
 * `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_*` are server-only — referencing
 * them from a "use client" file is a build-time error in Next.js.
 */
function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    // Avoid blocking production builds/static page generation if env vars are missing
    if (
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.VERCEL === "1" ||
      process.env.NODE_ENV === "production"
    ) {
      console.warn(`[Build Warning] Missing required environment variable: ${name}`);
      return "";
    }
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
  // Cloudflare Turnstile (captcha) on the public pickup page. Public site key
  // ships to the browser; the secret verifies tokens server-side. When BOTH
  // are empty the captcha gate is skipped (graceful no-op for local dev).
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY ?? "",
  // App-layer AES-256-GCM key (base64, 32 bytes) for encrypting account
  // secrets at rest (password, TOTP seed, Steam secret, card code, IMAP creds).
  // Server-only. Empty → encryption helpers throw when invoked.
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ?? "",
  // Shared secret guarding cron endpoints (archive / cleanup). Vercel Cron
  // sends it in the Authorization header as `Bearer <CRON_SECRET>`.
  CRON_SECRET: process.env.CRON_SECRET ?? "",
  // Optional global IMAP fallback for Email-Code accounts (testing only).
  IMAP_TEST_HOST: process.env.IMAP_TEST_HOST ?? "",
  IMAP_TEST_PORT: process.env.IMAP_TEST_PORT ?? "993",
  IMAP_TEST_USER: process.env.IMAP_TEST_USER ?? "",
  IMAP_TEST_PASSWORD: process.env.IMAP_TEST_PASSWORD ?? "",
} as const;
