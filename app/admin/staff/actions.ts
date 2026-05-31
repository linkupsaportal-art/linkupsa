"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient, getCurrentUser, getCurrentRole } from "@/lib/supabase/server";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/auth/rbac";
import { createNotification } from "@/lib/db/notifications-center";
import { sendStaffInviteEmail, sendAdminAlertEmail } from "@/lib/notifications/email";
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
 * Change a staff member's role. Guards:
 *   - caller must be manager
 *   - you cannot change your own role (prevents a manager locking themselves out)
 *   - you cannot remove the last manager (store must always have one owner)
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

  // Guard the last-manager invariant: if the target is currently a manager
  // and we're demoting them, ensure at least one other manager remains.
  if (role !== "manager") {
    const { data: target } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (target?.role === "manager") {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "manager");
      if ((count ?? 0) <= 1) {
        return { ok: false, error: "يجب أن يبقى مدير واحد على الأقل." };
      }
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { ok: false, error: "تعذّر تحديث الدور. حاول مجدداً." };

  // Keep auth metadata in sync so future signups/JWT inspections agree.
  await admin.auth.admin
    .updateUserById(userId, { user_metadata: { role } })
    .catch(() => undefined);

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
    .select("email, name")
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

const inviteSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  role: z.enum(ROLES),
});

/**
 * Invite an EXISTING platform user to the team.
 *
 * Flow:
 *   1. Verify the email belongs to an existing account (else error — we do
 *      not create new users here; staff must already have signed up).
 *   2. Assign the chosen role on their profile + auth metadata.
 *   3. Drop an in-app notification (navbar bell) linking to /admin/staff.
 *   4. Mirror the invite to their inbox via Resend (verified domain).
 *
 * The invitee just logs in with their existing email + password and sees the
 * new role active immediately — no password reset, no separate accept page.
 */
export async function inviteStaffAction(input: unknown): Promise<StaffActionResult> {
  const guard = await assertManager();
  if (!guard.ok) return guard;

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const { email, role } = parsed.data;
  const normalized = email.trim().toLowerCase();

  const admin = createServiceClient();

  // 1. The email MUST belong to an existing platform account.
  const { data: target } = await admin
    .from("profiles")
    .select("id, name, email, role")
    .eq("email", normalized)
    .maybeSingle();

  if (!target) {
    return {
      ok: false,
      error: "لا يوجد حساب بهذا البريد. يجب أن يكون لدى الموظف حساب على المنصة أولاً.",
    };
  }
  if (target.id === guard.userId) {
    return { ok: false, error: "لا يمكنك دعوة نفسك." };
  }

  // 2. Assign the role.
  const { error: updErr } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", target.id);
  if (updErr) return { ok: false, error: "تعذّر تعيين الدور. حاول مجدداً." };
  await admin.auth.admin
    .updateUserById(target.id as string, { user_metadata: { role } })
    .catch(() => undefined);

  // 3. In-app notification (bell ping) → links to staff page.
  const who = await inviterName(guard.userId);
  await createNotification({
    userId: target.id as string,
    type: "staff_invite",
    title: "تمت دعوتك إلى الفريق",
    body: `قام ${who} بإضافتك كـ "${ROLE_LABELS[role]}". اضغط لعرض التفاصيل.`,
    link: "/admin/staff",
    actorId: guard.userId,
    actorName: who,
    metadata: { role },
  });

  // 4. Email mirror via Resend (verified domain) — best-effort.
  const inviteeName =
    (target.name as string | undefined) || normalized.split("@")[0];
  void sendStaffInviteEmail({
    to: normalized,
    inviteeName,
    inviterName: who,
    roleLabel: ROLE_LABELS[role],
    staffUrl: `${env.SITE_URL}/admin/staff`,
  });

  revalidatePath("/admin/staff");
  return { ok: true, message: `تمت دعوة ${normalized} كـ ${ROLE_LABELS[role]}.` };
}

const removeSchema = z.object({ userId: z.string().uuid() });

/**
 * Remove a staff member entirely (deletes the auth user). Same invariants as
 * role change: can't remove yourself, can't remove the last manager.
 */
export async function removeStaffAction(input: unknown): Promise<StaffActionResult> {
  const guard = await assertManager();
  if (!guard.ok) return guard;

  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "معرّف غير صالح" };
  const { userId } = parsed.data;

  if (userId === guard.userId) {
    return { ok: false, error: "لا يمكنك حذف حسابك الخاص." };
  }

  const admin = createServiceClient();
  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (target?.role === "manager") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "manager");
    if ((count ?? 0) <= 1) {
      return { ok: false, error: "يجب أن يبقى مدير واحد على الأقل." };
    }
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: "تعذّر حذف المستخدم." };

  revalidatePath("/admin/staff");
  return { ok: true, message: "تم حذف المستخدم." };
}

export type { Role };
