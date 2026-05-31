"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Search, ShoppingBag, Package, Boxes, FileClock, ShieldBan,
  CornerDownLeft, ArrowUp, ArrowDown, Loader2, Command as CommandIcon,
  LayoutDashboard, Plus, UserPlus, Sparkles, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STORE_NAV, GLOBAL_NAV, navForRole } from "@/components/admin/nav-config";
import { can, type Role, DEFAULT_ROLE } from "@/lib/auth/rbac";
import { globalSearchAction } from "@/app/admin/search-actions";
import type { SearchHit, SearchKind, SearchResults } from "@/lib/db/search";

/**
 * ⌘K Command Palette — the dashboard's smart search + navigation surface.
 *
 * Two modes share one list:
 *   1. EMPTY query → role-filtered navigation + contextual quick-actions.
 *      Instant, no network. This is the "launcher".
 *   2. TYPING (≥2 chars) → debounced server search across orders, products,
 *      accounts, verification logs, and bans (all role-scoped server-side).
 *
 * UX:
 *   - Opens on ⌘K / Ctrl+K from anywhere, or by clicking the topbar trigger.
 *   - Full keyboard nav: ↑/↓ move, Enter selects, Esc closes.
 *   - The active row auto-scrolls into view; mouse hover also sets active.
 *   - Each result deep-links into the right page, pre-filtered via ?q=.
 */

const KIND_META: Record<SearchKind, { icon: LucideIcon; label: string; tint: string }> = {
  order: { icon: ShoppingBag, label: "الطلبات", tint: "text-blue-500 bg-blue-500/10" },
  product: { icon: Package, label: "المنتجات", tint: "text-violet-500 bg-violet-500/10" },
  account: { icon: Boxes, label: "الحسابات", tint: "text-amber-500 bg-amber-500/10" },
  otp: { icon: FileClock, label: "سجل التحقق", tint: "text-emerald-500 bg-emerald-500/10" },
  ban: { icon: ShieldBan, label: "الأرقام المحظورة", tint: "text-red-500 bg-red-500/10" },
};

type FlatItem = {
  key: string;
  group: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon: LucideIcon;
  tint?: string;
  href: string;
};

const DEBOUNCE_MS = 220;

