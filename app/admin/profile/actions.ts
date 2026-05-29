"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { randomBytes, createHash } from "crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { issueOtp, verifyOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/auth/mailer";

/**
 * All profile + security server actions.
 *
 * Conventions:
 *   - Returns `{ ok: true, ... }` on success, `{ ok: false, error }` on fail.
 *   - User is always identified server-side via `auth.getUser()` — never trust
 *     a `userId` arg from the client.
 *   - Service-role writes are only used where unavoidable (admin auth API,
 *     backup-code rows). Everything else goes through the user's session
 *     so RLS still enforces ownership.
 */

export type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/* ────────────────────────────────────────────────────────────────────── */
/*  Account info — name, store name, phone                                */
/* ────────────────────────────────────────────────────────────────────── */

const accountInfoSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير").max(80),
  storeName: z.string().trim().min(2, "اسم المتجر قصير").max(80),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^(\+[1-9]\d{6,17})?$/, "رقم الجوال غير صالح")
    .optional()
    .or(z.literal("")),
  phoneCountry: z
    .string()
    .trim()
    .toLowerCase()
    .length(2)
    .optional()
    .or(z.literal("")),
});

export async function updateAccountInfoAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = accountInfoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const { name, storeName, phone, phoneCountry } = parsed.data;

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "غير مصرّح" };

  // Update user_metadata so display name is available without an extra DB
  // read in the layout, AND keep `profiles` in sync as the source of truth.
  const { error: metaErr } = await sb.auth.updateUser({
    data: { name, store_name: storeName },
  });
  if (metaErr) return { ok: false, error: "تعذّر تحديث الحساب" };

  const phoneValue = phone || null;
  const phoneCountryValue = phoneValue ? (phoneCountry || null) : null;

  const { error: profileErr } = await sb
    .from("profiles")
    .update({
      name,
      store_name: storeName,
      phone: phoneValue,
      phone_country: phoneCountryValue,
    })
    .eq("id", user.id);
  if (profileErr) return { ok: false, error: "تعذّر حفظ الملف الشخصي" };

  revalidatePath("/admin", "layout");
  return { ok: true };
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Avatar — browser uploads directly to Supabase Storage, then calls   */
/*  setAvatarAction with the resulting public URL. This bypasses the    */
/*  Next.js Server Action body-size cap (1 MB by default) and is faster */
/*  than streaming the file through the app server.                     */
/* ────────────────────────────────────────────────────────────────────── */

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

const setAvatarSchema = z.object({
  /** The public URL returned by the browser-side upload. */
  avatarUrl: z.string().url(),
  /** The storage path inside the avatars bucket (e.g. `<user_id>/avatar-…webp`).
   *  Used to verify the URL belongs to *this* user's folder. */
  storagePath: z.string().min(1),
});

export async function setAvatarAction(
  input: unknown,
): Promise<ActionResult<{ avatarUrl: string }>> {
  const parsed = setAvatarSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "بيانات غير صالحة" };
  }
  const { avatarUrl, storagePath } = parsed.data;

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "غير مصرّح" };

  // Defense-in-depth: even though storage RLS blocks cross-folder writes, we
  // also reject persisting a URL that doesn't live under this user's folder.
  if (!storagePath.startsWith(`${user.id}/`)) {
    return { ok: false, error: "مسار الصورة غير صالح" };
  }

  // Delete the previous avatar (if any) so we don't pile up orphan blobs.
  const { data: oldRow } = await sb
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const oldUrl = oldRow?.avatar_url as string | null | undefined;
  if (oldUrl && oldUrl.includes("/avatars/")) {
    const oldPath = oldUrl.split("/avatars/")[1];
    if (oldPath && oldPath !== storagePath) {
      await sb.storage.from("avatars").remove([oldPath]).catch(() => undefined);
    }
  }

  const { error: profileErr } = await sb
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);
  if (profileErr) return { ok: false, error: "تعذّر حفظ الصورة" };

  // Mirror to user_metadata so the sidebar/topbar pick it up without an extra DB read.
  await sb.auth.updateUser({ data: { avatar_url: avatarUrl } }).catch(() => undefined);

  revalidatePath("/admin", "layout");
  return { ok: true, avatarUrl };
}

export async function removeAvatarAction(): Promise<ActionResult> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "غير مصرّح" };

  const { data: row } = await sb
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const oldUrl = row?.avatar_url as string | null | undefined;
  if (oldUrl && oldUrl.includes("/avatars/")) {
    const oldPath = oldUrl.split("/avatars/")[1];
    if (oldPath) {
      await sb.storage.from("avatars").remove([oldPath]).catch(() => undefined);
    }
  }

  await sb.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  await sb.auth.updateUser({ data: { avatar_url: null } }).catch(() => undefined);

  revalidatePath("/admin", "layout");
  return { ok: true };
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Email change — OTP flow (request → confirm)                           */
/* ────────────────────────────────────────────────────────────────────── */

const requestEmailChangeSchema = z.object({
  newEmail: z.string().email("بريد إلكتروني غير صالح"),
});

