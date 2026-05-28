import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

/**
 * Renamed from `middleware` per Next.js 16: same API, runs for every matched
 * request before it reaches a route handler. Refreshes the Supabase session
 * cookie + gates `/dashboard/*`.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match every request EXCEPT:
     *  - _next/static, _next/image, favicon
     *  - static asset extensions (so images don't trigger session refresh)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
