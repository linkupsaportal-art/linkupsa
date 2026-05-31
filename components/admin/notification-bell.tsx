"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  Bell, UserPlus, ShieldCheck, UserMinus, ShoppingBag, AlertTriangle,
  Info, CheckCheck, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchNotificationsAction,
  markReadAction,
  markAllReadAction,
} from "@/app/admin/notif-actions";

type NotifType =
  | "staff_invite" | "role_changed" | "staff_removed"
  | "system" | "order" | "security";

type Notif = {
  id: string;
  type: NotifType;
  title: string;
  body: string | null;
  link: string | null;
  actor_name: string | null;
  read_at: string | null;
  created_at: string;
};

const ICONS: Record<NotifType, { icon: typeof Bell; cls: string }> = {
  staff_invite: { icon: UserPlus, cls: "bg-accent/15 text-accent" },
  role_changed: { icon: ShieldCheck, cls: "bg-accent/15 text-accent" },
  staff_removed: { icon: UserMinus, cls: "bg-danger/10 text-danger" },
  order: { icon: ShoppingBag, cls: "bg-fg/10 text-fg" },
  security: { icon: AlertTriangle, cls: "bg-warn/15 text-warn" },
  system: { icon: Info, cls: "bg-fg/10 text-fg" },
};

/** Arabic relative-time formatter — compact, no external dep. */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "الآن";
  const m = Math.floor(s / 60);
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  const d = Math.floor(h / 24);
  if (d < 30) return `قبل ${d} ي`;
  return new Date(iso).toLocaleDateString("ar");
}

/**
 * Navbar notification bell.
 *
 * - Unread count badge on the bell.
 * - Dropdown with the latest 20, type-coded icons, relative time.
 * - Mark-one-as-read on click (then navigates to its link).
 * - Mark-all-as-read action in the header.
 * - Polls every 45s while mounted + refetches when the dropdown opens.
 * - Responsive: near full-width on mobile, anchored 400px card on sm+.
 *
 * Built on @radix-ui/react-dropdown-menu (already a project dep) so we get
 * outside-click, focus trap, portal + RTL handling for free.
 */
export function NotificationBell({ initialUnread = 0 }: { initialUnread?: number }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Notif[]>([]);
  const [unread, setUnread] = React.useState(initialUnread);
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const res = await fetchNotificationsAction();
    if (res.ok) {
      setItems(res.items as Notif[]);
      setUnread(res.unread);
    }
  }, []);

  // Poll for new notifications every 45s.
  React.useEffect(() => {
    void refresh();
    const t = setInterval(refresh, 45_000);
    return () => clearInterval(t);
  }, [refresh]);

  // Refetch on open for freshness.
  React.useEffect(() => {
    if (open) {
      setLoading(true);
      void refresh().finally(() => setLoading(false));
    }
  }, [open, refresh]);

  async function openItem(n: Notif) {
    if (!n.read_at) {
      setBusyId(n.id);
      const res = await markReadAction({ id: n.id });
      if (res.ok) {
        setItems(res.items as Notif[]);
        setUnread(res.unread);
      }
      setBusyId(null);
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  async function markAll(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    const res = await markAllReadAction();
    if (res.ok) {
      setItems(res.items as Notif[]);
      setUnread(res.unread);
    }
    setLoading(false);
  }

  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger asChild>
        <button
          type="button"
          aria-label="الإشعارات"
          className={cn(
            "relative inline-flex items-center justify-center size-10 rounded-full",
            "bg-surface text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors",
            "border border-[hsl(var(--hairline))] focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            "data-[state=open]:bg-surface-2 data-[state=open]:text-fg",
          )}
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-accent text-accent-fg text-[10px] font-extrabold font-num ring-2 ring-bg">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={10}
          className={cn(
            "theme-admin z-50 outline-none",
            "w-[calc(100vw-24px)] sm:w-[400px]",
            "rounded-2xl bg-white border border-[hsl(220_18%_14%/0.08)]",
            "shadow-[0_24px_60px_-30px_rgba(15,23,32,0.45),0_2px_6px_-2px_rgba(15,23,32,0.08)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[hsl(220_18%_14%/0.08)]">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[hsl(222_30%_6%)]">الإشعارات</h3>
              {unread > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent/15 text-accent text-[10px] font-extrabold font-num">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                disabled={loading}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-fg-muted hover:text-fg transition-colors disabled:opacity-50"
              >
                <CheckCheck className="size-3.5" />
                تعليم الكل كمقروء
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto overscroll-contain">
            {loading && items.length === 0 ? (
              <div className="grid place-items-center py-12 text-fg-faint">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState />
            ) : (
              <ul>
                {items.map((n) => {
                  const meta = ICONS[n.type] ?? ICONS.system;
                  const Icon = meta.icon;
                  const isUnread = !n.read_at;
                  return (
                    <li key={n.id}>
                      {/* Use Radix Item with onSelect prevented so navigation
                          is handled manually after marking read. */}
                      <Dropdown.Item
                        onSelect={(e) => {
                          e.preventDefault();
                          void openItem(n);
                        }}
                        className={cn(
                          "w-full text-start flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer outline-none",
                          "hover:bg-[hsl(60_14%_96%)] focus:bg-[hsl(60_14%_96%)] border-b border-[hsl(220_18%_14%/0.05)] last:border-0",
                          isUnread && "bg-[hsl(72_86%_50%/0.05)]",
                        )}
                      >
                        <span className={cn("grid place-items-center size-9 rounded-xl shrink-0 mt-0.5", meta.cls)}>
                          {busyId === n.id ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[hsl(222_30%_6%)] truncate flex-1">
                              {n.title}
                            </span>
                            {isUnread && <span className="size-2 rounded-full bg-accent shrink-0" />}
                          </span>
                          {n.body && (
                            <span className="block text-xs text-fg-muted mt-0.5 leading-relaxed line-clamp-2">
                              {n.body}
                            </span>
                          )}
                          <span className="block text-[10px] text-fg-faint mt-1 font-num">
                            {relativeTime(n.created_at)}
                          </span>
                        </span>
                      </Dropdown.Item>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center text-center px-6 py-12">
      <div className="grid place-items-center size-12 rounded-2xl bg-[hsl(60_14%_94%)] text-fg-muted mb-3">
        <Bell className="size-5" />
      </div>
      <p className="text-sm font-semibold text-[hsl(222_30%_6%)]">لا توجد إشعارات</p>
      <p className="text-xs text-fg-muted mt-1">ستظهر هنا الدعوات والتنبيهات الجديدة.</p>
    </div>
  );
}
