import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Salla webhook authenticity check.
 *
 * Two strategies are advertised by the Partners portal:
 *  - **Token**:    `x-salla-security-strategy: Token` and the static webhook secret
 *                  is appended verbatim to a token header. We compare with timingSafeEqual.
 *  - **Signature**: `x-salla-signature: <hex>` containing HMAC-SHA256(secret, raw_body).
 *
 * The merchant currently has Token strategy locked (radio is disabled in the
 * partners UI), but we also support Signature so a future flip doesn't require
 * a code change.
 *
 * Returns true on match, false otherwise. Never throws on bad input.
 */
export function verifySallaWebhook(
  rawBody: string,
  headers: Headers,
): { ok: boolean; reason?: string } {
  const secret = env.SALLA_WEBHOOK_TOKEN;
  if (!secret) return { ok: false, reason: "SALLA_WEBHOOK_TOKEN is not set" };

  // ── Universal token check ──────────────────────────────────────────
  // Salla's merchant-dashboard webhook config has TWO input fields per
  // custom header. In practice, the FIRST field is the VALUE and the
  // SECOND is the NAME — the opposite of what you'd expect. This means
  // our token ends up as the header KEY with "authorization" as value.
  //
  // We handle BOTH orientations:
  //   Normal:   authorization: <token>
  //   Reversed: <token>: authorization  (Salla's actual behavior)
  const authHeader = headers.get("authorization") ?? headers.get("x-salla-token") ?? "";
  if (authHeader && safeEqual(authHeader.trim(), secret)) {
    return { ok: true };
  }
  // Check if the token was sent as a header NAME (Salla reversal)
  const reversedCheck = headers.get(secret);
  if (reversedCheck !== null) {
    return { ok: true };
  }

  // ── Strategy-based fallbacks ───────────────────────────────────────
  const strategy = (headers.get("x-salla-security-strategy") ?? "").toLowerCase();

  // Token strategy: explicit match (already tried above, but try with
  // different header combinations just in case).
  if (strategy === "token") {
    return { ok: false, reason: "Token mismatch" };
  }

  // Signature strategy: HMAC-SHA256 of the raw body with the secret.
  if (strategy === "signature") {
    const provided = headers.get("x-salla-signature") ?? "";
    if (!provided) return { ok: false, reason: "Missing x-salla-signature" };
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    return safeEqual(provided.trim(), expected)
      ? { ok: true }
      : { ok: false, reason: "Signature mismatch" };
  }

  // No strategy and no token match — reject.
  return { ok: false, reason: `No matching auth method (strategy: "${strategy}")` };
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Stable delivery hash for idempotency. Salla does not send a delivery id, so
 * we synthesize one from (event + created_at + body) — replays produce the
 * exact same hash, allowing the inbox table to reject duplicates via UNIQUE.
 */
export function deliveryHash(payload: { event?: string; created_at?: string }, rawBody: string): string {
  const seed = `${payload.event ?? ""}|${payload.created_at ?? ""}|${rawBody}`;
  return createHash("sha256").update(seed).digest("hex");
}
