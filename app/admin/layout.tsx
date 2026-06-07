import { redirect } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { SidebarModeProvider } from "@/components/admin/sidebar-mode-context";
import { LinkStoreGateProvider } from "@/components/admin/link-store-gate";
import { getCurrentUser, getCurrentRole } from "@/lib/supabase/server";
import { listNotifications } from "@/lib/db/notifications-center";
import { getWorkspacesForUser } from "@/lib/db/workspaces";
import { hasPendingInvitation } from "@/lib/db/membership";

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
 * Onboarding (locked) mode — a signed-in user with NO store membership:
 *   - Sees the full shell (sidebar with every section, topbar) so the product
 *     feels real, but store sections are LOCKED — clicking opens the
 *     "link your store first" gate dialog instead of navigating.
 *   - A few routes stay unlocked because they work without a store:
 *       • /admin/profile  — personal account settings (always)
 *       • /admin/staff     — ONLY when the user has a pending invitation, so
 *                            they can reach the accept/decline banner.
 *   - The dashboard page itself renders an onboarding panel (not live data)
 *     while membership is absent — see app/admin/page.tsx. That, plus the
 *     middleware membership gate, is what stops another store's data leaking.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();

  const name =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0];

  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;

  // No membership → locked onboarding shell. Surface the staff section as
  // unlocked when an invitation is pending so the user can accept it.
  const locked = !role;
  const hasPending = locked ? await hasPendingInvitation(user.id) : false;

  const unlockedHrefs = [
    "/admin/profile",
    "/admin/integrations",
    ...(hasPending ? ["/admin/staff"] : []),
  ];

  const effectiveRole = role ?? "support";
  // Both queries are scoped to THIS user, so they're safe even when locked.
  const { unread } = await listNotifications(user.id, 1);
  const workspaces = locked ? [] : await getWorkspacesForUser(user.id);

  return (
    <TooltipProvider delayDuration={120}>
      <SidebarModeProvider>
        <LinkStoreGateProvider>
          <div
            className="theme-admin h-svh w-full overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, hsl(170 8% 92%) 0%, hsl(186 11% 84%) 50%, hsl(190 12% 78%) 100%)",
            }}
          >
            <div className="flex h-full w-full">
              <div
                className="relative shrink-0 h-full hidden lg:block"
                style={{
                  background: "linear-gradient(to bottom, #fff 64px, transparent 64px)",
                }}
              >
                <AdminSidebar
                  userName={name}
                  userEmail={user.email ?? undefined}
                  avatarUrl={avatarUrl}
                  role={effectiveRole}
                  locked={locked}
                  unlockedHrefs={unlockedHrefs}
                />
              </div>
              <div className="flex-1 min-w-0 min-h-0 flex flex-col">
                <AdminTopbar
                  userName={name}
                  userEmail={user.email ?? undefined}
                  avatarUrl={avatarUrl}
                  role={effectiveRole}
                  initialUnread={unread}
                  workspaces={workspaces}
                  locked={locked}
                  unlockedHrefs={unlockedHrefs}
                />
                <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-5 lg:px-7 pb-8">
                  <div className="mx-auto w-full max-w-[1600px]">{children}</div>
                </main>
              </div>
            </div>
          </div>
        </LinkStoreGateProvider>
      </SidebarModeProvider>
    </TooltipProvider>
  );
}
