import Link from "next/link";
import { ArrowUpLeft, type LucideIcon } from "lucide-react";
import {
  BookOpenText, HelpCircle, Rocket, BarChart3, Users2, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Right-rail of compact link cards — modeled after the
 * Community / Academy / Help Center stack from the reference image.
 *
 * Two variants:
 *   - "tile"    → big square (used for the top two)
 *   - "row"     → horizontal row card (used below)
 */

type LinkCard = {
  href: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  variant: "tile" | "row";
};

const LINKS: LinkCard[] = [
  { href: "/admin/orders", title: "الطلبات", icon: Users2, variant: "tile" },
  { href: "/admin/products", title: "المنتجات", icon: BarChart3, variant: "tile" },
  {
    href: "/admin/notifications",
    title: "مركز المساعدة",
    description: "اطّلع على أدلتنا المفصّلة",
    icon: HelpCircle,
    variant: "row",
  },
  {
    href: "/admin/staff",
    title: "الفريق والصلاحيات",
    description: "أدِر موظفي متجرك بسهولة",
    icon: Sparkles,
    variant: "row",
  },
  {
    href: "/admin/integrations",
    title: "تكاملات API",
    description: "اربط متجرك مع أدواتك",
    icon: Rocket,
    variant: "row",
  },
  {
    href: "/admin/archives",
    title: "الأرشيف",
    description: "تابع كل ما حدث في متجرك",
    icon: BookOpenText,
    variant: "row",
  },
];

export function QuickLinks() {
  const tiles = LINKS.filter((l) => l.variant === "tile");
  const rows = LINKS.filter((l) => l.variant === "row");

  return (
    <aside className="grid gap-3">
      {/* Top two tiles */}
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((link) => (
          <Tile key={link.href} link={link} />
        ))}
      </div>
      {/* Stacked rows — 2-up on mid-screens for density, 1-up on xl when the
          rail is narrower next to the main column */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
        {rows.map((link) => (
          <Row key={link.href} link={link} />
        ))}
      </div>
    </aside>
  );
}

function Tile({ link }: { link: LinkCard }) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      className={cn(
        "group relative aspect-square rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] card-soft",
        "p-4 flex flex-col justify-between hover:card-lift hover:border-fg/20 transition-all",
      )}
    >
      <div className="grid place-items-center size-10 rounded-2xl bg-surface-2 text-fg">
        <Icon className="size-4" strokeWidth={1.8} />
      </div>
      <p className="text-sm font-semibold text-fg">{link.title}</p>
      <ArrowUpLeft className="absolute top-3 end-3 size-3.5 text-fg-faint group-hover:text-fg transition-colors" />
    </Link>
  );
}

function Row({ link }: { link: LinkCard }) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] card-soft px-4 py-3.5",
        "hover:card-lift hover:border-fg/20 transition-all",
      )}
    >
      <span className="grid place-items-center size-10 rounded-2xl bg-surface-2 text-fg shrink-0">
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <span className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-fg truncate">{link.title}</p>
        {link.description && (
          <p className="text-xs text-fg-muted truncate mt-0.5">{link.description}</p>
        )}
      </span>
      <ArrowUpLeft className="size-3.5 text-fg-faint group-hover:text-fg transition-colors" />
    </Link>
  );
}
