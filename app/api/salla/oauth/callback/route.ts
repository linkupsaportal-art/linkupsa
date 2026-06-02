import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, createClient } from "@/lib/supabase/server";
import {
  computeTokenExpiry,
  exchangeCodeForToken,
  fetchUserInfo,
  hashState,
} from "@/lib/salla/oauth";
import { refreshStoreInfo } from "@/lib/salla/store-info";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Salla OAuth — callback endpoint.
 *
 * Path:    /api/salla/oauth/callback
 * Method:  GET
 *
 * Salla redirects here after the merchant approves the install. Query
 * params:
 *   code  — the authorization code we exchange for tokens
 *   state — round-tripped from the kickoff route, validated via cookie
 *   scope — granted scopes (informational)
 *
 * On success we upsert the store row, kick off a background storefront
 * info refresh, and bounce the user to /admin/integrations with a flash.
 * On failure we render a small HTML page with the reason — easier to debug
 * than a JSON 500 in the merchant's browser.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const errorDesc = url.searchParams.get("error_description");

  // Salla can redirect with ?error=... if the merchant cancels.
  if (errorParam) {
    return renderError(errorDesc ?? errorParam, "تم إلغاء الربط");
  }

  if (!code || !state) {
    return renderError("Missing code or state from Salla.", "ربط غير مكتمل");
  }

  // CSRF check: the cookie holds the raw state we generated; the URL holds
  // the same value Salla bounced back. Hash both and compare.
  // Note: For public apps installed directly from Salla App Store (Easy Mode),
  // the flow begins on Salla, so the state cookies will not exist in the browser.
  // We only enforce CSRF validation if the cookies exist (indicating the kickoff
  // was triggered from our own dashboard).
  const cookieRaw = req.cookies.get("salla_oauth_state_raw")?.value;
  const cookieHash = req.cookies.get("salla_oauth_state")?.value;
  if (cookieRaw && cookieHash) {
    if (cookieRaw !== state || hashState(state) !== cookieHash) {
      return renderError("State mismatch — possible CSRF.", "حماية CSRF");
    }
  }

  const origin = url.origin;
  const redirectUri = `${origin}/api/salla/oauth/callback`;

  // 1. Exchange the code for tokens.
  let tokens;
  try {
    tokens = await exchangeCodeForToken({ code, redirectUri });
  } catch (err) {
    return renderError(
      `Token exchange failed: ${(err as Error).message}`,
      "فشل تبادل المفاتيح",
    );
  }

  // 2. Look up the merchant id — OAuth doesn't include it in the token
  //    response. Use Salla's user-info endpoint with the new access token.
  let merchantId: number | null = null;
  let merchantName: string | null = null;
  try {
    const info = await fetchUserInfo(tokens.access_token);
    const m = info.data?.merchant;
    if (m?.id) {
      merchantId = m.id;
      merchantName = m.name ?? null;
    } else if (info.data?.id) {
      // Some Salla accounts return the store id at data.id directly.
      merchantId = info.data.id;
      merchantName = info.data.name ?? null;
    }
  } catch (err) {
    return renderError(
      `Could not read merchant identity: ${(err as Error).message}`,
      "تعذّر قراءة هوية المتجر",
    );
  }

  if (!merchantId) {
    return renderError(
      "Salla returned tokens but no merchant id.",
      "نقص في بيانات المتجر",
    );
  }

  // 3. Persist tokens. Mirror the schema written by the Easy-Mode webhook
  //    handler so both flows share the same `salla_stores` row shape.
  const sb = createServiceClient();
  const expiresAt = computeTokenExpiry(tokens);

  const { error: upsertError } = await sb
    .from("salla_stores")
    .upsert(
      {
        store_id: merchantId,
        store_name: merchantName,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: expiresAt,
        scope: tokens.scope ?? null,
        installed_at: new Date().toISOString(),
        uninstalled_at: null,
      },
      { onConflict: "store_id" },
    );

  if (upsertError) {
    return renderError(
      `Database write failed: ${upsertError.message}`,
      "فشل حفظ بيانات المتجر",
    );
  }

  // 3b. Grant the signed-in user an OWNER membership for this store. This is
  //     what unlocks the real dashboard — access is gated on a store_members
  //     row, not on having connected a store globally. We only auto-grant
  //     ownership when the store has NO owner yet; if someone already owns it
  //     the connector joins as a manager instead (never silently hijacks).
  try {
    const userClient = await createClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();

    if (user) {
      const { data: existingOwner } = await sb
        .from("store_members")
        .select("user_id")
        .eq("store_id", merchantId)
        .eq("is_owner", true)
        .maybeSingle();

      const isOwner = !existingOwner || existingOwner.user_id === user.id;

      await sb.from("store_members").upsert(
        {
          store_id: merchantId,
          user_id: user.id,
          role: "manager",
          is_owner: isOwner,
        },
        { onConflict: "store_id,user_id" },
      );
    }
  } catch {
    // Non-fatal: the store row is saved; if membership grant fails the user
    // can retry "تحديث الحالة" which re-runs this path.
  }

  // 4. Kick off a best-effort storefront info refresh — populates
  //    store_url / domain / logo so the dashboard shows linkup.sa instead
  //    of a bare merchant id. Failures are non-fatal.
  void refreshStoreInfo({
    storeId: merchantId,
    accessToken: tokens.access_token,
  });

  // 5. Bounce to the dashboard. The user now has an owner membership so the
  //    real shell + analytics render. Clear the single-use OAuth cookies.
  const dest = new URL("/admin?connected=1", origin);
  const res = NextResponse.redirect(dest, 302);
  res.cookies.delete("salla_oauth_state");
  res.cookies.delete("salla_oauth_state_raw");
  return res;
}

/**
 * Tiny HTML error page — easier for merchants to read than JSON. Localised
 * heading in Arabic, technical detail in a <pre> below.
 */
function renderError(detail: string, headingAr: string): NextResponse {
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(headingAr)}</title>
  <style>
    body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
           max-width: 560px; margin: 80px auto; padding: 24px;
           background: #0b1220; color: #e2e8f0; }
    h1 { font-size: 22px; margin: 0 0 12px; }
    pre { background: #1e293b; padding: 16px; border-radius: 8px;
          color: #fbbf24; white-space: pre-wrap; word-break: break-word; }
    a { color: #60a5fa; }
  </style>
</head>
<body>
  <h1>${escapeHtml(headingAr)}</h1>
  <p>تعذّر إكمال ربط متجر سلة. التفاصيل التقنية أدناه.</p>
  <pre>${escapeHtml(detail)}</pre>
  <p><a href="/admin/integrations">↩ العودة إلى لوحة التحكم</a></p>
</body>
</html>`;
  return new NextResponse(html, {
    status: 400,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
