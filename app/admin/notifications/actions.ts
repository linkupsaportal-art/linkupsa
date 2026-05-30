"use server";

import { revalidatePath } from "next/cache";
import {
  upsertNotificationChannel,
  setChannelEnabled,
  getActiveStoreId,
  type ChannelKind,
  type WhatsAppConfig,
  type TelegramConfig,
  type EmailConfig,
} from "@/lib/db/notifications";
import { verifyKarzoun, sendKarzounWhatsApp } from "@/lib/notifications/whatsapp-karzoun";
import { verifyTelegramBot, sendTelegramMessage } from "@/lib/notifications/telegram";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/* ─── WhatsApp / Karzoun ─────────────────────────────────────────────── */

export async function saveWhatsAppConfigAction(input: {
  enabled: boolean;
  config: WhatsAppConfig;
}): Promise<ActionResult> {
  const storeId = await getActiveStoreId();
  if (!storeId) return { ok: false, error: "لا يوجد متجر مرتبط حالياً" };

  const c = input.config;
  if (!c.app_token?.trim() || !c.integration_id?.trim()) {
    return { ok: false, error: "App Token و Integration ID مطلوبان" };
  }

  await upsertNotificationChannel({
    storeId,
    channel: "whatsapp",
    enabled: input.enabled,
    config: {
      provider: "karzoun",
      host: c.host?.trim() || "akgroup.api.karzoun.chat",
      app_token: c.app_token.trim(),
      integration_id: c.integration_id.trim(),
      default_template: c.default_template?.trim() || "order_ready_v1",
      ban_template: c.ban_template?.trim() || "phone_ban_alert_v1",
      language: c.language?.trim() || "ar",
      store_name: c.store_name?.trim() || "متجرنا",
      param_map: c.param_map ?? {},
    },
  });
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function testWhatsAppConnectionAction(input: {
  host?: string;
  appToken: string;
  integrationId: string;
}): Promise<ActionResult<{ approvedTemplates: number }>> {
  const r = await verifyKarzoun({
    host: input.host,
    appToken: input.appToken,
    integrationId: input.integrationId,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, data: { approvedTemplates: r.approvedTemplates } };
}

export async function sendWhatsAppTestMessageAction(input: {
  recipient: string;
  template: string;
  params: string[];
}): Promise<ActionResult> {
  const storeId = await getActiveStoreId();
  if (!storeId) return { ok: false, error: "لا يوجد متجر مرتبط حالياً" };
  const cfg = await getStoreConfig(storeId, "whatsapp");
  if (!cfg) return { ok: false, error: "اضبط إعدادات الواتساب أولاً" };
  const r = await sendKarzounWhatsApp({
    to: input.recipient,
    template: input.template,
    params: input.params,
    config: {
      host: cfg.host as string | undefined,
      appToken: cfg.app_token as string,
      integrationId: cfg.integration_id as string,
      defaultTemplate: input.template,
      language: (cfg.language as string | undefined) ?? "ar",
    },
  });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/* ─── Telegram ───────────────────────────────────────────────────────── */

export async function saveTelegramConfigAction(input: {
  enabled: boolean;
  config: TelegramConfig;
}): Promise<ActionResult> {
  const storeId = await getActiveStoreId();
  if (!storeId) return { ok: false, error: "لا يوجد متجر مرتبط حالياً" };

  const c = input.config;
  if (!c.bot_token?.trim() || !c.chat_id?.trim()) {
    return { ok: false, error: "Bot Token و Chat ID مطلوبان" };
  }
  await upsertNotificationChannel({
    storeId,
    channel: "telegram",
    enabled: input.enabled,
    config: {
      bot_token: c.bot_token.trim(),
      chat_id: c.chat_id.trim(),
      mirror_orders: !!c.mirror_orders,
      mirror_bans: !!c.mirror_bans,
    },
  });
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function testTelegramConnectionAction(input: {
  botToken: string;
}): Promise<ActionResult<{ username: string }>> {
  const r = await verifyTelegramBot({ botToken: input.botToken });
  return r.ok ? { ok: true, data: { username: r.username } } : { ok: false, error: r.error };
}

export async function sendTelegramTestMessageAction(input: {
  botToken: string;
  chatId: string;
  text: string;
}): Promise<ActionResult> {
  const r = await sendTelegramMessage({
    text: input.text,
    config: { botToken: input.botToken, chatId: input.chatId },
  });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/* ─── Email / SMS quick toggle ───────────────────────────────────────── */

export async function saveEmailConfigAction(input: {
  enabled: boolean;
  config: EmailConfig;
}): Promise<ActionResult> {
  const storeId = await getActiveStoreId();
  if (!storeId) return { ok: false, error: "لا يوجد متجر مرتبط حالياً" };
  await upsertNotificationChannel({
    storeId,
    channel: "email",
    enabled: input.enabled,
    config: {
      from: input.config.from?.trim() || undefined,
      reply_to: input.config.reply_to?.trim() || undefined,
    },
  });
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function toggleChannelAction(input: {
  channel: ChannelKind;
  enabled: boolean;
}): Promise<ActionResult> {
  const storeId = await getActiveStoreId();
  if (!storeId) return { ok: false, error: "لا يوجد متجر مرتبط حالياً" };
  await setChannelEnabled({ storeId, channel: input.channel, enabled: input.enabled });
  revalidatePath("/admin/notifications");
  return { ok: true };
}

/* ─── Internal helper ─────────────────────────────────────────────── */

async function getStoreConfig(
  storeId: number,
  channel: ChannelKind,
): Promise<Record<string, unknown> | null> {
  const { getNotificationChannel } = await import("@/lib/db/notifications");
  const row = await getNotificationChannel({ storeId, channel });
  return row?.config ?? null;
}
