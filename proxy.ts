import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

/**
 * Renamed from `middleware` per Next.js 16: same API, runs for every matched
 * request before it reaches a route handler.
 *
 * Two responsibilities:
 *   1. Subdomain routing — `admin.portaliosa.com/*` → `/admin/*` internally
 *      so the existing app/admin/* routes serve the subdomain without a
 *      directory move. Same for `delivery.portaliosa.com/*` → `/pickup/*`.
 *      Reverse rewrites also strip the `/admin` prefix from the URL bar so
 *      users see clean paths like `admin.portaliosa.com/orders`.
 *   2. Session refresh + auth gating, delegated to updateSession().
 */
export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname, search } = request.nextUrl;

  // -------- 1. SUBDOMAIN ROUTING --------
  const isAdminHost = host === "admin.portaliosa.com";
  const isDeliveryHost = host === "delivery.portaliosa.com";

  if (isAdminHost) {
    // Block direct /pickup/* on the admin subdomain
    if (pathname.startsWith("/pickup")) {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
    // Already at /admin/* — leave it, just run session gate
    if (!pathname.startsWith("/admin")) {
      // Map clean paths to their /admin/* equivalent.
      // /            → /admin
      // /orders      → /admin/orders
      // /products    → /admin/products
      // /api/*       → keep as-is (API routes are global)
      // /login etc   → keep as-is (auth lives at root for both hosts)
      const isAuthRoute =
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/verify-email") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon");

      if (!isAuthRoute) {
        const target =
          pathname === "/" ? "/admin" : `/admin${pathname}`;
        const url = new URL(target + search, request.url);
        return NextResponse.rewrite(url);
      }
    }
  }

  if (isDeliveryHost) {
    // Block /admin/* on the delivery subdomain
    if (pathname.startsWith("/admin")) {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
    // Map / → /pickup, leave everything else (api, _next) alone
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/pickup", request.url));
    }
  }

  // -------- 2. SESSION REFRESH + AUTH GATE --------
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
