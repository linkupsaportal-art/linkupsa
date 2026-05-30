import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";

export type TelegramBotSettings = {
  id: string;
  bot_token: string | null;
  bot_username: string | null;
  operator_chat_id: string | null;
  enabled: boolean;
  mirror_orders: boolean;
  mirror_bans: boolean;
  pickup_flow_enabled: boolean;
  webhook_secret: string | null;
  webhook_url: string | null;
  webhook_set_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TelegramSettingsInput = {
  bot_token?: string | null;
  operator_chat_id?: string | null;
  enabled?: boolean;
  mirror_orders?: boolean;
  mirror_bans?: boolean;
  pickup_flow_enabled?: boolean;
};

/**
 * Loads the singleton bot config row, creating an empty one on first
 * read so callers always have something to render.
 */
export async function getTelegramBotSettings(): Promise<TelegramBotSettings> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("telegram_bot_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (data) return data as TelegramBotSettings;

  // Seed an empty row so subsequent updates are simple upserts.
  const { data: created, error } = await sb
    .from("telegram_bot_settings")
    .insert({})
    .select("*")
    .single();
  if (error) throw error;
  return created as TelegramBotSettings;
}

export async function updateTelegramBotSettings(
  input: TelegramSettingsInput,
): Promise<TelegramBotSettings> {
  const current = await getTelegramBotSettings();
  const sb = createServiceClient();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.bot_token !== undefined) patch.bot_token = input.bot_token?.trim() || null;
  if (input.operator_chat_id !== undefined)
    patch.operator_chat_id = input.operator_chat_id?.trim() || null;
  if (input.enabled !== undefined) patch.enabled = input.enabled;
  if (input.mirror_orders !== undefined) patch.mirror_orders = input.mirror_orders;
  if (input.mirror_bans !== undefined) patch.mirror_bans = input.mirror_bans;
  if (input.pickup_flow_enabled !== undefined)
    patch.pickup_flow_enabled = input.pickup_flow_enabled;
  const { data, error } = await sb
    .from("telegram_bot_settings")
    .update(patch)
    .eq("id", current.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as TelegramBotSettings;
}

/**
 * Persists a fresh webhook secret + URL onto the singleton. Called when
 * the operator hits "Register webhook" on the admin page. The secret is
 * generated server-side so it never appears in the UI.
 */
export async function persistWebhookRegistration(opts: {
  webhookUrl: string;
  webhookSecret: string;
  botUsername?: string | null;
}): Promise<TelegramBotSettings> {
  const current = await getTelegramBotSettings();
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("telegram_bot_settings")
    .update({
      webhook_url: opts.webhookUrl,
      webhook_secret: opts.webhookSecret,
      webhook_set_at: new Date().toISOString(),
      bot_username: opts.botUsername ?? current.bot_username ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as TelegramBotSettings;
}

/** Generates a 32-byte random secret suitable for Telegram's webhook header. */
export function freshWebhookSecret(): string {
  return randomBytes(24).toString("base64url");
}
