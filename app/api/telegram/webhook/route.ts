import { NextResponse } from "next/server";
import { getTelegramBotSettings } from "@/lib/db/telegram-bot";
import { handleTelegramUpdate } from "@/lib/notifications/telegram-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Telegram bot webhook receiver.
 *
 * Path:    /api/telegram/webhook
 * Method:  POST (Telegram), GET liveness
 * Auth:    `X-Telegram-Bot-Api-Secret-Token` header must match the
 *          `webhook_secret` we registered with `setWebhook`. Telegram
 *          enforces this on every delivery.
 *
 * Behavior:
 *   1. Verify secret in constant-ish time (string equality is fine here
 *      because the secret is never user-supplied).
 *   2. Hand the update body to `handleTelegramUpdate` which encapsulates
 *      the full state machine (order# → last4 → credentials → /code).
 *   3. Always return 200 quickly so Telegram doesn't retry.
 */
export async function POST(req: Request): Promise<NextResponse> {
  let settings;
  try {
    settings = await getTelegramBotSettings();
  } catch (err) {
    console.error("[telegram.webhook] failed to load settings", err);
    return NextResponse.json({ ok: false, error: "config_load_failed" }, { status: 500 });
  }

  if (!settings.enabled) {
    return NextResponse.json({ ok: false, error: "bot_disabled" }, { status: 200 });
  }
  if (!settings.bot_token || !settings.webhook_secret) {
    return NextResponse.json(
      { ok: false, error: "bot_not_configured" },
      { status: 200 },
    );
  }

  const headerSecret = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (headerSecret !== settings.webhook_secret) {
    return NextResponse.json({ ok: false, error: "bad_secret" }, { status: 401 });
  }

  let update: unknown;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Telegram considers a 200 within ~30s a success. We await the full
  // handler so Vercel doesn't kill the process mid-write — earlier
  // fire-and-forget left sessions empty in the DB.
  try {
    await handleTelegramUpdate(update as never, settings.bot_token);
  } catch (err) {
    console.error("[telegram.webhook] handler error", err);
  }

  return NextResponse.json({ ok: true });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true, service: "telegram.webhook" });
}
