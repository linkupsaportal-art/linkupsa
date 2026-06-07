import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

const SALLA_API = "https://api.salla.dev/admin/v2";

/**
 * Fetches the merchant's storefront info from Salla and persists the
 * URL / domain / logo onto our `salla_stores` row. Called from the
 * `app.store.authorize` handler so the dashboard has a clickable
 * storefront link from minute one, and from a manual refresh button
 * on the integrations page.
 *
 * Best-effort: failures are swallowed and logged. The merchant row is
 * already created by the auth handler; this function only enriches it.
 */
export async function refreshStoreInfo(opts: {
  storeId: number;
  accessToken: string;
}): Promise<{ ok: true; storeUrl: string | null } | { ok: false; error: string }> {
  try {
    // Guard against placeholder / empty tokens — the store was wired via
    // webhook-only and never completed the full OAuth flow.
    if (
      !opts.accessToken ||
      opts.accessToken.startsWith("placeholder") ||
      opts.accessToken.length < 30
    ) {
      return {
        ok: false,
        error: "لا يوجد رمز وصول صالح. الربط تم عبر الويب هوك فقط.",
      };
    }

    const r = await fetch(`${SALLA_API}/store/info`, {
      headers: {
        authorization: `Bearer ${opts.accessToken}`,
        accept: "application/json",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!r.ok) {
      if (r.status === 401) {
        return {
          ok: false,
          error: "رمز الوصول منتهي الصلاحية. أعد ربط المتجر عبر سلة.",
        };
      }
      return { ok: false, error: `HTTP ${r.status}` };
    }
    const json = (await r.json()) as {
      data?: {
        name?: string;
        domain?: string;
        avatar?: string;
      };
    };
    const data = json.data ?? {};
    const storeUrl = (data.domain ?? "").trim() || null;
    const storeDomain = storeUrl ? extractDomain(storeUrl) : null;

    const sb = createServiceClient();
    await sb
      .from("salla_stores")
      .update({
        store_name: data.name ?? null,
        store_url: storeUrl,
        store_domain: storeDomain,
        store_logo_url: data.avatar ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", opts.storeId);
    return { ok: true, storeUrl };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "network error" };
  }
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.host;
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }
}
