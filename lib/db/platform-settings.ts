import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Auto-ban rule shape. When `enabled`, every failed verification attempt
 * (limit_exceeded / phone_mismatch / cooldown / order_not_found / totp_error)
 * is counted per IP+phone within `window_minutes`. Crossing
 * `failures_threshold` triggers an automatic phone_bans insert with
 * `auto_banned = true`.
 *
 * `scope`:
 *   - "global"   → ban applies to every product (product_id = null).
 *   - "per-product" → ban applies only to the product of the failing order.
 */
export type AutoBanSettings = {
  enabled: boolean;
  failures_threshold: number;
  window_minutes: number;
  scope: "global" | "per-product";
};

/**
 * Pickup session timing. Controls the customer-facing idle behavior:
 *   - `idle_timeout_seconds` — credential view auto-locks after this many
 *     seconds of no mouse / keyboard / touch input on the page.
 *   - `totp_max_seconds` — hard cap on how long the TOTP block stays
 *     visible without manual interaction. Encourages the customer to
 *     copy the code instead of leaving it on screen indefinitely.
 */
export type PickupSessionSettings = {
  idle_timeout_seconds: number;
  totp_max_seconds: number;
};

const DEFAULT_AUTO_BAN: AutoBanSettings = {
  enabled: false,
  failures_threshold: 5,
  window_minutes: 60,
  scope: "global",
};

const DEFAULT_PICKUP_SESSION: PickupSessionSettings = {
  idle_timeout_seconds: 300, // 5 minutes
  totp_max_seconds: 180,     // 3 minutes (≈ 6 TOTP rotations)
};

export async function getAutoBanSettings(): Promise<AutoBanSettings> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("platform_settings")
    .select("value")
    .eq("key", "auto_ban")
    .maybeSingle();
  if (!data?.value) return DEFAULT_AUTO_BAN;
  return { ...DEFAULT_AUTO_BAN, ...(data.value as Partial<AutoBanSettings>) };
}

export async function updateAutoBanSettings(next: AutoBanSettings): Promise<void> {
  const sb = createServiceClient();
  const sanitized: AutoBanSettings = {
    enabled: !!next.enabled,
    failures_threshold: clamp(Math.round(next.failures_threshold), 1, 50),
    window_minutes: clamp(Math.round(next.window_minutes), 1, 24 * 60),
    scope: next.scope === "per-product" ? "per-product" : "global",
  };
  await sb
    .from("platform_settings")
    .upsert({ key: "auto_ban", value: sanitized, updated_at: new Date().toISOString() });
}

export async function getPickupSessionSettings(): Promise<PickupSessionSettings> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("platform_settings")
    .select("value")
    .eq("key", "pickup_session")
    .maybeSingle();
  if (!data?.value) return DEFAULT_PICKUP_SESSION;
  return { ...DEFAULT_PICKUP_SESSION, ...(data.value as Partial<PickupSessionSettings>) };
}

export async function updatePickupSessionSettings(
  next: PickupSessionSettings,
): Promise<void> {
  const sb = createServiceClient();
  const sanitized: PickupSessionSettings = {
    idle_timeout_seconds: clamp(Math.round(next.idle_timeout_seconds), 30, 60 * 30),
    totp_max_seconds: clamp(Math.round(next.totp_max_seconds), 30, 60 * 15),
  };
  await sb
    .from("platform_settings")
    .upsert({ key: "pickup_session", value: sanitized, updated_at: new Date().toISOString() });
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
