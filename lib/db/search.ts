import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { can, type Role } from "@/lib/auth/rbac";

/**
 * Global command-palette search.
 *
 * One role-scoped sweep across the entities an operator actually looks up by
 * hand: orders, products, accounts, OTP/verification logs, and phone bans.
 * Each category is gated by the same capability flags the rest of the app
 * uses, so a `support` agent never sees account labels and a `code_limit`
 * operator only ever gets verification rows.
 *
 * Design notes:
 *   - NEVER returns secrets (passwords, TOTP seeds, card codes). Only labels,
 *     names, references, masked mobiles — the same data already visible in
 *     the list tables.
 *   - Intent detection: a numeric query is treated as an order reference /
 *     phone tail, so typing "1542" jumps straight to that order.
 *   - Per-category caps keep the payload tiny and the palette snappy.
 *   - Current data volumes are small; queries use indexed columns + ILIKE and
 *     cap hard, so this scales comfortably well past the present scale.
 */

export type SearchKind = "order" | "product" | "account" | "otp" | "ban";

export type SearchHit = {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle?: string;
  badge?: string;
  /** Destination when the user picks this hit. */
  href: string;
};

export type SearchResults = {
  orders: SearchHit[];
  products: SearchHit[];
  accounts: SearchHit[];
  otp: SearchHit[];
  bans: SearchHit[];
  total: number;
};

const PER_CATEGORY = 6;

/** Strip characters that would break a PostgREST `.or()` filter string. */
function sanitize(q: string): string {
  return q.replace(/[,()%*\\]/g, " ").trim();
}

const DIGITS = /^\d{2,}$/;

const FULFILL_AR: Record<string, string> = {
  pending: "بانتظار التسليم",
  fulfilled: "تم التسليم",
  failed: "فشل",
  cancelled: "ملغى",
};

const OTP_RESULT_AR: Record<string, string> = {
  success: "تم التحقق",
  phone_mismatch: "رقم غير مطابق",
  cooldown: "طلب متكرر",
  limit_exceeded: "تجاوز الحد",
  totp_error: "خطأ توليد",
  order_not_found: "طلب غير موجود",
};

function emptyResults(): SearchResults {
  return { orders: [], products: [], accounts: [], otp: [], bans: [], total: 0 };
}

