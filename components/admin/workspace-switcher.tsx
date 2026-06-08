"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Store, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/auth/rbac";

export type WorkspaceOption = {
  id: string;
  name: string;
  domain: string | null;
  role: Role;
  logoUrl: string | null;
  current: boolean;
};

const ROLE_PILL: Record<Role, string> = {
  manager: "bg-fg text-bg",
  supervisor: "bg-accent/20 text-black",
  support: "bg-fg/10 text-fg",
  code_limit: "bg-warn/15 text-black",
};

/**
 * Workspace switcher — the navbar dropdown that lets a user move between the
 * dashboards they have access to. Each entry shows the store name, its
 * domain, and the user's role badge in that workspace.
 *
 * Selecting a workspace persists the choice in a cookie and reloads so the
 * server picks up the active-workspace context. With a single connected store
 * the dropdown still renders (showing the active store + role) and is the hook
 * point for true multi-store switching once memberships exist.
 */
export function WorkspaceSwitcher({ workspaces }: { workspaces: WorkspaceOption[] }) {
  const active = workspaces.find((w) => w.current) ?? workspaces[0];
  const [switching, setSwitching] = React.useState<string | null>(null);

  if (!active) return null;

  function choose(w: WorkspaceOption) {
    if (w.current) return;
    setSwitching(w.id);
    // Persist the active workspace and reload so SSR re-resolves context.
    document.cookie = `active_workspace=${encodeURIComponent(w.id)};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    window.location.assign("/admin");
  }

  const multi = workspaces.length > 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="تبديل المتجر"
          className={cn(
            "inline-flex items-center gap-2 h-10 ps-2 pe-2.5 rounded-full max-w-[200px]",
            "bg-surface border border-[hsl(var(--hairline))] hover:bg-surface-2 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            "data-[state=open]:bg-surface-2",
          )}
        >
          <span className="grid place-items-center size-7 rounded-lg bg-fg text-bg shrink-0 overflow-hidden">
            {active.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.logoUrl} alt="" className="size-full object-cover" />
            ) : (
              <Store className="size-3.5" />
            )}
          </span>
          <span className="min-w-0 hidden sm:block text-start">
            <span className="block text-xs font-bold text-fg truncate leading-tight">
              {active.name}
            </span>
            <span className="block text-[10px] text-fg-muted truncate leading-tight">
              {ROLE_LABELS[active.role]}
            </span>
          </span>
          <ChevronDown className="size-3.5 text-fg-faint shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" sideOffset={10} className="w-[260px]">
        <DropdownMenuLabel>
          {multi ? "متاجرك" : "المتجر الحالي"}
        </DropdownMenuLabel>
        {workspaces.map((w) => (
          <DropdownMenuItem
            key={w.id}
            onSelect={(e) => {
              e.preventDefault();
              choose(w);
            }}
            className="gap-2.5 py-2"
          >
            <span className="grid place-items-center size-9 rounded-xl bg-[hsl(60_14%_94%)] text-[hsl(222_30%_6%)] shrink-0 overflow-hidden">
              {w.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.logoUrl} alt="" className="size-full object-cover" />
              ) : (
                <Store className="size-4" />
              )}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-[hsl(222_30%_6%)] truncate">
                {w.name}
              </span>
              <span className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={cn(
                    "inline-flex items-center h-4 px-1.5 rounded-full text-[9px] font-bold",
                    ROLE_PILL[w.role],
                  )}
                >
                  {ROLE_LABELS[w.role]}
                </span>
                {w.domain && (
                  <span className="text-[10px] text-fg-faint truncate" dir="ltr">
                    {w.domain}
                  </span>
                )}
              </span>
            </span>
            {w.current ? (
              <Check className="size-4 text-accent shrink-0" />
            ) : switching === w.id ? (
              <span className="size-3.5 rounded-full border-2 border-fg/30 border-t-fg animate-spin shrink-0" />
            ) : null}
          </DropdownMenuItem>
        ))}

        {!multi && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2.5 py-2 text-[11px] text-fg-muted leading-relaxed">
              عند دعوتك لمتاجر أخرى، ستظهر هنا للتبديل بينها.
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
