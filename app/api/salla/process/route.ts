import { NextResponse } from "next/server";
import { processInbox } from "@/lib/salla/order-ingestor";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Pro: up to 60s

/**
 * POST /api/salla/process
 *
 * Drains the webhook_events inbox and processes pending order events.
 * Called by:
 *   - Vercel Cron (every minute in production)
 *   - Manual trigger from admin panel
 *   - The webhook receiver itself (for immediate processing)
 *
 * Auth: Bearer SALLA_WEBHOOK_TOKEN, or Vercel's CRON_SECRET header
 *       (Vercel sets this automatically on cron-triggered requests).
 */
function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization") ?? "";
  // Vercel cron sends `Authorization: Bearer <CRON_SECRET>` automatically
  // when CRON_SECRET env is set. We accept either CRON_SECRET or our
  // own SALLA_WEBHOOK_TOKEN — both are server-only secrets.
  const tokens = [
    `Bearer ${env.SALLA_WEBHOOK_TOKEN}`,
    process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null,
  ].filter(Boolean);
  return tokens.includes(auth);
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const stats = await processInbox();
  return NextResponse.json({ ok: true, ...stats });
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const stats = await processInbox();
  return NextResponse.json({ ok: true, ...stats });
}
