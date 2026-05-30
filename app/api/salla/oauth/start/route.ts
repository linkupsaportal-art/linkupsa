import { NextResponse, type NextRequest } from "next/server";
import { buildAuthorizeUrl, hashState } from "@/lib/salla/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Salla OAuth — kickoff endpoint.
 *
 * Path:    /api/salla/oauth/start
 * Method:  GET
 *
 * The merchant (or you, on their behalf) hits this URL to begin a Custom-
 * Mode install. We redirect them to Salla's hosted authorize page where
 * they grant the requested scope; Salla then redirects back to
 * `/api/salla/oauth/callback?code=...&state=...`.
 *
 * Why Custom Mode (instead of Easy Mode):
 *   Easy Mode requires either a demo store OR an approved Custom Plan
 *   that costs ≥ 999 SAR/month for paid private apps. Custom Mode is
 *   plain OAuth2 — no Salla-side gating, works for any merchant who is
 *   logged into their own Salla dashboard.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/salla/oauth/callback`;

  const { url, state } = buildAuthorizeUrl({ redirectUri });

  // Stash the HMAC of state in a short-lived cookie. The callback compares
  // the incoming state against the cookie's hash — anything that didn't go
  // through this kickoff is rejected.
  const res = NextResponse.redirect(url, 302);
  res.cookies.set("salla_oauth_state", hashState(state), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/salla/oauth",
    maxAge: 600, // 10 min — plenty of time for the merchant to log in & approve
  });
  // Also set the raw state in a parallel cookie so the callback can rebuild
  // the hash and compare. Cookie itself is httpOnly, so it never reaches JS.
  res.cookies.set("salla_oauth_state_raw", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/salla/oauth",
    maxAge: 600,
  });
  return res;
}
