import { redirect } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { SidebarModeProvider } from "@/components/admin/sidebar-mode-context";
import { getCurrentUser, getCurrentRole } from "@/lib/supabase/server";
import { listNotifications } from "@/lib/db/notifications-center";

/**
 * Admin shell — full-bleed, edge-to-edge with an internal scroll container.
 *
 * Scroll model:
 *   - Outer column (`h-svh overflow-hidden`) traps the viewport.
 *   - Sidebar + topbar stay fixed; only `<main>` scrolls.
 *   - `min-h-0` on the inner flex column is REQUIRED — without it, a flex
 *     child with `flex-1 overflow-y-auto` won't scroll because flex items
 *     default to `min-height: auto` which expands them past the parent.
 *
 * Perf notes:
 *   - Uses cached `getCurrentUser()` (React.cache) so multiple Server
 *     Components share one auth lookup per request.
 *   - No extra profile DB query — display name comes from `user_metadata`.
 *   - Edge proxy (proxy.ts) refreshes the session cookie in advance.
 *   - Shell stays mounted across sub-route navigations.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = (await getCurrentRole()) ?? "manager";
  const { unread } = await listNotifications(user.id, 1);

  const name =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0];

  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <TooltipProvider delayDuration={120}>
      <SidebarModeProvider>
        <div
          className="theme-admin h-svh w-full overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, hsl(170 8% 92%) 0%, hsl(186 11% 84%) 50%, hsl(190 12% 78%) 100%)",
          }}
        >
          <div className="flex h-full w-full">
            <div 
              className="relative shrink-0 h-full"
              style={{
                background: "linear-gradient(to bottom, #fff 64px, transparent 64px)"
              }}
            >
              <AdminSidebar
                userName={name}
                userEmail={user.email ?? undefined}
                avatarUrl={avatarUrl}
                role={role}
              />
            </div>
            <div className="flex-1 min-w-0 min-h-0 flex flex-col">
              <AdminTopbar
                userName={name}
                userEmail={user.email ?? undefined}
                avatarUrl={avatarUrl}
                role={role}
                initialUnread={unread}
              />
              <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-5 lg:px-7 pb-8">
                <div className="mx-auto w-full max-w-[1600px]">{children}</div>
              </main>
            </div>
          </div>
        </div>
      </SidebarModeProvider>
    </TooltipProvider>
  );
}