export function CommandPalette({ role = DEFAULT_ROLE }: { role?: Role }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const reqId = React.useRef(0);

  // Global ⌘K / Ctrl+K toggle.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Open via custom event so the topbar trigger (and anything else) can launch
  // the palette without prop-drilling a setter.
  React.useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("command-palette:open", onOpen);
    return () => window.removeEventListener("command-palette:open", onOpen);
  }, []);

  // Reset transient state whenever the dialog closes.
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      setActive(0);
      setLoading(false);
    }
  }, [open]);

  // Debounced server search.
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const myReq = ++reqId.current;
    const t = setTimeout(async () => {
      const res = await globalSearchAction(q);
      // Ignore out-of-order responses.
      if (myReq !== reqId.current) return;
      setResults(res);
      setLoading(false);
      setActive(0);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // ── Build the flat, ordered item list for the current mode ────────────
  const items = React.useMemo<FlatItem[]>(() => {
    const q = query.trim();

    // SEARCH MODE
    if (q.length >= 2 && results) {
      const flat: FlatItem[] = [];
      const push = (hits: SearchHit[]) => {
        for (const h of hits) {
          const meta = KIND_META[h.kind];
          flat.push({
            key: `${h.kind}:${h.id}`,
            group: meta.label,
            title: h.title,
            subtitle: h.subtitle,
            badge: h.badge,
            icon: meta.icon,
            tint: meta.tint,
            href: h.href,
          });
        }
      };
      push(results.orders);
      push(results.products);
      push(results.accounts);
      push(results.otp);
      push(results.bans);
      return flat;
    }

    // LAUNCHER MODE — quick actions + role-filtered navigation.
    const flat: FlatItem[] = [];

    const actions: FlatItem[] = [];
    if (can(role, "view_dashboard")) {
      actions.push({
        key: "act:dashboard", group: "إجراءات سريعة", title: "لوحة التحكم",
        icon: LayoutDashboard, href: "/admin",
      });
    }
    if (can(role, "view_orders")) {
      actions.push({
        key: "act:orders", group: "إجراءات سريعة", title: "عرض الطلبات",
        subtitle: "كل الطلبات الواردة", icon: ShoppingBag, href: "/admin/orders",
      });
    }
    if (can(role, "manage_products")) {
      actions.push({
        key: "act:new-product", group: "إجراءات سريعة", title: "إضافة منتج",
        subtitle: "منتج رقمي جديد", icon: Plus, href: "/admin/products",
      });
    }
    if (can(role, "manage_staff")) {
      actions.push({
        key: "act:invite", group: "إجراءات سريعة", title: "دعوة موظف",
        subtitle: "إضافة عضو للفريق", icon: UserPlus, href: "/admin/staff",
      });
    }
    flat.push(...actions);

    // Navigation — same role filter the sidebar uses.
    const navGroups = [...navForRole(STORE_NAV, role), ...navForRole(GLOBAL_NAV, role)];
    for (const g of navGroups) {
      for (const it of g.items) {
        flat.push({
          key: `nav:${it.href}`,
          group: "التنقل",
          title: it.label,
          icon: it.icon,
          href: it.href,
        });
      }
    }
    return flat;
  }, [query, results, role]);

  // Keep active index in range as the list changes.
  React.useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, items.length - 1)));
  }, [items.length]);

  const choose = React.useCallback(
    (item?: FlatItem) => {
      const target = item ?? items[active];
      if (!target) return;
      setOpen(false);
      router.push(target.href);
    },
    [items, active, router],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose();
    }
  }

  // Auto-scroll active row into view.
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // Group consecutive items for section headers, preserving the flat index
  // so keyboard nav and rendering stay in sync.
  const grouped = React.useMemo(() => {
    const sections: { group: string; items: { item: FlatItem; idx: number }[] }[] = [];
    items.forEach((item, idx) => {
      const last = sections[sections.length - 1];
      if (last && last.group === item.group) last.items.push({ item, idx });
      else sections.push({ group: item.group, items: [{ item, idx }] });
    });
    return sections;
  }, [items]);

  const searching = query.trim().length >= 2;
  const showEmpty = searching && !loading && items.length === 0;

  return (
    <>
      <PaletteTrigger onOpen={() => setOpen(true)} />

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            onKeyDown={onKeyDown}
            className={cn(
              "theme-admin fixed left-1/2 top-[12vh] z-[61] w-[92vw] max-w-xl -translate-x-1/2",
              "rounded-2xl bg-bg border border-[hsl(var(--hairline-strong))] overflow-hidden",
              "shadow-[0_32px_80px_-24px_rgba(15,23,32,0.55)]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            )}
          >
            <Dialog.Title className="sr-only">بحث سريع</Dialog.Title>

            {/* Search field */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-[hsl(var(--hairline))]">
              {loading ? (
                <Loader2 className="size-5 text-fg-muted animate-spin shrink-0" />
              ) : (
                <Search className="size-5 text-fg-muted shrink-0" />
              )}
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن طلب، منتج، حساب، رقم جوال…"
                className="flex-1 bg-transparent text-sm text-fg placeholder:text-fg-faint focus:outline-none"
              />
              <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-[hsl(var(--hairline-strong))] bg-surface-2 px-1.5 font-mono text-[10px] text-fg-faint">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[56vh] overflow-y-auto py-2">
              {showEmpty ? (
                <EmptyResults query={query} />
              ) : (
                grouped.map((section) => (
                  <div key={section.group} className="px-2 py-1">
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-fg-faint">
                      {section.group}
                    </p>
                    <ul>
                      {section.items.map(({ item, idx }) => (
                        <PaletteRow
                          key={item.key}
                          item={item}
                          idx={idx}
                          active={idx === active}
                          onHover={() => setActive(idx)}
                          onPick={() => choose(item)}
                        />
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>

            {/* Footer hint bar */}
            <div className="flex items-center justify-between gap-2 px-4 h-10 border-t border-[hsl(var(--hairline))] bg-surface-2 text-[11px] text-fg-muted">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <ArrowUp className="size-3" />
                  <ArrowDown className="size-3" />
                  تنقل
                </span>
                <span className="inline-flex items-center gap-1">
                  <CornerDownLeft className="size-3" />
                  فتح
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-fg-faint">
                <Sparkles className="size-3 text-accent" />
                بحث ذكي
              </span>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function PaletteRow({
  item,
  idx,
  active,
  onHover,
  onPick,
}: {
  item: FlatItem;
  idx: number;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  const Icon = item.icon;
  return (
    <li data-idx={idx}>
      <button
        type="button"
        onMouseMove={onHover}
        onClick={onPick}
        className={cn(
          "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors",
          active ? "bg-fg/[0.06]" : "hover:bg-fg/[0.03]",
        )}
      >
        <span
          className={cn(
            "grid place-items-center size-9 rounded-xl shrink-0",
            item.tint ?? "bg-[hsl(60_14%_94%)] text-[hsl(222_30%_6%)]",
          )}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-fg truncate">{item.title}</span>
          {item.subtitle && (
            <span className="block text-xs text-fg-muted truncate">{item.subtitle}</span>
          )}
        </span>
        {item.badge && (
          <span className="shrink-0 inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-surface-2 text-fg-muted border border-[hsl(var(--hairline))]">
            {item.badge}
          </span>
        )}
        {active && <CornerDownLeft className="size-3.5 text-fg-faint shrink-0" />}
      </button>
    </li>
  );
}

function EmptyResults({ query }: { query: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="inline-grid place-items-center size-12 rounded-2xl bg-surface-2 mb-3">
        <Search className="size-5 text-fg-faint" />
      </div>
      <p className="text-sm font-semibold text-fg">لا نتائج لـ «{query}»</p>
      <p className="text-xs text-fg-muted mt-1">
        جرّب رقم الطلب، اسم العميل، آخر 4 أرقام من الجوال، أو اسم المنتج.
      </p>
    </div>
  );
}

/**
 * The topbar trigger — looks like the old search input but opens the palette.
 * A button (not an input) so keyboard focus + click both launch the dialog.
 */
function PaletteTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group w-full h-10 ps-9 pe-12 rounded-full border border-[hsl(var(--hairline-strong))] bg-surface",
        "text-sm text-fg-faint relative text-start hover:bg-surface-2 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg",
      )}
    >
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-fg-faint" />
      <span>بحث في الطلبات والمنتجات…</span>
      <kbd className="hidden md:inline-flex absolute end-3 top-1/2 -translate-y-1/2 h-5 items-center gap-0.5 rounded border border-[hsl(var(--hairline-strong))] bg-surface-2 px-1.5 font-mono text-[10px] text-fg-faint">
        <CommandIcon className="size-2.5" />K
      </kbd>
    </button>
  );
}
