"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient, getCurrentUser, getCurrentRole } from "@/lib/supabase/server";
import { can } from "@/lib/auth/rbac";

/**
 * Order management actions — the operational toolbox the spec lists under
 * "إجراءات الطلب": raise the code limit, reassign the account, resend the
 * delivery notification, stop/cancel, archive/unarchive, delete, and edit
 * the usage counter.
 *
 * Every mutating action re-checks the caller's capability server-side (the
 * UI also hides controls, but this is the real guard). The code-limit raise
 * is also writable by the `code_limit` role and is journaled to
 * `code_limit_changes` for the audit panel.
 */

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function actorName(userId: string): Promise<string> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("profiles")
    .select("name, email")
    .eq("id", userId)
    .maybeSingle();
  return (data?.name as string) || (data?.email as string) || "مشرف";
}

/* ── Raise / set the OTP request limit ──────────────────────────────────── */
const raiseLimitSchema = z.object({
  orderId: z.string().uuid(),
  newLimit: z.number().int().min(0).max(1000),
  reason: z.string().max(280).optional(),
});

export async function raiseOrderLimitAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "انتهت الجلسة." };
  const role = await getCurrentRole();
  if (!role || !can(role, "raise_code_limit")) {
    return { ok: false, error: "لا تملك صلاحية رفع الحد." };
  }

  const parsed = raiseLimitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "بيانات غير صالحة." };
  const { orderId, newLimit, reason } = parsed.data;

  const sb = createServiceClient();
  const { data: order } = await sb
    .from("orders")
    .select("id, salla_reference_id, otp_request_limit")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false, error: "الطلب غير موجود." };

  const previous = order.otp_request_limit as number;
  if (previous === newLimit) return { ok: true, message: "لا تغيير في الحد." };

  const { error: updErr } = await sb
    .from("orders")
    .update({ otp_request_limit: newLimit })
    .eq("id", orderId);
  if (updErr) return { ok: false, error: "تعذّر تحديث الحد." };

  // Journal the change for the audit panel.
  await sb.from("code_limit_changes").insert({
    order_id: orderId,
    order_reference: order.salla_reference_id ?? null,
    previous_limit: previous,
    new_limit: newLimit,
    changed_by: user.id,
    changed_by_name: await actorName(user.id),
    reason: reason ?? null,
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/otp-logs");
  return { ok: true, message: `تم تحديث الحد من ${previous} إلى ${newLimit}.` };
}

/* ── Edit current usage counter ─────────────────────────────────────────── */
const usageSchema = z.object({
  orderId: z.string().uuid(),
  otpRequestCount: z.number().int().min(0).max(100000),
});

export async function editOrderUsageAction(input: unknown): Promise<ActionResult> {
  const guard = await requireManageOrders();
  if (!guard.ok) return guard;

  const parsed = usageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "بيانات غير صالحة." };
  const { orderId, otpRequestCount } = parsed.data;

  const sb = createServiceClient();
  const { error } = await sb
    .from("orders")
    .update({ otp_request_count: otpRequestCount })
    .eq("id", orderId);
  if (error) return { ok: false, error: "تعذّر تعديل الاستهلاك." };

  revalidatePath("/admin/orders");
  return { ok: true, message: "تم تعديل الاستهلاك." };
}

/* ── Reassign to a different account ─────────────────────────────────────── */
const reassignSchema = z.object({
  orderId: z.string().uuid(),
  accountId: z.string().uuid(),
});

export async function reassignOrderAccountAction(input: unknown): Promise<ActionResult> {
  const guard = await requireManageOrders();
  if (!guard.ok) return guard;

  const parsed = reassignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "بيانات غير صالحة." };
  const { orderId, accountId } = parsed.data;

  const sb = createServiceClient();

  // Validate the target account exists and matches the order's product.
  const { data: order } = await sb
    .from("orders")
    .select("id, product_id, account_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false, error: "الطلب غير موجود." };

  const { data: account } = await sb
    .from("accounts")
    .select("id, product_id, status, current_usage, max_usage")
    .eq("id", accountId)
    .maybeSingle();
  if (!account) return { ok: false, error: "الحساب غير موجود." };
  if (order.product_id && account.product_id !== order.product_id) {
    return { ok: false, error: "الحساب لا يطابق منتج الطلب." };
  }

  // Decrement the old account's usage (best-effort), bump the new one.
  if (order.account_id && order.account_id !== accountId) {
    await sb.rpc("decrement_account_usage", { p_account_id: order.account_id }).then(
      () => {},
      () => {},
    );
  }

  const { error } = await sb
    .from("orders")
    .update({
      account_id: accountId,
      assigned_at: new Date().toISOString(),
      fulfillment_status: "fulfilled",
    })
    .eq("id", orderId);
  if (error) return { ok: false, error: "تعذّر تغيير الحساب." };

  // Bump new account usage.
  await sb
    .from("accounts")
    .update({ current_usage: (account.current_usage as number) + 1, last_assigned_at: new Date().toISOString() })
    .eq("id", accountId);

  revalidatePath("/admin/orders");
  return { ok: true, message: "تم تغيير الحساب المرتبط." };
}

/* ── Stop / cancel an order ─────────────────────────────────────────────── */
const orderIdSchema = z.object({ orderId: z.string().uuid() });

export async function stopOrderAction(input: unknown): Promise<ActionResult> {
  const guard = await requireManageOrders();
  if (!guard.ok) return guard;
  const parsed = orderIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "معرّف غير صالح." };

  const sb = createServiceClient();
  const { error } = await sb
    .from("orders")
    .update({ fulfillment_status: "cancelled" })
    .eq("id", parsed.data.orderId);
  if (error) return { ok: false, error: "تعذّر إيقاف الطلب." };

  revalidatePath("/admin/orders");
  return { ok: true, message: "تم إيقاف الطلب." };
}

