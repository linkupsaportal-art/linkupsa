import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MfaChallengeForm } from "./mfa-challenge-form";

/**
 * /login/mfa — second factor challenge.
 *
 * Server-renders the page IF:
 *   - user has an AAL1 session (post-password)
 *   - their `nextLevel` is aal2 (verified TOTP factor exists)
 *
 * Otherwise we bounce to /login or /admin appropriately. The proxy.ts
 * middleware ALSO enforces this — defense in depth.
 */
export default async function MfaChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aal || aal.currentLevel === "aal2" || aal.nextLevel !== "aal2") {
    redirect("/admin");
  }

  const { data: factors } = await sb.auth.mfa.listFactors();
  const totp = (factors?.totp ?? []).find((f) => f.status === "verified");
  if (!totp) redirect("/admin");

  const params = await searchParams;
  return (
    <MfaChallengeForm
      factorId={totp.id}
      next={params.next ?? "/admin"}
      maskedEmail={maskEmail(user.email ?? "")}
    />
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const masked =
    local.length <= 2 ? local : local[0] + "•".repeat(local.length - 2) + local.at(-1);
  return `${masked}@${domain}`;
}
