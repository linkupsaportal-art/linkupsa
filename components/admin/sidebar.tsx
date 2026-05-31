"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  Sparkles, PanelRightOpen, PanelRightClose, MousePointer2, Lock,
} from "lucide-react";
import { LogoGlyph } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { STORE_NAV, GLOBAL_NAV, navForRole, type NavItem } from "@/components/admin/nav-config";
import { type Role, DEFAULT_ROLE } from "@/lib/auth/rbac";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebarMode, type SidebarMode } from "@/components/admin/sidebar-mode-context";
import { useLinkStoreGate } from "@/components/admin/link-store-gate";

/**
 * 3-mode admin sidebar — near-black surface, lime accent, full RTL.
 *
 * Modes:
 *   - "expanded"  → fixed 260px, labels visible
 *   - "collapsed" → fixed 72px, icons only, tooltips on hover
 *   - "hover"     → 72px collapsed; expands to 260px while pointer is inside
 *                   (uses an absolute overlay so layout never jumps)
 *
 * The inline-end edge of the sidebar (visually the LEFT edge in RTL, since
 * the sidebar sits on the right) is rounded by 28px to match the workspace
 * card's rounded look. The outer/right edge is square — flush against the
 * viewport.
 *
 * Mobile (< lg): hidden — the topbar drawer renders the wide list instead.
 */
