"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient, getCurrentUser, getCurrentRole } from "@/lib/supabase/server";
import { ROLES, ROLE_LABELS } from "@/lib/auth/rbac";
import { createNotification } from "@/lib/db/notifications-center";
import { sendAdminAlertEmail } from "@/lib/notifications/email";
import { env } from "@/lib/env";

/**
 * Staff management server actions. Every mutation re-checks that the caller
 * is a `manager` — never trust the UI, which only hides controls. The
 * middleware already blocks non-managers from /admin/staff, but these
 * actions are a second, independent guard (defense in depth).
 */

export type StaffActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

/** Resolves the inviter's display name for notifications/emails. */
async function inviterName(userId: string): Promise<string> {
  const admin = createServiceClient();
  const { data } = await admin
    .from("profiles")
    .select("name, email")
    .eq("id", userId)
    .maybeSingle();
  return (data?.name as string | undefined) || (data?.email as string | undefined) || "مدير المتجر";
}

async function assertManager(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "انتهت الجلسة. سجّل دخولك مجدداً." };
  const role = await getCurrentRole();
  if (role !== "manager") {
    return { ok: false, error: "هذا الإجراء متاح للمدير فقط." };
  }
  return { ok: true, userId: user.id };
}

const setRoleSchema = z.object({
  userId: z.string().uuid("معرّف مستخدم غير صالح"),
  role: z.enum(ROLES),
});

/**
 * Change a staff member's role within the manager's store. Updates the
 * store_members row (scoped to the store), not the global profile. Guards:
 *   - caller must be manager
 *   - cannot change own role
 *   - cannot change the owner's role
 */
export async function setStaffRoleAction(input: unknown): Promise<StaffActionResult> {
  const guard = await assertManager();
  if (!guard.ok) return guard;

  const parsed = setRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const { userId, role } = parsed.data;

  if (userId === guard.userId) {
    return { ok: false, error: "لا يمكنك تغيير دورك الخاص." };
  }

  const admin = createServiceClient();

  // Scope to the manager's store.
  const { data: myMembership } = await admin
    .from("store_members")
    .select("store_id")
    .eq("user_id", guard.userId)
    .order("is_owner", { ascending: false })
    .limit(1)
    .maybeSingle();
  const storeId = myMembership?.store_id;
  if (!storeId) return { ok: false, error: "تعذّر تحديد المتجر." };

  // Can't change the owner's role.
  const { data: targetMembership } = await admin
    .from("store_members")
    .select("is_owner")
    .eq("store_id", storeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!targetMembership) {
    return { ok: false, error: "هذا المستخدم ليس عضواً في المتجر." };
  }
  if (targetMembership.is_owner) {
    return { ok: false, error: "لا يمكن تغيير دور مالك المتجر." };
  }

  const { error } = await admin
    .from("store_members")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("store_id", storeId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: "تعذّر تحديث الدور. حاول مجدداً." };

  // Notify the affected user (bell + email mirror).
  const who = await inviterName(guard.userId);
  const staffUrl = `${env.SITE_URL}/admin/staff`;
  await createNotification({
    userId,
    type: "role_changed",
    title: "تم تحديث دورك",
    body: `قام ${who} بتعيين دورك إلى: ${ROLE_LABELS[role]}`,
    link: "/admin/staff",
    actorId: guard.userId,
    actorName: who,
    metadata: { role },
  });
  const { data: tgt } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  if (tgt?.email) {
    void sendAdminAlertEmail({
      to: tgt.email as string,
      heading: "تم تحديث دورك في لوحة التحكم",
      message: `قام ${who} بتعيين دورك إلى "${ROLE_LABELS[role]}". سجّل دخولك لرؤية صلاحياتك الجديدة.`,
      actionUrl: staffUrl,
      actionLabel: "فتح اللوحة",
    });
  }

  revalidatePath("/admin/staff");
  return { ok: true, message: "تم تحديث الدور." };
}

const removeSchema = z.object({ userId: z.string().uuid() });

/**
 * Remove a staff member from the store — revokes their MEMBERSHIP, it does
 * NOT delete their account. The user keeps their login; they simply lose
 * access to this store's dashboard. Invariants:
 *   - can't remove yourself
 *   - can't remove the store owner
 */
export async function removeStaffAction(input: unknown): Promise<StaffActionResult> {
  const guard = await assertManager();
  if (!guard.ok) return guard;

  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "معرّف غير صالح" };
  const { userId } = parsed.data;

  if (userId === guard.userId) {
    return { ok: false, error: "لا يمكنك إزالة نفسك." };
  }

  const admin = createServiceClient();

  // Find the store this manager owns/manages so we scope the removal.
  const { data: myMembership } = await admin
    .from("store_members")
    .select("store_id")
    .eq("user_id", guard.userId)
    .order("is_owner", { ascending: false })
    .limit(1)
    .maybeSingle();
  const storeId = myMembership?.store_id;
  if (!storeId) return { ok: false, error: "تعذّر تحديد المتجر." };

  // Never remove the owner.
  const { data: targetMembership } = await admin
    .from("store_members")
    .select("is_owner")
    .eq("store_id", storeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (targetMembership?.is_owner) {
    return { ok: false, error: "لا يمكن إزالة مالك المتجر." };
  }

  // Drop the membership (revoke access) — account stays intact.
  const { error: delErr } = await admin
    .from("store_members")
    .delete()
    .eq("store_id", storeId)
    .eq("user_id", userId);
  if (delErr) return { ok: false, error: "تعذّر إزالة العضو." };

  // Mark any accepted invitation as revoked so the switcher updates.
  await admin
    .from("workspace_invitations")
    .update({ status: "revoked", responded_at: new Date().toISOString() })
    .eq("store_id", storeId)
    .eq("invitee_id", userId)
    .eq("status", "accepted");

  // Notify the removed user (bell). Best-effort.
  const who = await inviterName(guard.userId);
  await createNotification({
    userId,
    type: "system",
    title: "تم إنهاء وصولك",
    body: `قام ${who} بإزالة وصولك إلى لوحة التحكم.`,
    link: "/admin/staff",
  });

  revalidatePath("/admin/staff");
  return { ok: true, message: "تمت إزالة العضو من المتجر." };
}
