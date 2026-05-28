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
  // Server-only — empty string at build time is fine; runtime callers throw if missing.
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  RESEND_FROM: process.env.RESEND_FROM ?? "LinkUp <noreply@portaliosa.com>",
} as const;
