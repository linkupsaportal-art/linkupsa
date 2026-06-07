import { NextResponse } from "next/server";
import { recordWebhook } from "@/lib/salla/inbox";
import { dispatch } from "@/lib/salla/handlers";
import type { SallaWebhookEnvelope } from "@/lib/salla/types";
import { deliveryHash, verifySallaWebhook } from "@/lib/salla/verify";
import { resolveWebhookKey, autoLinkStore } from "@/lib/salla/auto-link";

export const runtime = "nodejs";
// Webhook payloads must NOT be cached or reused — every POST is a new event.
export const dynamic = "force-dynamic";

/**
 * Salla webhook receiver.
 *
 * Path:    /api/salla/webhook
 * Method:  POST (Salla also sends an occasional GET for liveness)
 * Auth:    X-Salla-Security-Strategy header + Token / Signature (see verify.ts)
 *
 * Behavior:
 *   1. Verify authenticity in constant time.
 *   2. Persist envelope to durable inbox (UNIQUE delivery_hash dedupes retries).
 *   3. Run a tiny synchronous dispatcher for auth/uninstall events.
 *   4. Return 200 within Salla's 30s timeout. Anything heavier runs async.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const rawBody = await req.text();

  // 1. Verify authenticity.
  // DEBUG: Log all incoming headers for troubleshooting
  const debugHeaders: Record<string, string> = {};
  req.headers.forEach((v, k) => { debugHeaders[k] = k === "authorization" ? v.substring(0, 12) + "..." : v; });
  console.log("[salla.webhook] Incoming headers:", JSON.stringify(debugHeaders));

  const verification = verifySallaWebhook(rawBody, req.headers);
  if (!verification.ok) {
    console.error("[salla.webhook] AUTH FAILED:", verification.reason, "| strategy:", req.headers.get("x-salla-security-strategy"), "| auth:", req.headers.get("authorization")?.substring(0, 20));
    // Salla retries on non-2xx. 401 is the right signal for a bad signature.
    return NextResponse.json(
      { error: "unauthorized", reason: verification.reason },
      { status: 401 },
    );
  }

  // 2. Parse — body is small (<1MB) and JSON. Reject malformed early.
  let envelope: SallaWebhookEnvelope;
  try {
    envelope = JSON.parse(rawBody) as SallaWebhookEnvelope;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!envelope?.event) {
    return NextResponse.json({ error: "missing_event" }, { status: 400 });
  }

  // 2b. Auto-link: if a per-user portaliosa key is present AND the payload
  //     has a merchant id, automatically link the store to the user.
  //     MUST be awaited — fire-and-forget causes Vercel to terminate the
  //     serverless function before the store_members upsert completes.
  const webhookKey = resolveWebhookKey(req.headers);
  if (webhookKey && envelope.merchant) {
    try {
      // Extract store metadata from data.store if present (order events include it)
      const dataStore = (envelope.data as Record<string, unknown> | undefined)?.store as
        | { id?: number; name?: string; url?: string }
        | undefined;
      const storeMeta = dataStore
        ? { name: dataStore.name, url: dataStore.url }
        : undefined;

      const linkResult = await autoLinkStore(webhookKey, envelope.merchant, storeMeta);
      console.log("[salla.auto-link] result:", linkResult ? `linked → ${linkResult.userId.substring(0, 8)}...` : "no match");
    } catch (err) {
      console.error("[salla.auto-link] failed:", err);
    }
  }

  // 3. Persist to inbox. Duplicates are acked to break Salla's retry loop.
  const hash = deliveryHash(envelope, rawBody);
  const headerSnapshot = collectInterestingHeaders(req.headers);
  const stored = await recordWebhook({
    deliveryHash: hash,
    rawBody,
    envelope,
    headers: headerSnapshot,
  });

  if (stored.duplicate) {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (stored.id == null) {
    // Inbox write failed for a reason other than duplicate. Returning 5xx
    // makes Salla retry, which is the safer choice — we'd rather replay than
    // silently lose a payment-completed event.
    return NextResponse.json(
      { error: "inbox_write_failed", detail: stored.error },
      { status: 500 },
    );
  }

  // 4. Dispatch the lightweight in-band handlers. Failures here surface in
  //    the inbox row (status=failed) but do not change the response — Salla
  //    has already delivered, retrying won't help.
  try {
    await dispatch(envelope, stored.id);
  } catch (err) {
    // Best-effort logging through the inbox row. Console as a fallback.
    console.error("[salla.dispatch]", envelope.event, err);
  }

  // 5. For order events, kick the processor asynchronously so the order
  //    gets ingested without waiting for a cron tick.
  const ORDER_EVENTS = new Set([
    "order.created",
    "order.updated",
    "order.status.updated",
    "order.payment.updated",
    "invoice.created",
  ]);
  if (ORDER_EVENTS.has(envelope.event)) {
    const origin = new URL(req.url).origin;
    fetch(`${origin}/api/salla/process`, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.SALLA_WEBHOOK_TOKEN ?? ""}` },
    }).catch(() => {/* best-effort */});
  }

  // 6. Forward to the legacy سلة سينك endpoint (sallasync.com) so the old
  //    system keeps working as a fallback. Fire-and-forget — we never wait
  //    for sallasync.com's response and our 200 is independent of it.
  forwardToLegacy(rawBody, req.headers).catch(() => {/* best-effort */});

  return NextResponse.json({ ok: true, event: envelope.event, id: stored.id });
}

/**
 * Relay the verified payload to the legacy sallasync.com endpoint.
 * This runs asynchronously after we've already acked to Salla.
 * If sallasync.com is down or slow, our pipeline is unaffected.
 */
const LEGACY_WEBHOOK_URL =
  "https://sallasync.com/endpoint/v2/digital_accounts/linkup.sa/index.php" +
  "?sid=1075453390&did=linkup.sa&uid=linkupsaudi127" +
  "&pid=8d04668669d7a3d75aae1be390d52d97&platform=salla&cid=digital_accounts";

async function forwardToLegacy(body: string, headers: Headers): Promise<void> {
  try {
    await fetch(LEGACY_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": headers.get("content-type") ?? "application/json",
        "user-agent": "PortalioSA-Relay/1.0",
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    console.error("[salla.relay] forward to sallasync.com failed:", err);
  }
}

/**
 * Liveness probe convenience: lets you (and Salla's "Test Webhook" UI) hit the
 * URL in a browser without seeing 405. Returns 200 with a short identifier.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true, service: "salla.webhook" });
}

function collectInterestingHeaders(h: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of [
    "x-salla-security-strategy",
    "x-salla-signature",
    "x-salla-token",
    "x-salla-event",
    "x-portaliosa-key",
    "user-agent",
    "content-type",
  ]) {
    const v = h.get(key);
    if (v) out[key] = v;
  }
  return out;
}