export async function requestEmailChangeAction(
  input: unknown,
): Promise<ActionResult<{ email: string }>> {
  const parsed = requestEmailChangeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const newEmail = parsed.data.newEmail.trim().toLowerCase();

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "غير مصرّح" };

  if (user.email?.toLowerCase() === newEmail) {
    return { ok: false, error: "هذا هو بريدك الحالي." };
  }

  // Make sure the new email isn't already taken.
  const admin = createServiceClient();
  const { data: taken } = await admin
    .from("profiles")
    .select("id")
    .eq("email", newEmail)
    .maybeSingle();
  if (taken && taken.id !== user.id) {
    return { ok: false, error: "هذا البريد مستخدم لحساب آخر." };
  }

  const otp = await issueOtp(newEmail, "email_change", user.id);
  if (!otp.ok) {
    return {
      ok: false,
      error:
        otp.error === "rate_limited"
          ? "تجاوزت عدد محاولات الإرسال. حاول بعد ساعة."
          : "تعذّر إرسال الكود حالياً.",
    };
  }

  try {
    await sendOtpEmail({ to: newEmail, code: otp.code, purpose: "email_change" });
  } catch {
    return { ok: false, error: "تعذّر إرسال البريد." };
  }

  return { ok: true, email: newEmail };
}

const confirmEmailChangeSchema = z.object({
  newEmail: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "الكود يجب أن يكون 6 أرقام"),
});

export async function confirmEmailChangeAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = confirmEmailChangeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const newEmail = parsed.data.newEmail.trim().toLowerCase();

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "غير مصرّح" };

  const result = await verifyOtp(newEmail, parsed.data.code, "email_change");
  if (!result.ok) {
    const map: Record<typeof result.error, string> = {
      expired: "انتهت صلاحية الكود.",
      invalid_code: "الكود غير صحيح.",
      too_many_attempts: "تجاوزت عدد المحاولات. اطلب كوداً جديداً.",
      not_found: "اطلب كوداً جديداً.",
      internal: "حدث خطأ. حاول مجدداً.",
    };
    return { ok: false, error: map[result.error] };
  }

  // Apply the email change via the admin API so we skip the email-confirm flow
  // (the OTP we just verified IS our confirmation).
  const admin = createServiceClient();
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
    email: newEmail,
    email_confirm: true,
  });
  if (updateErr) return { ok: false, error: "تعذّر تحديث البريد. حاول مجدداً." };

  await admin.from("profiles").update({ email: newEmail }).eq("id", user.id);

  revalidatePath("/admin", "layout");
  return { ok: true };
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Password change                                                       */
/* ────────────────────────────────────────────────────────────────────── */

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "أدخل كلمة المرور الحالية"),
    newPassword: z.string().min(8, "كلمة المرور لا تقل عن 8 خانات"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "كلمتا المرور غير متطابقتين",
  });

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const { currentPassword, newPassword } = parsed.data;

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !user.email) return { ok: false, error: "غير مصرّح" };

  // Verify the current password by attempting a re-login. Supabase doesn't
  // expose a "verify password" endpoint so this is the canonical pattern.
  const { error: signInErr } = await sb.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInErr) return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };

  const { error: updateErr } = await sb.auth.updateUser({ password: newPassword });
  if (updateErr) return { ok: false, error: "تعذّر تحديث كلمة المرور" };

  return { ok: true };
}

/* ────────────────────────────────────────────────────────────────────── */
/*  2FA — TOTP enrol / verify / disable + backup codes                    */
/* ────────────────────────────────────────────────────────────────────── */

/**
 * Starts MFA enrolment. Returns the otpauth URI + base64 QR for the client
 * to render. The factor stays in `unverified` state until the user proves
 * it works by submitting a 6-digit code via `verifyMfaEnrollAction`.
 */
export async function startMfaEnrollAction(): Promise<
  ActionResult<{ factorId: string; qr: string; secret: string }>
> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "غير مصرّح" };

  // Clean up any previous unverified factors so we never have orphans.
  const { data: factors } = await sb.auth.mfa.listFactors();
  const stale = factors?.totp?.filter((f) => f.status !== "verified") ?? [];
  for (const f of stale) {
    await sb.auth.mfa.unenroll({ factorId: f.id }).catch(() => undefined);
  }

  const { data, error } = await sb.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `LinkUp (${new Date().toISOString().slice(0, 10)})`,
  });
  if (error || !data) return { ok: false, error: "تعذّر بدء التفعيل." };

  return {
    ok: true,
    factorId: data.id,
    qr: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

const verifyMfaSchema = z.object({
  factorId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "الكود يجب أن يكون 6 أرقام"),
});

/**
 * Confirms the TOTP factor + generates 8 backup codes.
 * Returns the plaintext codes to display ONCE — they're stored hashed.
 */
