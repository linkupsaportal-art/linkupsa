import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getRetentionSettings } from "@/lib/db/platform-settings";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Nightly maintenance — archive old orders + purge old OTP logs.
 *
 * Triggered by Vercel Cron (see vercel.json: 02:00 UTC daily). Protected by a
 * shared secret so only Vercel (or an operator with the secret) can run it.
 *
 * Auth accepts either:
 *   - `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sets this when
 *     CRON_SECRET is configured), or
 *   - `?key=<CRON_SECRET>` for manual triggering from the admin "run now".
 *
 * Idempotent: re-running only affects rows that are still past the cutoff.
 * Note: database backups are handled automatically by Supabase (daily) — this
 * job is about application-level retention, not backups.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("authorization") ?? "";
  const keyParam = new URL(req.url).searchParams.get("key") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!env.CRON_SECRET || (bearer !== env.CRON_SECRET && keyParam !== env.CRON_SECRET)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await runMaintenance();
  return NextResponse.json(result);
}

/** Allow manual POST trigger too (admin button). Same auth rules. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return GET(req);
}

export async function runMaintenance(): Promise<{
  ok: boolean;
  archivedOrders: number;
  deletedOtpLogs: number;
  skipped?: boolean;
}> {
  const settings = await getRetentionSettings();
  if (!settings.enabled) {
    return { ok: true, archivedOrders: 0, deletedOtpLogs: 0, skipped: true };
  }

  const sb = createServiceClient();
  const now = Date.now();

  const orderCutoff = new Date(
    now - settings.archive_orders_after_days * 24 * 60 * 60 * 1000,
  ).toISOString();
  const otpCutoff = new Date(
    now - settings.delete_otp_logs_after_days * 24 * 60 * 60 * 1000,
  ).toISOString();

  // 1. Archive old, not-yet-archived orders.
  const { data: archived } = await sb
    .from("orders")
    .update({
      archived_at: new Date().toISOString(),
      archived_reason: "auto: retention policy",
    })
    .is("archived_at", null)
    .lte("created_at", orderCutoff)
    .select("id");

  // 2. Delete OTP logs older than the cutoff.
  const { data: deleted } = await sb
    .from("otp_logs")
    .delete()
    .lte("requested_at", otpCutoff)
    .select("id");

  return {
    ok: true,
    archivedOrders: archived?.length ?? 0,
    deletedOtpLogs: deleted?.length ?? 0,
  };
}
