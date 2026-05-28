import {
  LayoutDashboard, ShoppingBag, Package, Boxes, Users, BellRing,
  ScrollText, FileClock, ShieldBan, Archive, BarChart3, KeyRound,
  UserCog, Webhook, Settings, Store, Receipt, Activity, UserCircle2,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** "soon" hides actions but keeps the route navigable. */
  status?: "soon";
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

/**
 * Per-store sections — visible inside a tenant context.
 * Order matches the spec: ops first, then catalog, then verification/security,
 * then communication, then store management.
 */
export const STORE_NAV: NavGroup[] = [
  {
    label: "نظرة عامة",
    items: [
      { href: "/admin", label: "لوحة المعلومات", icon: LayoutDashboard },
    ],
  },
  {
    label: "العمليات",
    items: [
      { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag, status: "soon" },
      { href: "/admin/customers", label: "العملاء", icon: Users, status: "soon" },
      { href: "/admin/audit-logs", label: "سجل العمليات", icon: ScrollText, status: "soon" },
    ],
  },
  {
    label: "الكتالوج",
    items: [
      { href: "/admin/products", label: "المنتجات", icon: Package, status: "soon" },
      { href: "/admin/accounts", label: "الحسابات", icon: Boxes, status: "soon" },
    ],
  },
  {
    label: "التحقق والأمان",
    items: [
      { href: "/admin/otp-logs", label: "سجل أكواد التحقق", icon: FileClock, status: "soon" },
      { href: "/admin/phone-bans", label: "حظر الأرقام", icon: ShieldBan, status: "soon" },
      { href: "/admin/code-limit", label: "مشغلو حد الأكواد", icon: KeyRound, status: "soon" },
    ],
  },
  {
    label: "التواصل",
    items: [
      { href: "/admin/notifications", label: "الإشعارات", icon: BellRing, status: "soon" },
      { href: "/admin/integrations", label: "Webhooks و API", icon: Webhook, status: "soon" },
    ],
  },
  {
    label: "إدارة المتجر",
    items: [
      { href: "/admin/analytics", label: "التحليلات", icon: BarChart3, status: "soon" },
      { href: "/admin/archives", label: "الأرشيف", icon: Archive, status: "soon" },
      { href: "/admin/staff", label: "الموظفون والصلاحيات", icon: UserCog, status: "soon" },
      { href: "/admin/settings", label: "إعدادات المتجر", icon: Settings, status: "soon" },
    ],
  },
];

/** Global sections — visible only to platform owner. Below a divider. */
export const GLOBAL_NAV: NavGroup[] = [
  {
    label: "المنصة",
    items: [
      { href: "/admin/stores", label: "المتاجر", icon: Store, status: "soon" },
      { href: "/admin/billing", label: "الفوترة", icon: Receipt, status: "soon" },
      { href: "/admin/platform-logs", label: "سجلات المنصة", icon: Activity, status: "soon" },
      { href: "/admin/profile", label: "حسابي", icon: UserCircle2 },
    ],
  },
];