/* ── Archive / unarchive ────────────────────────────────────────────────── */
export async function setOrderArchivedAction(input: unknown): Promise<ActionResult> {
  const guard = await requireManageOrders();
  if (!guard.ok) return guard;
  const parsed = z
    .object({ orderId: z.string().uuid(), archived: z.boolean() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "بيانات غير صالحة." };

  const sb = createServiceClient();
  const { error } = await sb
    .from("orders")
    .update({
      archived_at: parsed.data.archived ? new Date().toISOString() : null,
      archived_reason: parsed.data.archived ? "manual" : null,
    })
    .eq("id", parsed.data.orderId);
  if (error) return { ok: false, error: "تعذّر تحديث الأرشفة." };

  revalidatePath("/admin/orders");
  revalidatePath("/admin/archives");
  return { ok: true, message: parsed.data.archived ? "تمت الأرشفة." : "تمت الاستعادة." };
}

/* ── Delete ─────────────────────────────────────────────────────────────── */
export async function deleteOrderAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "انتهت الجلسة." };
  const role = await getCurrentRole();
  // Deleting is destructive — managers only.
  if (role !== "manager") return { ok: false, error: "الحذف متاح للمدير فقط." };

  const parsed = orderIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "معرّف غير صالح." };

  const sb = createServiceClient();
  const { error } = await sb.from("orders").delete().eq("id", parsed.data.orderId);
  if (error) return { ok: false, error: "تعذّر حذف الطلب." };

  revalidatePath("/admin/orders");
  return { ok: true, message: "تم حذف الطلب." };
}

/* ── Resend the delivery notification ───────────────────────────────────── */
export async function resendOrderNotificationAction(input: unknown): Promise<ActionResult> {
  const guard = await requireManageOrders();
  if (!guard.ok) return guard;
  const parsed = orderIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "معرّف غير صالح." };

  const sb = createServiceClient();
  const { data: order } = await sb
    .from("orders")
    .select(
      "id, store_id, customer_name, customer_email, customer_mobile, salla_reference_id, salla_order_id, product_id, fulfillment_status, products(name, notification_channels)",
    )
    .eq("id", parsed.data.orderId)
    .maybeSingle();
  if (!order) return { ok: false, error: "الطلب غير موجود." };
  if (order.fulfillment_status !== "fulfilled") {
    return { ok: false, error: "لا يمكن إعادة الإرسال — الطلب غير مكتمل التسليم." };
  }

  const prod = Array.isArray(order.products) ? order.products[0] : order.products;
  const channels = (prod?.notification_channels as { email?: boolean; whatsapp?: boolean } | null) ?? {
    email: true,
    whatsapp: false,
  };

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.portaliosa.com");

  const { notifyOrderReady } = await import("@/lib/notifications/dispatch");
  await notifyOrderReady({
    orderId: order.id as string,
    storeId: (order.store_id as number) ?? 0,
    customerName: (order.customer_name as string) ?? "",
    customerEmail: (order.customer_email as string) ?? null,
    customerMobile: (order.customer_mobile as string) ?? null,
    orderNumber: String(order.salla_reference_id ?? order.salla_order_id ?? ""),
    productName: prod?.name ?? "منتج رقمي",
    productNotificationChannels: channels,
    pickupUrl: `${origin}/pickup`,
  });

  revalidatePath("/admin/orders");
  return { ok: true, message: "تمت إعادة إرسال بيانات الطلب للعميل." };
}

/* ── Renew subscription — resets usage + bumps the OTP limit window ──────── */
const renewSchema = z.object({
  orderId: z.string().uuid(),
  addLimit: z.number().int().min(0).max(1000).optional(),
});

export async function renewOrderAction(input: unknown): Promise<ActionResult> {
  const guard = await requireManageOrders();
  if (!guard.ok) return guard;
  const parsed = renewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "بيانات غير صالحة." };
  const { orderId, addLimit } = parsed.data;

  const sb = createServiceClient();
  const { data: order } = await sb
    .from("orders")
    .select("id, otp_request_limit, salla_reference_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { ok: false, error: "الطلب غير موجود." };

  // Renewal = fresh cycle: reset the consumed count, optionally extend the
  // limit, and re-activate fulfillment so the customer can pull codes again.
  const newLimit = (order.otp_request_limit as number) + (addLimit ?? 0);
  const { error } = await sb
    .from("orders")
    .update({
      otp_request_count: 0,
      otp_request_limit: newLimit,
      fulfillment_status: "fulfilled",
      archived_at: null,
    })
    .eq("id", orderId);
  if (error) return { ok: false, error: "تعذّر تجديد الاشتراك." };

  // Journal the limit bump (if any) for the audit panel.
  if (addLimit && addLimit > 0) {
    const user = await getCurrentUser();
    await sb.from("code_limit_changes").insert({
      order_id: orderId,
      order_reference: order.salla_reference_id ?? null,
      previous_limit: order.otp_request_limit as number,
      new_limit: newLimit,
      changed_by: user?.id ?? null,
      changed_by_name: user ? await actorName(user.id) : null,
      reason: "تجديد اشتراك",
    });
  }

  revalidatePath("/admin/orders");
  return { ok: true, message: "تم تجديد الاشتراك وإعادة تعيين الاستهلاك." };
}

/* ── shared guard ───────────────────────────────────────────────────────── */
async function requireManageOrders(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "انتهت الجلسة." };
  const role = await getCurrentRole();
  if (!role || !can(role, "manage_orders")) {
    return { ok: false, error: "لا تملك صلاحية إدارة الطلبات." };
  }
  return { ok: true };
}
