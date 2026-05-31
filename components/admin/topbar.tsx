"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Menu, Plus, Search, Settings as SettingsIcon } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { ProfileMenu } from "@/components/admin/profile-menu";
import { AdminSidebar } from "@/components/admin/sidebar";
import { NotificationBell } from "@/components/admin/notification-bell";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { type Role, DEFAULT_ROLE } from "@/lib/auth/rbac";

/**
 * Admin topbar — sits inside the workspace card. White surface, hairline
 * bottom, dark CTA button on the end (matches the reference image).
 *
 * RTL primary:
 *   start = burger (mobile) + StoreSwitcher
 *   middle = SearchBar (md+)
 *   end = settings · notifications · "create" CTA · profile
 */
export function AdminTopbar({
  userEmail,
  userName,
  avatarUrl,
  role = DEFAULT_ROLE,
  initialUnread = 0,
}: {
  userEmail?: string;
  userName?: string;
  avatarUrl?: string | null;
  role?: Role;
  initialUnread?: number;
}) {
  const [drawer, setDrawer] = useState(false);

  return (
    <>
      <header
        className={cn(
          "shrink-0 h-16 flex items-center gap-3 px-4 md:px-6",
          "border-b border-[hsl(var(--hairline))] bg-bg",
        )}
      >
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="فتح القائمة"
          className="lg:hidden inline-flex items-center justify-center size-9 rounded-xl border border-[hsl(var(--hairline-strong))] hover:bg-fg/5 transition-colors"
        >
          <Menu className="size-4" />
        </button>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-lg mx-auto">
          <SearchBar />
        </div>

        <div className="flex-1 md:hidden" />

        <div className="flex items-center gap-2">
          <IconButton ariaLabel="الإعدادات" asChild>
            <Link href="/admin/settings">
              <SettingsIcon className="size-4" />
            </Link>
          </IconButton>
          <NotificationBell initialUnread={initialUnread} />

          {/* Primary CTA — opens the order-import / refresh flow.
              The spec doesn't ship a "create store" CTA in v1, so this CTA
              points to Orders where the operator can re-fetch a paid order
              from the storefront API. */}
          <Link
            href="/admin/orders"
            className={cn(
              "hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-full font-semibold text-sm",
              "bg-fg text-bg hover:bg-[hsl(var(--surface-4))] active:scale-[0.98] transition-all",
              "shadow-[0_8px_20px_-8px_hsl(220_30%_8%/0.4)]",
            )}
          >
            <Plus className="size-4 text-accent" strokeWidth={2.5} />
            استيراد طلب
          </Link>

          <ProfileMenu userEmail={userEmail} userName={userName} avatarUrl={avatarUrl} />
        </div>
      </header>

      {/* Mobile sidebar drawer */}
      <Dialog.Root open={drawer} onOpenChange={setDrawer}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-fg/40 backdrop-blur-sm",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            )}
          />
          <Dialog.Content
            // Close the drawer when the user picks a nav item — uses
            // onClickCapture so we run before <Link> initiates the route
            // change. Keeping the listener on the Dialog.Content keeps the
            // markup accessible (no fake-button div).
            onClickCapture={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("a[href]")) setDrawer(false);
            }}
            className={cn(
              "fixed inset-y-0 start-0 z-50 w-[260px] flex flex-col outline-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            )}
          >
            <Dialog.Title className="sr-only">قائمة التنقل</Dialog.Title>
            <AdminSidebar userName={userName} userEmail={userEmail} role={role} isMobile />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function IconButton({
  children,
  ariaLabel,
  dot,
  onClick,
  asChild,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  dot?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** When true, render the styles on the child element (e.g. <Link>)
   *  instead of wrapping in a <button>. Useful for navigation-only
   *  icon controls. */
  asChild?: boolean;
}) {
  const cls = cn(
    "relative inline-flex items-center justify-center size-10 rounded-full",
    "bg-surface text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors",
    "border border-[hsl(var(--hairline))] focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
  );

  const dotEl = dot && (
    <span className="absolute top-2 end-2 size-1.5 rounded-full bg-accent ring-2 ring-bg" />
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      "aria-label": ariaLabel,
      className: cn(cls, (children.props as { className?: string }).className),
      children: (
        <>
          {(children.props as { children?: React.ReactNode }).children}
          {dotEl}
        </>
      ),
    });
  }

  return (
    <button type="button" aria-label={ariaLabel} onClick={onClick} className={cls}>
      {children}
      {dotEl}
    </button>
  );
}

function SearchBar() {
  return (
    <div className="relative w-full">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-fg-faint" />
      <input
        type="text"
        placeholder="بحث في الطلبات والمنتجات…"
        className={cn(
          "w-full h-10 ps-9 pe-12 rounded-full border border-[hsl(var(--hairline-strong))] bg-surface text-sm text-fg",
          "placeholder:text-fg-faint focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg",
          "focus:bg-bg transition-colors",
        )}
      />
      <kbd className="hidden md:inline-flex absolute end-3 top-1/2 -translate-y-1/2 h-5 items-center gap-0.5 rounded border border-[hsl(var(--hairline-strong))] bg-surface-2 px-1.5 font-mono text-[10px] text-fg-faint">
        <span>⌘</span>K
      </kbd>
    </div>
  );
}
