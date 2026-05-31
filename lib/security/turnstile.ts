import "server-only";
import { env } from "@/lib/env";

/**
 * Cloudflare Turnstile server-side verification.
 *
 * The public pickup page is the only unauthenticated surface on the platform,
 * so it's the obvious target for automated (order# + last-4) guessing. The
 * browser solves a Turnstile challenge and posts the resulting token with the
 * lookup; here we confirm that token against Cloudflare's siteverify endpoint
 * before any DB work runs.
 *
 * Graceful degradation: when `TURNSTILE_SECRET_KEY` is unset (local dev, or
 * before keys are provisioned) verification is skipped and returns ok. The UI
 * mirrors this — it only renders the widget when the public site key exists.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileEnabled(): boolean {
  return Boolean(env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<{ ok: boolean; reason?: string }> {
  // No secret configured → captcha gate disabled (dev / not provisioned).
  if (!env.TURNSTILE_SECRET_KEY) return { ok: true };

  if (!token) return { ok: false, reason: "missing-token" };

  const body = new URLSearchParams();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  if (remoteIp && remoteIp !== "0.0.0.0") body.set("remoteip", remoteIp);

  try {
    const r = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(8_000),
    });
    const json = (await r.json().catch(() => ({}))) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (json.success) return { ok: true };
    return { ok: false, reason: (json["error-codes"] ?? ["verify-failed"]).join(",") };
  } catch {
    // Network/timeout against Cloudflare. Fail closed — a real user can retry,
    // and we never want to silently drop the protection on an outage.
    return { ok: false, reason: "verify-unreachable" };
  }
}
