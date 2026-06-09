"use server";

import { revalidatePath } from "next/cache";
import {
  upsertNotificationChannel,
  setChannelEnabled,
  getActiveStoreId,
  type ChannelKind,
  type WhatsAppConfig,
  type EmailConfig,
} from "@/lib/db/notifications";
import { verifyKarzoun, sendKarzounWhatsApp } from "@/lib/notifications/whatsapp-karzoun";
import { verifyResendKey, sendOrderReadyEmail } from "@/lib/notifications/email";

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
  revalidatePath("/admin/messages/whatsapp");
  return { ok: true };
}

export async function saveWhatsAppTemplatesAction(templates: any[]): Promise<ActionResult> {
  const storeId = await getActiveStoreId();
  if (!storeId) return { ok: false, error: "لا يوجد متجر مرتبط حالياً" };

  const { getNotificationChannel, upsertNotificationChannel } = await import("@/lib/db/notifications");
  const channelRow = await getNotificationChannel({ storeId, channel: "whatsapp" });
  
  const currentConfig = channelRow?.config ?? {};
  const newConfig = {
    ...currentConfig,
    custom_templates: templates,
  };

  await upsertNotificationChannel({
    storeId,
    channel: "whatsapp",
    enabled: channelRow ? channelRow.enabled : false,
    config: newConfig,
  });

  revalidatePath("/admin/messages/whatsapp");
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

/* ─── Email quick toggle ─────────────────────────────────────────────── */

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
      api_key: input.config.api_key?.trim() || undefined,
      verified_domain: input.config.verified_domain?.trim() || undefined,
      from: input.config.from?.trim() || undefined,
      reply_to: input.config.reply_to?.trim() || undefined,
    },
  });
  revalidatePath("/admin/notifications");
  revalidatePath("/admin/messages/email");
  return { ok: true };
}

export async function testEmailConnectionAction(input: {
  apiKey: string;
}): Promise<ActionResult<{ domains: number }>> {
  const r = await verifyResendKey({ apiKey: input.apiKey });
  return r.ok ? { ok: true, data: { domains: r.domains } } : { ok: false, error: r.error };
}

export async function sendEmailTestMessageAction(input: {
  apiKey?: string;
  verifiedDomain?: string;
  from?: string;
  replyTo?: string;
  to: string;
}): Promise<ActionResult> {
  // Default From: explicit > noreply@<verified_domain> > env default.
  const resolvedFrom =
    input.from?.trim() ||
    (input.verifiedDomain?.trim()
      ? `LinkUp <noreply@${input.verifiedDomain.trim()}>`
      : undefined);
  const r = await sendOrderReadyEmail({
    to: input.to,
    customerName: "اختبار",
    orderNumber: "TEST-1234",
    productName: "اختبار قناة البريد",
    pickupUrl: "https://www.portaliosa.com/pickup",
    overrides: {
      apiKey: input.apiKey,
      from: resolvedFrom,
      replyTo: input.replyTo,
    },
  });
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? "unknown" };
}

export async function toggleChannelAction(input: {
  channel: ChannelKind;
  enabled: boolean;
}): Promise<ActionResult> {
  const storeId = await getActiveStoreId();
  if (!storeId) return { ok: false, error: "لا يوجد متجر مرتبط حالياً" };
  await setChannelEnabled({ storeId, channel: input.channel, enabled: input.enabled });
  revalidatePath("/admin/notifications");
  revalidatePath("/admin/messages/whatsapp");
  revalidatePath("/admin/messages/email");
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
