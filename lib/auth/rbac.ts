/**
 * Role-Based Access Control (RBAC) for the admin panel.
 *
 * Four roles, mirroring docs/project-details.md:
 *
 *   manager     مدير            — full access (store owner)
 *   supervisor  مشرف            — all operations, NOT staff or settings
 *   support     خدمة عملاء       — dashboard / orders / otp-logs, no secrets
 *   code_limit  رفع الحد فقط     — the OTP-logs panel only (linkuplimit subdomain)
 *
 * This module is the single source of truth for "who can see/do what".
 * Both the middleware (route gating) and the UI (sidebar, action buttons)
 * read from here so there's no drift between what's shown and what's allowed.
 */

export const ROLES = ["manager", "supervisor", "support", "code_limit"] as const;
export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLE: Role = "manager";

/** Human labels for the UI. */
export const ROLE_LABELS: Record<Role, string> = {
  manager: "مدير",
  supervisor: "مشرف",
  support: "خدمة عملاء",
  code_limit: "رفع حد الأكواد",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  manager: "صلاحية كاملة على كل أقسام اللوحة، الموظفين والإعدادات.",
  supervisor: "كل العمليات (طلبات، منتجات، حسابات، إشعارات) عدا إدارة الموظفين والإعدادات.",
  support: "متابعة الطلبات وسجل التحقق فقط — بدون عرض كلمات المرور أو الأسرار.",
  code_limit: "الوصول إلى لوحة رفع حد الأكواد فقط، لا شيء غير ذلك.",
};

/**
 * Capabilities — fine-grained permission flags. UI hides controls the role
 * can't use; server actions re-check the relevant flag before mutating.
 */
export type Capability =
  | "view_dashboard"
  | "view_orders"
  | "manage_orders"
  | "view_products"
  | "manage_products"
  | "view_accounts" // includes viewing secrets
  | "manage_accounts"
  | "view_otp_logs"
  | "raise_code_limit"
  | "manage_bans"
  | "view_notifications"
  | "manage_notifications"
  | "view_messages"
  | "manage_messages"
  | "view_telegram"
  | "manage_telegram"
  | "view_integrations"
  | "manage_integrations"
  | "view_archives"
  | "manage_archives"
  | "manage_staff"
  | "manage_settings";

const ALL_CAPS: Capability[] = [
  "view_dashboard", "view_orders", "manage_orders", "view_products",
  "manage_products", "view_accounts", "manage_accounts", "view_otp_logs",
  "raise_code_limit", "manage_bans", "view_notifications", "manage_notifications",
  "view_messages", "manage_messages",
  "view_telegram", "manage_telegram", "view_integrations", "manage_integrations",
  "view_archives", "manage_archives", "manage_staff", "manage_settings",
];

const ROLE_CAPS: Record<Role, Capability[]> = {
  manager: ALL_CAPS,
  supervisor: [
    "view_dashboard", "view_orders", "manage_orders", "view_products",
    "manage_products", "view_accounts", "manage_accounts", "view_otp_logs",
    "raise_code_limit", "manage_bans", "view_notifications", "manage_notifications",
    "view_messages", "manage_messages",
    "view_telegram", "manage_telegram", "view_integrations", "manage_integrations",
    "view_archives", "manage_archives",
    // NOT: manage_staff, manage_settings
  ],
  support: [
    "view_dashboard", "view_orders", "manage_orders", "view_otp_logs",
    "raise_code_limit", "manage_bans",
    // NOT: any *_accounts (secrets), products, notifications, integrations,
    //      archives, staff, settings
  ],
  code_limit: [
    "view_otp_logs", "raise_code_limit",
  ],
};

export function can(role: Role, cap: Capability): boolean {
  return ROLE_CAPS[role]?.includes(cap) ?? false;
}

/**
 * Route access map. Each admin path prefix lists the roles allowed to open
 * it. The middleware matches the longest prefix. Anything not listed defaults
 * to manager-only (fail closed).
 */
type RouteRule = { prefix: string; roles: Role[] };

const ROUTE_RULES: RouteRule[] = [
  // Most specific first — matched by longest prefix.
  { prefix: "/admin/staff", roles: ["manager"] },
  { prefix: "/admin/settings", roles: ["manager"] },
  { prefix: "/admin/messages", roles: ["manager", "supervisor"] },
  { prefix: "/admin/integrations", roles: ["manager", "supervisor"] },
  { prefix: "/admin/telegram", roles: ["manager", "supervisor"] },
  { prefix: "/admin/notifications", roles: ["manager", "supervisor"] },
  { prefix: "/admin/accounts", roles: ["manager", "supervisor"] },
  { prefix: "/admin/products", roles: ["manager", "supervisor"] },
  { prefix: "/admin/archives", roles: ["manager", "supervisor"] },
  { prefix: "/admin/orders", roles: ["manager", "supervisor", "support"] },
  { prefix: "/admin/otp-logs", roles: ["manager", "supervisor", "support", "code_limit"] },
  { prefix: "/admin/profile", roles: ["manager", "supervisor", "support", "code_limit"] },
  { prefix: "/admin", roles: ["manager", "supervisor", "support"] }, // dashboard root
];

/** Returns true if `role` may open `pathname`. Longest-prefix wins. */
export function canAccessRoute(role: Role, pathname: string): boolean {
  const match = [...ROUTE_RULES]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/") || pathname.startsWith(r.prefix));
  if (!match) return role === "manager"; // fail closed
  return match.roles.includes(role);
}

/**
 * The landing route for a role after login — where the middleware sends them
 * if they try to open something they can't access. code_limit lands on the
 * OTP panel; everyone else on the dashboard.
 */
export function homeRouteForRole(role: Role): string {
  return role === "code_limit" ? "/admin/otp-logs" : "/admin";
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
