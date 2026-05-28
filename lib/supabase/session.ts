import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Refreshes the Supabase auth session cookie on every request and gates
 * `/admin/*` behind authentication + MFA assurance.
 *
 * MUST be called from `proxy.ts` (Next.js 16 middleware replacement).
 *
 * Three gates:
 *   1. /admin/*       → must have a session
 *   2. /admin/* AAL2  → if user has a verified TOTP factor, they must be at
 *                       AAL2; otherwise we bounce to /login/mfa to complete
 *                       the challenge
 *   3. /login etc.    → already-signed-in users get bounced to /admin (unless
 *                       they're mid-MFA, in which case /login/mfa is allowed)
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touching getUser() refreshes the session cookie if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isMfaRoute = pathname === "/login/mfa";
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/forgot-password");
  const isProtected = pathname.startsWith("/admin");

  // Not signed in + protected route → /login
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Signed in but MFA pending → only /login/mfa is reachable.
  if (user && (isProtected || (isAuthRoute && !isMfaRoute))) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const needsMfa =
      aal && aal.nextLevel === "aal2" && aal.currentLevel === "aal1";
    if (needsMfa) {
      if (!isMfaRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/login/mfa";
        if (isProtected) url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      // already on /login/mfa — let it through
      return response;
    }
  }

  // Already signed in + clean AAL → bounce away from /login etc.
  if (isAuthRoute && user && !isMfaRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}
