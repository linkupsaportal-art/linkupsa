import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

/**
 * Edge proxy. Two responsibilities:
 *
 *   1. SUBDOMAIN ROUTING — maps the user-facing hosts onto internal route
 *      paths so we don't have to move folders in the app/ tree:
 *
 *        linkup.portaliosa.com      → /pickup        (customer pickup)
 *        linkupdash.portaliosa.com  → /admin/*       (main dashboard)
 *        linkuplimit.portaliosa.com → /admin/otp-logs (usage-limit panel)
 *
 *   2. SESSION REFRESH + AUTH GATING via updateSession().
 *
 * Reverse rewrites strip the `/admin` and `/pickup` prefix from the URL
 * bar so the user sees clean paths (e.g. `linkupdash.portaliosa.com/orders`
 * instead of `/admin/orders`).
 */

// Host that shows the customer-facing pickup page (`/pickup`).
const PICKUP_HOSTS = new Set<string>([
  "linkup.portaliosa.com",
]);

// Host that shows the full admin dashboard (`/admin/*`).
const ADMIN_HOSTS = new Set<string>([
  "linkupdash.portaliosa.com",
]);

// Locked to the OTP rate-limit / quota panel only — staff who manage
// throttling open this subdomain and never see the rest of the dashboard.
const LIMIT_HOSTS = new Set<string>([
  "linkuplimit.portaliosa.com",
]);

// Paths every host must let through untouched (auth, APIs, Next internals).
const SHARED_PASS_THROUGH_PREFIXES = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/api",
  "/_next",
  "/favicon",
];

function isSharedPassThrough(pathname: string): boolean {
  return SHARED_PASS_THROUGH_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const { pathname, search } = request.nextUrl;

  // -------- 1. SUBDOMAIN ROUTING --------

  if (ADMIN_HOSTS.has(host)) {
    // Admin host should never expose the customer pickup flow.
    if (pathname.startsWith("/pickup")) {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
    if (!pathname.startsWith("/admin") && !isSharedPassThrough(pathname)) {
      const target = pathname === "/" ? "/admin" : `/admin${pathname}`;
      return NextResponse.rewrite(new URL(target + search, request.url));
    }
  }

  if (PICKUP_HOSTS.has(host)) {
    // Pickup host should never expose admin routes.
    if (pathname.startsWith("/admin")) {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/pickup", request.url));
    }
  }

  if (LIMIT_HOSTS.has(host)) {
    // Hard-pin this subdomain to the OTP-logs / usage-limit panel. Staff
    // who only manage rate limits log in here and never see the rest of
    // the dashboard. Anything outside that page (including other /admin
    // routes) is bounced back to the panel.
    if (isSharedPassThrough(pathname)) {
      // auth + api + _next pass through normally
    } else if (pathname === "/" || pathname === "/admin") {
      return NextResponse.rewrite(new URL("/admin/otp-logs", request.url));
    } else if (
      pathname.startsWith("/admin/otp-logs") ||
      pathname.startsWith("/otp-logs")
    ) {
      // /otp-logs (clean URL) → /admin/otp-logs (real path)
      if (pathname.startsWith("/otp-logs")) {
        const rewritten = pathname.replace(/^\/otp-logs/, "/admin/otp-logs");
        return NextResponse.rewrite(new URL(rewritten + search, request.url));
      }
      // /admin/otp-logs already matches; let session gate run below.
    } else {
      // Any other path: bounce back to the limit panel.
      return NextResponse.redirect(new URL("/admin/otp-logs", request.url));
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
