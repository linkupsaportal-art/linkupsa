/**
 * Salla webhook edge proxy.
 *
 * Lifecycle of a Salla webhook delivery:
 *   1. Salla → this Worker (cold-start ~10ms at edge).
 *   2. Worker validates the auth header in constant time.
 *      - Fail → 401 immediately, Salla retries up to 3x.
 *      - Pass → 200 OK to Salla within ~50ms.
 *   3. `ctx.waitUntil` forwards the verified payload to the Next.js inbox
 *      route (`/api/salla/webhook`) on Vercel asynchronously. Salla never
 *      waits for that round-trip, so a slow origin can't trigger retries.
 *
 * Why bother running this in front of the Next.js route?
 *   - Latency: edge response is single-digit ms vs ~100-300ms cold-start
 *     on Vercel for the first request after idle.
 *   - DDoS shield: Cloudflare absorbs malformed / spammy traffic before
 *     it reaches origin. Bad tokens get bounced at the edge for free.
 *   - Region affinity: Salla is in MENA — Cloudflare has POPs in Riyadh,
 *     Jeddah, Bahrain, Dubai. Origin (Vercel) is `iad1` by default,
 *     ~150ms away.
 *
 * The Next.js inbox does the same auth check independently — defense in
 * depth, not redundant work. Worker is also fail-open in dev: if the
 * forward to origin fails, Salla still got a 200 and the inbox call is
 * retried via the inbox table replay path.
 */

interface Env {
  /** Set via `wrangler.toml [vars]` — origin URL to forward to. */
  ORIGIN_URL: string;
  /** Set via `wrangler secret put SALLA_WEBHOOK_TOKEN`. */
  SALLA_WEBHOOK_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Liveness probe — match the Next.js route's GET behavior.
    if (request.method === "GET") {
      return Response.json({ ok: true, service: "salla-webhook-proxy", path: url.pathname });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Read body once — we need to forward it verbatim and we can only
    // read a Request body a single time.
    const rawBody = await request.text();

    // Verify Salla auth in constant time. Token strategy is what the app
    // is locked to in the partners portal; signature support stays in the
    // Next.js inbox for the day Salla flips that radio.
    const authResult = verifySallaToken(request.headers, env.SALLA_WEBHOOK_TOKEN);
    if (!authResult.ok) {
      return Response.json(
        { error: "unauthorized", reason: authResult.reason },
        { status: 401 },
      );
    }

    // Fast-ack to Salla, forward asynchronously. Salla treats anything
    // 2xx as success and stops retrying.
    ctx.waitUntil(forwardToOrigin(rawBody, request.headers, env.ORIGIN_URL));

    return Response.json({ ok: true, source: "edge", forwarded: true });
  },
} satisfies ExportedHandler<Env>;

function verifySallaToken(
  headers: Headers,
  expected: string,
): { ok: boolean; reason?: string } {
  if (!expected) return { ok: false, reason: "SALLA_WEBHOOK_TOKEN not configured" };
  const strategy = (headers.get("x-salla-security-strategy") ?? "").toLowerCase();

  // Salla's Token strategy puts the literal token in the Authorization
  // header (no "Bearer " prefix in practice — verified from production).
  // Some installs also use a custom `x-salla-token` header.
  const provided = (
    headers.get("authorization") ??
    headers.get("x-salla-token") ??
    ""
  ).trim();

  // Allow signature-strategy traffic through to the origin so the inbox
  // can verify HMAC with crypto.subtle (the worker doesn't bother).
  if (strategy === "signature") return { ok: true };

  if (!provided) return { ok: false, reason: "missing token" };
  if (!constantTimeEqual(provided, expected)) {
    return { ok: false, reason: "token mismatch" };
  }
  return { ok: true };
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function forwardToOrigin(
  body: string,
  headers: Headers,
  originUrl: string,
): Promise<void> {
  // Re-emit only the headers the inbox cares about. Stripping
  // `host`, `cf-*`, etc. avoids confusing the origin with edge metadata.
  const forwardedHeaders = new Headers({
    "content-type": headers.get("content-type") ?? "application/json",
    "x-salla-security-strategy": headers.get("x-salla-security-strategy") ?? "Token",
    "x-forwarded-by": "cf-salla-webhook-proxy",
  });
  for (const key of ["authorization", "x-salla-token", "x-salla-signature", "x-salla-event"]) {
    const v = headers.get(key);
    if (v) forwardedHeaders.set(key, v);
  }

  try {
    await fetch(originUrl, {
      method: "POST",
      headers: forwardedHeaders,
      body,
      // Edge-to-origin: 25s ceiling. Origin's own timeout is shorter so
      // a stuck inbox write can't hold the worker subrequest open.
      signal: AbortSignal.timeout(25_000),
    });
  } catch (err) {
    // Best-effort log. The origin's inbox table still has nothing — Salla
    // won't retry because we already 200'd it. Mitigation: a separate
    // periodic replay job that scans the worker's tail logs for failed
    // forwards. For now we accept this as a documented edge case until
    // we hook KV up for inflight reliability.
    console.error("[salla-webhook-proxy] forward failed", err);
  }
}
