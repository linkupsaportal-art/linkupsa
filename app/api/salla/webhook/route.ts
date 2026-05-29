import { NextResponse } from "next/server";
import { recordWebhook } from "@/lib/salla/inbox";
import { dispatch } from "@/lib/salla/handlers";
import type { SallaWebhookEnvelope } from "@/lib/salla/types";
import { deliveryHash, verifySallaWebhook } from "@/lib/salla/verify";

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
  const verification = verifySallaWebhook(rawBody, req.headers);
  if (!verification.ok) {
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

  return NextResponse.json({ ok: true, event: envelope.event, id: stored.id });
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
    "user-agent",
    "content-type",
  ]) {
    const v = h.get(key);
    if (v) out[key] = v;
  }
  return out;
}