export function AdminSidebar({
  userName,
  userEmail,
  avatarUrl,
  isMobile = false,
  role = DEFAULT_ROLE,
  locked = false,
}: {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string | null;
  isMobile?: boolean;
  role?: Role;
  /** When true, every nav item is shown but disabled — clicking opens the
   *  link-store gate instead of navigating. Used for the onboarding shell of
   *  a user who hasn't connected a store yet. */
  locked?: boolean;
}) {
  const { mode } = useSidebarMode();
  const [hovered, setHovered] = useState(false);

  // Role-filtered nav — only shows links the role can actually open. In
  // locked mode we show the FULL store nav (every section visible) so the
  // user sees what they'll unlock once they connect their store.
  const storeNav = locked ? STORE_NAV : navForRole(STORE_NAV, role);
  const globalNav = navForRole(GLOBAL_NAV, role);

  // Only "hover" mode actually expands on hover; the others stay fixed.
  // Mobile drawer is always expanded.
  const expanded = isMobile || mode === "expanded" || (mode === "hover" && hovered);

  // For hover-mode, the panel floats over content so the canvas doesn't shift.
  // Mobile drawer has its own dialog wrapper.
  const isFloating = !isMobile && mode === "hover";

  return (
    <>
      {/* Spacer in hover-mode reserves 72px so content never reflows when the
          panel expands over it. In static modes there's no spacer — the aside
          itself sits in the flex flow at the requested width. */}
      {isFloating && (
        <div
          aria-hidden
          className={cn(
            "hidden lg:block shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] h-full",
            expanded ? "w-[260px]" : "w-[72px]"
          )}
          style={{
            background: "linear-gradient(to bottom, #fff 64px, transparent 64px)"
          }}
        />
      )}

      <aside
        onMouseEnter={() => isFloating && setHovered(true)}
        onMouseLeave={() => isFloating && setHovered(false)}
        className={cn(
          "surface-dark flex-col py-3 shrink-0 h-full",
          isMobile 
            ? "flex w-[260px] rounded-e-[28px] border-e border-white/10" 
            : "hidden lg:flex transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-e-[28px]",
          !isMobile && (isFloating
            ? "fixed inset-y-0 start-0 z-30 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)]"
            : "relative"),
          !isMobile && (expanded ? "w-[260px]" : "w-[72px]"),
        )}
      >
        {/* Brand + mode toggle row.
            - h-16 matches the topbar height so there's no dead space at top.
            - Expanded: brand chip · "LinkUp" wordmark · mode toggle (right edge)
            - Collapsed: brand chip ONLY (toggle moves below — see next block) */}
        <div
          className={cn(
            "px-3 flex items-center h-16 shrink-0",
            expanded ? "justify-between gap-2" : "justify-center",
          )}
        >
          <Link
            href="/admin"
            className="flex items-center justify-center size-10 rounded-xl hover:scale-[1.05] active:scale-95 transition-transform shrink-0"
            aria-label="LinkUp"
          >
            <LogoGlyph className="size-9" />
          </Link>
          {expanded && (
            <>
              <span className="font-display text-base font-extrabold text-white tracking-tight whitespace-nowrap flex-1 truncate">
                LinkUp
              </span>
              {!isMobile && <ModeToggle expanded={expanded} />}
            </>
          )}
        </div>

        {/* Collapsed-only mode toggle — sits below the brand on its own row
            so it stays reachable when the sidebar is in icon-rail width. */}
        {!isMobile && !expanded && (
          <div className="px-3 mt-1 flex justify-center">
            <ModeToggle expanded={expanded} />
          </div>
        )}

        <div className="mt-2 mx-3 h-px bg-white/10" />

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 no-scrollbar">
          <NavSection groups={storeNav} expanded={expanded} locked={locked} />
          <div className="my-3 mx-2 h-px bg-white/10" />
          <NavSection groups={globalNav} expanded={expanded} locked={locked} />
        </nav>

        {/* Footer — profile chip */}
        <div className="mt-2 mx-3 h-px bg-white/10" />
        <div className="px-3 pt-3 flex justify-center">
          <OptionalTooltip enabled={!expanded} content={userName ?? "حسابي"}>
            <Link
              href="/admin/profile"
              className="flex items-center gap-3 rounded-xl transition-colors duration-150 w-full px-2 py-2 hover:bg-white/5 justify-start"
            >
              <Avatar className="size-9 ring-2 ring-white/10 shrink-0">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={userName ?? "avatar"} />}
                <AvatarFallback className="bg-white/10 text-white text-xs font-semibold">
                  {(userName?.[0] ?? userEmail?.[0] ?? "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "min-w-0 flex-1 transition-opacity duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap overflow-hidden text-start",
                  expanded ? "opacity-100 delay-75" : "opacity-0 pointer-events-none"
                )}
              >
                <span className="block text-sm font-semibold text-white truncate">
                  {userName ?? "حسابي"}
                </span>
                <span className="block text-[11px] text-white/55 truncate" dir="ltr">
                  {userEmail ?? ""}
                </span>
              </span>
            </Link>
          </OptionalTooltip>
        </div>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Mode toggle — always-visible icon button that opens a dropdown    */
/*  listing the 3 modes. Works in both expanded & collapsed states.   */
/* ------------------------------------------------------------------ */
function ModeToggle({ expanded }: { expanded: boolean }) {
  const { mode, setMode } = useSidebarMode();

  const options: Array<{ value: SidebarMode; label: string; icon: React.ReactNode }> = [
    { value: "expanded", label: "مفتوحة دائماً", icon: <PanelRightOpen className="size-4" /> },
    { value: "collapsed", label: "مطوية دائماً", icon: <PanelRightClose className="size-4" /> },
    { value: "hover", label: "اتساع عند المرور", icon: <MousePointer2 className="size-4" /> },
  ];

  // The trigger shows the icon for the currently active mode so the user
  // always knows the current state at a glance.
  const active = options.find((o) => o.value === mode) ?? options[0];

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="وضع الشريط الجانبي"
              className={cn(
                "shrink-0 grid place-items-center size-9 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors",
                "data-[state=open]:bg-white/10 data-[state=open]:text-white",
              )}
            >
              {active.icon}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        {!expanded && <TooltipContent side="left">{active.label}</TooltipContent>}
      </Tooltip>

      <DropdownMenuContent
        align="start"
        side="left"
        sideOffset={12}
        className="w-56"
      >
        <DropdownMenuLabel>وضع الشريط الجانبي</DropdownMenuLabel>
        {options.map((opt) => {
          const isActive = mode === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className="gap-2.5 py-2"
            >
              <span
                className={cn(
                  "grid place-items-center size-8 rounded-lg shrink-0",
                  isActive
                    ? "pill-accent"
                    : "bg-[hsl(60_14%_94%)] text-[hsl(222_30%_6%)]",
                )}
              >
                {opt.icon}
              </span>
              <span className="flex-1 text-sm font-semibold text-[hsl(222_30%_6%)]">
                {opt.label}
              </span>
              {isActive && (
                <span className="size-1.5 rounded-full bg-[hsl(72_86%_50%)] shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav rendering                                                     */
/* ------------------------------------------------------------------ */
function NavSection({
  groups,
  expanded,
  locked = false,
}: {
  groups: typeof STORE_NAV;
  expanded: boolean;
  locked?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label} className="transition-all duration-300">
          <p
            className={cn(
              "px-3 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap overflow-hidden text-start",
              expanded ? "opacity-100 max-h-5 mb-1.5" : "opacity-0 max-h-0 pointer-events-none mb-0"
            )}
          >
            {group.label}
          </p>
          <ul className="space-y-0.5 flex flex-col items-center">
            {group.items.map((item) => (
              <UnifiedNavItem key={item.href} item={item} pathname={pathname} expanded={expanded} locked={locked} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function UnifiedNavItem({ item, pathname, expanded, locked = false }: { item: NavItem; pathname: string; expanded: boolean; locked?: boolean }) {
  const { requestLink } = useLinkStoreGate();
  const active =
    !locked && (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href));
  const Icon = item.icon;

  const className = cn(
    "group relative flex items-center rounded-xl h-10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
    expanded ? "w-full px-2.5 justify-start text-sm" : "w-10 px-0 justify-center mx-auto",
    active
      ? "bg-white/10 text-white font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
      : "text-white/55 hover:text-white hover:bg-white/5",
    locked && "opacity-60",
  );

  const inner = (
    <>
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors duration-200",
          active ? "text-accent" : "text-white/55 group-hover:text-white"
        )}
        strokeWidth={1.7}
      />
      <span
        className={cn(
          "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap text-start truncate",
          expanded
            ? "opacity-100 translate-x-0 w-auto relative ms-2.5 flex-1"
            : "opacity-0 -translate-x-2 pointer-events-none w-0 absolute h-0 overflow-hidden"
        )}
      >
        {item.label}
      </span>
      {locked ? (
        <Lock
          className={cn(
            "size-3.5 shrink-0 text-white/40 transition-opacity duration-200",
            expanded ? "opacity-100 delay-75" : "opacity-0 pointer-events-none absolute"
          )}
          strokeWidth={2}
        />
      ) : (
        item.status === "soon" && (
          <span
            className={cn(
              "text-[9px] uppercase tracking-widest border border-white/10 rounded-full px-1.5 py-px shrink-0 transition-opacity duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap",
              expanded ? "opacity-40 delay-75" : "opacity-0 pointer-events-none absolute"
            )}
          >
            قريباً
          </span>
        )
      )}
      {active && (
        <span className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-accent shadow-[0_0_10px_hsl(var(--accent))]" />
      )}
    </>
  );

  return (
    <li className="w-full list-none px-1">
      <OptionalTooltip
        enabled={!expanded}
        content={
          <>
            {item.label}
            {locked && (
              <span className="text-[9px] uppercase tracking-widest text-fg-faint">مقفل</span>
            )}
            {!locked && item.status === "soon" && (
              <span className="text-[9px] uppercase tracking-widest text-fg-faint">قريباً</span>
            )}
          </>
        }
      >
        {locked ? (
          <button type="button" onClick={requestLink} className={className}>
            {inner}
          </button>
        ) : (
          <Link
            href={item.href}
            prefetch
            aria-current={active ? "page" : undefined}
            className={className}
          >
            {inner}
          </Link>
        )}
      </OptionalTooltip>
    </li>
  );
}

function OptionalTooltip({
  children,
  content,
  enabled,
}: {
  children: React.ReactElement;
  content: React.ReactNode;
  enabled: boolean;
}) {
  if (!enabled) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="left" className="flex items-center gap-2">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile drawer list — used only by the topbar's <Sheet>            */
/* ------------------------------------------------------------------ */
export function NavList({ className, role = DEFAULT_ROLE }: { className?: string; role?: Role }) {
  const pathname = usePathname();
  const storeNav = navForRole(STORE_NAV, role);
  const globalNav = navForRole(GLOBAL_NAV, role);
  return (
    <nav className={cn("px-3 py-4 space-y-6", className)}>
      {storeNav.map((group) => (
        <DrawerGroup key={group.label} label={group.label} items={group.items} pathname={pathname} />
      ))}
      <div className="border-t border-[hsl(var(--hairline))] pt-4">
        {globalNav.map((group) => (
          <DrawerGroup key={group.label} label={group.label} items={group.items} pathname={pathname} />
        ))}
      </div>
      <div className="border-t border-[hsl(var(--hairline))] pt-4">
        <div className="flex items-center gap-2 px-3 text-xs text-fg-faint">
          <Sparkles className="size-3.5 text-accent" />
          المزيد قريباً…
        </div>
      </div>
    </nav>
  );
}

function DrawerGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div>
      <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-fg-faint">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                  active
                    ? "bg-fg text-bg font-semibold"
                    : "text-fg-muted hover:text-fg hover:bg-fg/5",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.7} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.status === "soon" && (
                  <span
                    className={cn(
                      "text-[9px] uppercase tracking-widest rounded-full px-1.5 py-px",
                      active ? "bg-bg/15 text-bg/80" : "border border-[hsl(var(--hairline))] text-fg-faint",
                    )}
                  >
                    قريباً
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
