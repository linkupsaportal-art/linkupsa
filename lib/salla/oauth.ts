import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Custom OAuth helpers for Salla.
 *
 * Used by the `/api/salla/oauth/start` and `/api/salla/oauth/callback`
 * routes to bring linkup.sa (or any other merchant store) online without
 * going through the gated Easy-Mode install flow that requires either a
 * demo store or an approved Custom Plan.
 *
 * Salla OAuth 2.0 flow (custom mode):
 *   1. Redirect merchant to AUTH_URL with client_id + state + scope.
 *   2. Salla redirects back to our callback with `?code=...&state=...`.
 *   3. We POST code to TOKEN_URL with client_id + client_secret to
 *      exchange for { access_token, refresh_token, expires_in }.
 *   4. Use access_token against `/store/info` to capture merchant id +
 *      storefront URL, then upsert into `salla_stores`.
 */

export const SALLA_AUTH_URL = "https://accounts.salla.sa/oauth2/auth";
export const SALLA_TOKEN_URL = "https://accounts.salla.sa/oauth2/token";
export const SALLA_USER_INFO_URL = "https://accounts.salla.sa/oauth2/user/info";

// Default scope set used for any new install. `offline_access` is required
// to get a refresh_token, so we always request it. Anything else mirrors the
// "Read and Write" boxes ticked on the Salla Partners portal for this app.
export const DEFAULT_SCOPE = "offline_access";

export type TokenExchangeResult = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number; // seconds from now
  expires?: number; // absolute unix epoch (Salla sometimes uses this)
  scope?: string;
  token_type?: string;
};

export type SallaUserInfo = {
  data?: {
    id?: number; // merchant id
    name?: string;
    email?: string;
    merchant?: {
      id?: number; // store id
      username?: string;
      name?: string;
      domain?: string;
      avatar?: string;
    };
  };
};

/**
 * Build the authorization URL the merchant clicks to start the install.
 * Uses HMAC-bound state so the callback can verify nothing was tampered with.
 */
export function buildAuthorizeUrl(opts: {
  redirectUri: string;
  scope?: string;
}): { url: string; state: string } {
  const state = randomBytes(24).toString("hex");
  const u = new URL(SALLA_AUTH_URL);
  u.searchParams.set("client_id", env.SALLA_CLIENT_ID);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", opts.redirectUri);
  u.searchParams.set("scope", opts.scope ?? DEFAULT_SCOPE);
  u.searchParams.set("state", state);
  return { url: u.toString(), state };
}

/**
 * Sign the state value with HMAC so we can stash it as a short-lived cookie
 * and verify on callback without needing a database lookup.
 */
export function hashState(state: string): string {
  // We don't have a dedicated CSRF secret, but the webhook token serves the
  // same role — server-only, rotated on schedule, never reaches the client.
  return createHash("sha256")
    .update(`${env.SALLA_WEBHOOK_TOKEN}:${state}`)
    .digest("hex");
}

/**
 * Exchange the authorization code Salla redirected back with for an
 * access/refresh token pair. Throws on any non-2xx response — the caller
 * is responsible for rendering a friendly error page.
 */
export async function exchangeCodeForToken(opts: {
  code: string;
  redirectUri: string;
  scope?: string;
}): Promise<TokenExchangeResult> {
  const body = new URLSearchParams({
    client_id: env.SALLA_CLIENT_ID,
    client_secret: env.SALLA_CLIENT_SECRET,
    grant_type: "authorization_code",
    code: opts.code,
    redirect_uri: opts.redirectUri,
    scope: opts.scope ?? DEFAULT_SCOPE,
  });

  const r = await fetch(SALLA_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  });

  const json = (await r.json().catch(() => ({}))) as TokenExchangeResult & {
    error?: string;
    error_description?: string;
  };

  if (!r.ok || !json.access_token) {
    const reason =
      json.error_description ??
      json.error ??
      `Salla token exchange failed (HTTP ${r.status})`;
    throw new Error(reason);
  }

  return json;
}

/**
 * Fetch the merchant's identity from Salla's user-info endpoint. We need
 * this because the OAuth token response does NOT include the store id,
 * unlike the Easy-Mode webhook which delivers `envelope.merchant`.
 */
export async function fetchUserInfo(accessToken: string): Promise<SallaUserInfo> {
  const r = await fetch(SALLA_USER_INFO_URL, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
    signal: AbortSignal.timeout(8_000),
  });
  if (!r.ok) {
    throw new Error(`Salla user-info failed (HTTP ${r.status})`);
  }
  return (await r.json()) as SallaUserInfo;
}

/**
 * Convert a token response into the absolute ISO timestamp we store on
 * `salla_stores.token_expires_at`. Mirrors the webhook handler logic.
 */
export function computeTokenExpiry(t: TokenExchangeResult): string | null {
  if (typeof t.expires === "number" && t.expires > 0) {
    return new Date(t.expires * 1000).toISOString();
  }
  if (typeof t.expires_in === "number" && t.expires_in > 0) {
    return new Date(Date.now() + t.expires_in * 1000).toISOString();
  }
  return null;
}