export async function verifyMfaEnrollAction(
  input: unknown,
): Promise<ActionResult<{ backupCodes: string[] }>> {
  const parsed = verifyMfaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "غير مصرّح" };

  // Get a challenge for the new factor, then verify the code against it.
  const { data: challenge, error: chalErr } = await sb.auth.mfa.challenge({
    factorId: parsed.data.factorId,
  });
  if (chalErr || !challenge) return { ok: false, error: "تعذّر التفعيل." };

  const { error: verifyErr } = await sb.auth.mfa.verify({
    factorId: parsed.data.factorId,
    challengeId: challenge.id,
    code: parsed.data.code,
  });
  if (verifyErr) return { ok: false, error: "الكود غير صحيح." };

  // Issue + persist 8 backup codes (hashed).
  const codes = await regenerateBackupCodesInternal(user.id);
  return { ok: true, backupCodes: codes };
}

/**
 * Disables 2FA — unenrols ALL TOTP factors AND wipes all backup codes for
 * this user (clean slate).
 *
 * Atomicity rule: we only delete backup codes if EVERY unenroll succeeded.
 * If any factor failed to unenroll, we leave the codes in place so the user
 * can still recover their account — otherwise a network blip during
 * "disable" could lock them out (factor still exists, codes deleted → no
 * way back in).
 */
export async function disableMfaAction(): Promise<ActionResult> {
  const sb = await createClient();
  const admin = createServiceClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "غير مصرّح" };

  const { data: factors } = await sb.auth.mfa.listFactors();
  const totpFactors = factors?.totp ?? [];

  if (totpFactors.length === 0) {
    // Nothing to unenroll — but still purge any orphan backup codes.
    await admin.from("mfa_backup_codes").delete().eq("user_id", user.id);
    return { ok: true };
  }

  // Unenroll all factors in parallel and surface failures.
  const results = await Promise.allSettled(
    totpFactors.map((f) => sb.auth.mfa.unenroll({ factorId: f.id })),
  );

  const failed = results.filter((r) => {
    if (r.status === "rejected") return true;
    return Boolean(r.value.error);
  });

  if (failed.length > 0) {
    console.error("[disableMfaAction] unenroll failed for some factors", {
      userId: user.id,
      failedCount: failed.length,
      totalCount: totpFactors.length,
    });
    return {
      ok: false,
      error:
        "تعذّر تعطيل بعض عوامل المصادقة. لم يتم حذف أكواد النسخ الاحتياطي لتجنّب فقد الوصول. حاول مجدداً.",
    };
  }

  // Hard-delete backup codes — service role bypasses RLS.
  const { error: deleteErr } = await admin
    .from("mfa_backup_codes")
    .delete()
    .eq("user_id", user.id);
  if (deleteErr) {
    console.error("[disableMfaAction] backup-code delete failed", {
      userId: user.id,
      message: deleteErr.message,
    });
    // Factors are gone but codes lingered — non-fatal, return ok=true.
    // Next regenerate will overwrite anyway.
  }

  return { ok: true };
}

const regenerateBackupCodesSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "الكود يجب أن يكون 6 أرقام"),
});

/**
 * Regenerates the 8 backup codes — invalidates the previous batch.
 * Requires verifying the user's active 6-digit 2FA TOTP code first.
 */
export async function regenerateBackupCodesAction(
  input: unknown,
): Promise<ActionResult<{ backupCodes: string[] }>> {
  const parsed = regenerateBackupCodesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const { code } = parsed.data;

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "غير مصرّح" };

  // Require at least one verified factor before letting anyone regen codes.
  const { data: factors } = await sb.auth.mfa.listFactors();
  const verifiedFactor = (factors?.totp ?? []).find((f) => f.status === "verified");
  if (!verifiedFactor) return { ok: false, error: "فعّل المصادقة بخطوتين أولاً." };

  // Challenge the factor to get a challenge ID
  const { data: challenge, error: chalErr } = await sb.auth.mfa.challenge({
    factorId: verifiedFactor.id,
  });
  if (chalErr || !challenge) return { ok: false, error: "تعذّر التحقق من الهوية." };

  // Verify the submitted code against the challenge
  const { error: verifyErr } = await sb.auth.mfa.verify({
    factorId: verifiedFactor.id,
    challengeId: challenge.id,
    code,
  });
  if (verifyErr) return { ok: false, error: "كود التحقق غير صحيح." };

  const codes = await regenerateBackupCodesInternal(user.id);
  return { ok: true, backupCodes: codes };
}


/* ────────────────────────────────────────────────────────────────────── */
/*  Internals                                                             */
/* ────────────────────────────────────────────────────────────────────── */

const BACKUP_CODE_COUNT = 8;

function generateBackupCode(): string {
  // 10 hex chars rendered as XXXXX-XXXXX. ~5e11 entropy, easy to type.
  const raw = randomBytes(5).toString("hex").toUpperCase();
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
}

function hashBackupCode(salt: string, code: string): string {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

async function regenerateBackupCodesInternal(userId: string): Promise<string[]> {
  const admin = createServiceClient();

  // Wipe existing codes, issue fresh batch.
  await admin.from("mfa_backup_codes").delete().eq("user_id", userId);

  const codes = Array.from({ length: BACKUP_CODE_COUNT }, generateBackupCode);
  const rows = codes.map((code) => {
    const salt = randomBytes(16).toString("hex");
    return {
      user_id: userId,
      code_hash: hashBackupCode(salt, code),
      salt,
    };
  });

  await admin.from("mfa_backup_codes").insert(rows);
  return codes;
}
