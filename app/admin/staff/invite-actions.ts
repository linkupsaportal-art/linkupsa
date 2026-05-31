"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServiceClient, getCurrentUser, getCurrentRole } from "@/lib/supabase/server";
import { ROLES, ROLE_LABELS } from "@/lib/auth/rbac";
import { createNotification } from "@/lib/db/notifications-center";
import { sendStaffInviteEmail } from "@/lib/notifications/email";
import { env } from "@/lib/env";

/**
 * Invitation lifecycle — the accept/decline layer behind the workspace
 * switcher. Distinct from staff/actions.ts (which manages already-accepted
 * members). Flow:
 *
 *   manager invite → workspace_invitations row 'pending' (NO role applied yet)
 *                  → invitee notified (bell + email)
 *   invitee accept → invitation 'accepted' + role applied to their profile
 *   invitee decline→ invitation 'declined' (no access granted)
 *
 * This is what makes the switcher "based on invitations he accepted": only
 * accepted invitations grant a workspace.
 */

export type InviteResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function inviterName(userId: string): Promise<string> {
  const admin = createServiceClient();
  const { data } = await admin
    .from("profiles")
    .select("name, email")
    .eq("id", userId)
    .maybeSingle();
  return (data?.name as string) || (data?.email as string) || "مدير المتجر";
}

/** Resolves the primary connected store as the workspace being invited to. */
async function primaryStore(): Promise<{ store_id: number; store_name: string } | null> {
  const admin = createServiceClient();
  const { data } = await admin
    .from("salla_stores")
    .select("store_id, store_name")
    .is("uninstalled_at", null)
    .order("installed_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { store_id: data.store_id as number, store_name: (data.store_name as string) ?? "متجر سلة" };
}

const inviteSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  role: z.enum(ROLES),
});

/**
 * Create a PENDING invitation for an existing user. No role is applied until
 * they accept. Re-inviting the same user overwrites their pending row.
 */
export async function createInvitationAction(input: unknown): Promise<InviteResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "انتهت الجلسة." };
  if ((await getCurrentRole()) !== "manager") {
    return { ok: false, error: "هذا الإجراء متاح للمدير فقط." };
  }

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const { role } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  const admin = createServiceClient();

  const { data: target } = await admin
    .from("profiles")
    .select("id, name, email")
    .eq("email", email)
    .maybeSingle();
  if (!target) {
    return {
      ok: false,
      error: "لا يوجد حساب بهذا البريد. يجب أن يكون لدى الموظف حساب على المنصة أولاً.",
    };
  }
  if (target.id === user.id) {
    return { ok: false, error: "لا يمكنك دعوة نفسك." };
  }

  const store = await primaryStore();
  if (!store) {
    return { ok: false, error: "لا يوجد متجر مرتبط لإرسال الدعوة إليه." };
  }

  const who = await inviterName(user.id);

  // Upsert the invitation as pending (unique on store_id + invitee_id).
  const { error: invErr } = await admin
    .from("workspace_invitations")
    .upsert(
      {
        store_id: store.store_id,
        store_name: store.store_name,
        invitee_id: target.id,
        invitee_email: email,
        role,
        status: "pending",
        invited_by: user.id,
        invited_by_name: who,
        responded_at: null,
      },
      { onConflict: "store_id,invitee_id" },
    );
  if (invErr) return { ok: false, error: "تعذّر إنشاء الدعوة. حاول مجدداً." };

  // Notify the invitee — bell + email. The notification deep-links to the
  // staff page where the accept/decline banner shows.
  await createNotification({
    userId: target.id as string,
    type: "staff_invite",
    title: "لديك دعوة للانضمام",
    body: `دعاك ${who} للعمل في "${store.store_name}" كـ ${ROLE_LABELS[role]}. اقبل أو ارفض الدعوة.`,
    link: "/admin/staff",
    actorId: user.id,
    actorName: who,
    metadata: { role, store_id: store.store_id, kind: "invitation" },
  });

  void sendStaffInviteEmail({
    to: email,
    inviteeName: (target.name as string) || email.split("@")[0],
    inviterName: who,
    roleLabel: ROLE_LABELS[role],
    staffUrl: `${env.SITE_URL}/admin/staff`,
  });

  revalidatePath("/admin/staff");
  return { ok: true, message: `أُرسلت دعوة إلى ${email}. سيتم تفعيل صلاحياته عند قبوله.` };
}

