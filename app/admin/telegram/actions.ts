"use server";

import { revalidatePath } from "next/cache";
import {
  getTelegramBotSettings,
  updateTelegramBotSettings,
  persistWebhookRegistration,
  freshWebhookSecret,
  type TelegramSettingsInput,
} from "@/lib/db/telegram-bot";
import { verifyTelegramBot, sendTelegramMessage } from "@/lib/notifications/telegram";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/* ─── Save / toggle ──────────────────────────────────────────────────── */

export async function saveTelegramBotConfigAction(
  input: TelegramSettingsInput,
): Promise<ActionResult> {
  try {
    if (input.bot_token !== undefined && !input.bot_token?.trim()) {
      return { ok: false, error: "Bot Token مطلوب" };
    }
    await updateTelegramBotSettings(input);
    revalidatePath("/admin/telegram");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ─── Verify token ───────────────────────────────────────────────────── */

export async function verifyTelegramBotAction(input: {
  botToken: string;
}): Promise<ActionResult<{ username: string }>> {
  if (!input.botToken?.trim()) return { ok: false, error: "Bot Token فارغ" };
  const r = await verifyTelegramBot({ botToken: input.botToken });
  if (!r.ok) return { ok: false, error: r.error };
  // Also persist the bot username so the admin UI can show it.
  await updateTelegramBotSettings({ bot_token: input.botToken });
  return { ok: true, data: { username: r.username } };
}

/* ─── Test message to operator chat ─────────────────────────────────── */

export async function sendOperatorTestMessageAction(): Promise<ActionResult> {
  const cfg = await getTelegramBotSettings();
  if (!cfg.bot_token || !cfg.operator_chat_id) {
    return { ok: false, error: "أكمل إعداد البوت ومحادثة المسؤول أولاً" };
  }
  const r = await sendTelegramMessage({
    text:
      "🧪 <b>اختبار اتصال</b>\nبوت تيليجرام مربوط بنجاح. ستصلك إشعارات الطلبات والحظر هنا.",
    config: { botToken: cfg.bot_token, chatId: cfg.operator_chat_id },
  });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/* ─── Register / unregister Telegram webhook ────────────────────────── */

const APP_HOST = "https://www.portaliosa.com";
const WEBHOOK_PATH = "/api/telegram/webhook";

export async function registerTelegramWebhookAction(): Promise<
  ActionResult<{ url: string }>
> {
  const cfg = await getTelegramBotSettings();
  if (!cfg.bot_token) return { ok: false, error: "أدخل Bot Token أولاً" };

  // Re-fetch the username so we can show it on the admin page.
  const meRes = await fetch(`https://api.telegram.org/bot${cfg.bot_token}/getMe`);
  const meJson = (await meRes.json().catch(() => null)) as
    | { ok: boolean; result?: { username?: string } }
    | null;
  if (!meJson?.ok) return { ok: false, error: "Bot Token غير صحيح" };

  const secret = freshWebhookSecret();
  const url = `${APP_HOST}${WEBHOOK_PATH}`;

  const setRes = await fetch(
    `https://api.telegram.org/bot${cfg.bot_token}/setWebhook`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        url,
        secret_token: secret,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true,
      }),
    },
  );
  const setJson = (await setRes.json().catch(() => null)) as
    | { ok: boolean; description?: string }
    | null;
  if (!setJson?.ok) {
    return {
      ok: false,
      error: setJson?.description ?? "Telegram رفض تسجيل الـ webhook",
    };
  }

  await persistWebhookRegistration({
    webhookUrl: url,
    webhookSecret: secret,
    botUsername: meJson.result?.username ?? null,
  });
  revalidatePath("/admin/telegram");
  return { ok: true, data: { url } };
}

export async function unregisterTelegramWebhookAction(): Promise<ActionResult> {
  const cfg = await getTelegramBotSettings();
  if (!cfg.bot_token) return { ok: false, error: "Bot Token غير محفوظ" };
  await fetch(
    `https://api.telegram.org/bot${cfg.bot_token}/deleteWebhook?drop_pending_updates=true`,
    { method: "POST" },
  ).catch(() => {});
  await updateTelegramBotSettings({ enabled: false });
  revalidatePath("/admin/telegram");
  return { ok: true };
}