export async function searchEverything(
  rawQuery: string,
  role: Role,
): Promise<SearchResults> {
  const q = sanitize(rawQuery);
  if (q.length < 2) return emptyResults();

  const sb = createServiceClient();
  const like = `%${q}%`;
  const numeric = DIGITS.test(q);
  const asNum = numeric ? Number(q) : null;

  const out = emptyResults();

  // Build the set of category queries the role is allowed to run, then fire
  // them in parallel. Anything the role can't view is simply skipped.
  const tasks: Promise<void>[] = [];

  // ── Orders ──────────────────────────────────────────────────────────
  if (can(role, "view_orders")) {
    tasks.push(
      (async () => {
        let query = sb
          .from("orders")
          .select(
            "id, salla_reference_id, salla_order_id, customer_name, customer_mobile, customer_mobile_last4, fulfillment_status, created_at, products(name, name_ar)",
          )
          .is("archived_at", null)
          .order("created_at", { ascending: false })
          .limit(PER_CATEGORY);

        if (numeric && asNum !== null) {
          query = query.or(
            `salla_reference_id.eq.${asNum},salla_order_id.eq.${asNum},customer_mobile.ilike.%${q}%`,
          );
        } else {
          query = query.or(
            `customer_name.ilike.${like},customer_email.ilike.${like},customer_mobile.ilike.${like}`,
          );
        }

        const { data } = await query;
        out.orders = (data ?? []).map((o) => {
          const prod = Array.isArray(o.products) ? o.products[0] : o.products;
          const ref = o.salla_reference_id ?? o.salla_order_id;
          return {
            id: o.id as string,
            kind: "order" as const,
            title: `#${ref} · ${o.customer_name ?? "عميل"}`,
            subtitle: prod?.name_ar || prod?.name || "—",
            badge: FULFILL_AR[o.fulfillment_status as string] ?? undefined,
            href: `/admin/orders?q=${encodeURIComponent(String(ref))}`,
          };
        });
      })(),
    );
  }

  // ── Products ────────────────────────────────────────────────────────
  if (can(role, "view_products")) {
    tasks.push(
      (async () => {
        const { data } = await sb
          .from("products")
          .select("id, name, name_ar, status, handler_type")
          .or(`name.ilike.${like},name_ar.ilike.${like}`)
          .limit(PER_CATEGORY);
        out.products = (data ?? []).map((p) => ({
          id: p.id as string,
          kind: "product" as const,
          title: (p.name_ar as string) || (p.name as string) || "—",
          subtitle: p.name_ar && p.name ? (p.name as string) : undefined,
          badge: p.status === "active" ? "نشط" : "متوقف",
          href: `/admin/products?q=${encodeURIComponent((p.name_ar as string) || (p.name as string) || "")}`,
        }));
      })(),
    );
  }

  // ── Accounts (labels only — never secrets) ───────────────────────────
  if (can(role, "view_accounts")) {
    tasks.push(
      (async () => {
        const { data } = await sb
          .from("accounts")
          .select("id, label, email, status, current_usage, max_usage, products(name, name_ar)")
          .or(`label.ilike.${like},email.ilike.${like}`)
          .limit(PER_CATEGORY);
        out.accounts = (data ?? []).map((a) => {
          const prod = Array.isArray(a.products) ? a.products[0] : a.products;
          return {
            id: a.id as string,
            kind: "account" as const,
            title: (a.label as string) || "—",
            subtitle: prod?.name_ar || prod?.name || (a.email as string) || undefined,
            badge: `${a.current_usage}/${a.max_usage}`,
            href: `/admin/accounts?q=${encodeURIComponent((a.label as string) || "")}`,
          };
        });
      })(),
    );
  }

  // ── OTP / verification logs ──────────────────────────────────────────
  // Joined to orders; we pull a recent window and match in JS because the
  // searchable fields live on the joined order row.
  if (can(role, "view_otp_logs")) {
    tasks.push(
      (async () => {
        const { data } = await sb
          .from("otp_logs")
          .select(
            "id, result, requested_at, order_id, orders!inner(salla_reference_id, customer_name, customer_mobile, customer_mobile_last4)",
          )
          .order("requested_at", { ascending: false })
          .limit(150);
        const ql = q.toLowerCase();
        const matched = (data ?? [])
          .filter((r) => {
            const o = Array.isArray(r.orders) ? r.orders[0] : r.orders;
            if (!o) return false;
            return (
              String(o.salla_reference_id ?? "").includes(q) ||
              (o.customer_name ?? "").toLowerCase().includes(ql) ||
              (o.customer_mobile ?? "").includes(q) ||
              (o.customer_mobile_last4 ?? "").includes(q)
            );
          })
          .slice(0, PER_CATEGORY);
        out.otp = matched.map((r) => {
          const o = Array.isArray(r.orders) ? r.orders[0] : r.orders;
          return {
            id: r.id as string,
            kind: "otp" as const,
            title: `#${o?.salla_reference_id ?? "طلب"} · ${o?.customer_name ?? "عميل"}`,
            subtitle: o?.customer_mobile_last4 ? `••••${o.customer_mobile_last4}` : undefined,
            badge: OTP_RESULT_AR[r.result as string] ?? (r.result as string),
            href: `/admin/otp-logs`,
          };
        });
      })(),
    );
  }

  // ── Phone bans ───────────────────────────────────────────────────────
  if (can(role, "manage_bans")) {
    tasks.push(
      (async () => {
        const { data } = await sb
          .from("phone_bans")
          .select("id, mobile, reason, active, auto_banned")
          .ilike("mobile", like)
          .order("created_at", { ascending: false })
          .limit(PER_CATEGORY);
        out.bans = (data ?? []).map((b) => ({
          id: b.id as string,
          kind: "ban" as const,
          title: b.mobile as string,
          subtitle: (b.reason as string) || (b.auto_banned ? "حظر تلقائي" : "حظر يدوي"),
          badge: b.active ? "محظور" : "منتهٍ",
          href: `/admin/otp-logs`,
        }));
      })(),
    );
  }

  await Promise.all(tasks);

  out.total =
    out.orders.length +
    out.products.length +
    out.accounts.length +
    out.otp.length +
    out.bans.length;

  return out;
}