const respondSchema = z.object({
  invitationId: z.string().uuid(),
  accept: z.boolean(),
});

/**
 * Invitee accepts or declines their own pending invitation.
 *   accept  → status 'accepted' + role applied to profile/auth metadata
 *   decline → status 'declined'  (no access granted)
 */
export async function respondInvitationAction(input: unknown): Promise<InviteResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "انتهت الجلسة." };

  const parsed = respondSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "بيانات غير صالحة" };
  const { invitationId, accept } = parsed.data;

  const admin = createServiceClient();

  // Load + verify ownership of the invitation.
  const { data: inv } = await admin
    .from("workspace_invitations")
    .select("id, invitee_id, role, status, store_name, invited_by, invited_by_name")
    .eq("id", invitationId)
    .maybeSingle();

  if (!inv || inv.invitee_id !== user.id) {
    return { ok: false, error: "الدعوة غير موجودة." };
  }
  if (inv.status !== "pending") {
    return { ok: false, error: "تم الرد على هذه الدعوة مسبقاً." };
  }

  const newStatus = accept ? "accepted" : "declined";
  const { error: updErr } = await admin
    .from("workspace_invitations")
    .update({ status: newStatus, responded_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("invitee_id", user.id)
    .eq("status", "pending");
  if (updErr) return { ok: false, error: "تعذّر تحديث الدعوة." };

  if (accept) {
    // Apply the granted role now (acceptance is what grants access).
    await admin.from("profiles").update({ role: inv.role }).eq("id", user.id);
    await admin.auth.admin
      .updateUserById(user.id, { user_metadata: { role: inv.role } })
      .catch(() => undefined);

    // Tell the inviter their invite was accepted.
    if (inv.invited_by) {
      await createNotification({
        userId: inv.invited_by as string,
        type: "system",
        title: "تم قبول الدعوة",
        body: `قَبِل ${(user.user_metadata?.name as string) || user.email} الانضمام كـ ${ROLE_LABELS[inv.role as keyof typeof ROLE_LABELS]}.`,
        link: "/admin/staff",
      });
    }
  } else if (inv.invited_by) {
    await createNotification({
      userId: inv.invited_by as string,
      type: "system",
      title: "تم رفض الدعوة",
      body: `رفض ${(user.user_metadata?.name as string) || user.email} دعوة الانضمام.`,
      link: "/admin/staff",
    });
  }

  revalidatePath("/admin/staff");
  revalidatePath("/admin");
  return {
    ok: true,
    message: accept ? "تم قبول الدعوة. صلاحياتك مفعّلة الآن." : "تم رفض الدعوة.",
  };
}

/** Manager revokes a pending invitation. */
export async function revokeInvitationAction(input: unknown): Promise<InviteResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "انتهت الجلسة." };
  if ((await getCurrentRole()) !== "manager") {
    return { ok: false, error: "هذا الإجراء متاح للمدير فقط." };
  }
  const parsed = z.object({ invitationId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "معرّف غير صالح" };

  const admin = createServiceClient();
  const { error } = await admin
    .from("workspace_invitations")
    .update({ status: "revoked", responded_at: new Date().toISOString() })
    .eq("id", parsed.data.invitationId)
    .eq("status", "pending");
  if (error) return { ok: false, error: "تعذّر إلغاء الدعوة." };

  revalidatePath("/admin/staff");
  return { ok: true, message: "أُلغيت الدعوة." };
}
