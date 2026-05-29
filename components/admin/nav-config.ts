import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  BellRing,
  FileClock,
  ShieldBan,
  Archive,
  Webhook,
  Settings,
  UserCog,
  UserCircle2,
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
 * Admin sidebar — sections mirror the eight modules in
 * `docs/project-details.md` plus the security/integration extras the spec
 * defines (Phone Bans, Webhooks/API, Staff RBAC).
 *
 * Items NOT in the original spec were removed:
 *   - Customers          → covered as a column inside Orders
 *   - Audit Logs         → consolidated into OTP Logs + Archives
 *   - Code-Limit Operators → lives in its own panel at /code-limit
 *   - Analytics          → spec only asks for "Dashboard"
 *   - Stores / Billing / Platform Logs → multi-tenant, out of scope v1
 */
export const STORE_NAV: NavGroup[] = [
  {
    label: "نظرة عامة",
    items: [
      { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
    ],
  },
  {
    label: "العمليات",
    items: [
      { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
      { href: "/admin/products", label: "المنتجات", icon: Package },
      { href: "/admin/accounts", label: "الحسابات / القواعد", icon: Boxes },
    ],
  },
  {
    label: "التحقق والأمان",
    items: [
      { href: "/admin/otp-logs", label: "سجل أكواد التحقق", icon: FileClock, status: "soon" },
      { href: "/admin/phone-bans", label: "حظر الأرقام", icon: ShieldBan, status: "soon" },
    ],
  },
  {
    label: "التواصل والربط",
    items: [
      { href: "/admin/notifications", label: "الإشعارات", icon: BellRing, status: "soon" },
      { href: "/admin/integrations", label: "ربط المتجر و Webhooks", icon: Webhook, status: "soon" },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { href: "/admin/archives", label: "الأرشيف", icon: Archive, status: "soon" },
      { href: "/admin/staff", label: "الموظفون والصلاحيات", icon: UserCog, status: "soon" },
      { href: "/admin/settings", label: "الإعدادات", icon: Settings, status: "soon" },
    ],
  },
];

/** Account-level item — appears under a divider, single entry. */
export const GLOBAL_NAV: NavGroup[] = [
  {
    label: "حسابي",
    items: [{ href: "/admin/profile", label: "الملف الشخصي", icon: UserCircle2 }],
  },
];
