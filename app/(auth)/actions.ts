"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { issueOtp, verifyOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/auth/mailer";

/**
 * All auth server actions for the (auth) route group.
 *
 * Returned shape across the board:
 *   { ok: true, … }            on success — server actions can also redirect()
 *   { ok: false, error: '…' }  on failure — caller renders the message inline
 */

export type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

const registerSchema = z.object({
  name: z.string().min(2, "الاسم قصير"),
  storeName: z.string().min(2, "اسم المتجر قصير"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور لا تقل عن 8 خانات"),
});

/**
 * Step 1 of signup — creates the auth user with `email_confirm = false`,
 * then mails a 6-digit OTP via Resend.
 *
 * Returns the email so the client can navigate to /verify-email?email=…
 */
export async function registerAction(input: unknown): Promise<ActionResult<{ email: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const { name, storeName, email, password } = parsed.data;
  const normalized = email.trim().toLowerCase();

  const admin = createServiceClient();

  // We use admin.createUser so we can leave email_confirm=false and roll our own OTP.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: normalized,
    password,
    email_confirm: false,
    user_metadata: { name, store_name: storeName },
  });

  if (createErr) {
    if ((createErr.message ?? "").toLowerCase().includes("already")) {
      return { ok: false, error: "هذا البريد مسجَّل مسبقاً." };
    }
    return { ok: false, error: createErr.message ?? "تعذّر إنشاء الحساب" };
  }

  const userId = created.user?.id;

  const otp = await issueOtp(normalized, "signup", userId);
  if (!otp.ok) {
    // Roll back the half-created auth user so the email isn't locked.
    if (userId) await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    return {
      ok: false,
      error:
        otp.error === "rate_limited"
          ? "تجاوزت عدد محاولات الإرسال. حاول بعد ساعة."
          : "تعذّر إرسال الكود حالياً.",
    };
  }

  try {
    await sendOtpEmail({ to: normalized, code: otp.code, purpose: "signup" });
  } catch (e) {
    // Roll back: delete the auth user + invalidate the just-issued OTP so a
    // retry from /register works cleanly. Without this the email stays "taken".
    if (userId) await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    await admin.from("email_otps").update({ consumed_at: new Date().toISOString() })
      .eq("email", normalized).is("consumed_at", null).catch(() => undefined);
    const detail = e instanceof Error ? e.message : "تعذّر إرسال البريد";
    return { ok: false, error: detail };
  }

  return { ok: true, email: normalized };
}

const loginSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور لا تقل عن 8 خانات"),
});

/**
 * Email + password login. Sets the auth cookies on success.
 * If the user hasn't confirmed their email yet, surfaces a helpful error.
 */
export async function loginAction(input: unknown): Promise<ActionResult<{ next?: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const { email, password } = parsed.data;

  const sb = await createClient();
  const { error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    const msg = (error.message ?? "").toLowerCase();
    if (msg.includes("email not confirmed")) {
      return { ok: false, error: "بريدك غير مؤكد. ادخل /verify-email للتأكيد." };
    }
    return { ok: false, error: "بريد أو كلمة مرور غير صحيحة" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "الكود يجب أن يكون 6 أرقام"),
});

/**
 * Confirms the OTP, marks the auth user's email as verified, flips
 * profiles.email_verified, and signs the user in via a magic-link token.
 */
export async function verifyEmailAction(input: unknown): Promise<ActionResult> {
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }
  const { email, code } = parsed.data;

  const result = await verifyOtp(email, code, "signup");
  if (!result.ok) {
    const map: Record<typeof result.error, string> = {
      expired: "انتهت صلاحية الكود. اطلب كوداً جديداً.",
      invalid_code: "الكود غير صحيح.",
      too_many_attempts: "تجاوزت عدد المحاولات. اطلب كوداً جديداً.",
      not_found: "لم يتم العثور على كود. اطلب كوداً جديداً.",
      internal: "حدث خطأ. حاول مجدداً.",
    };
    return { ok: false, error: map[result.error] };
  }

  if (!result.userId) {
    return { ok: false, error: "تعذّر العثور على الحساب." };
  }

  const admin = createServiceClient();

  // Mark email as confirmed in auth.users
  const { error: confirmErr } = await admin.auth.admin.updateUserById(result.userId, {
    email_confirm: true,
  });
  if (confirmErr) {
    return { ok: false, error: "تعذّر تأكيد البريد. حاول مجدداً." };
  }

  // Sync profile flag
  await admin
    .from("profiles")
    .update({ email_verified: true })
    .eq("id", result.userId);

  return { ok: true };
}

export async function resendCodeAction(emailRaw: string): Promise<ActionResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) {
    return { ok: false, error: "بريد إلكتروني غير صالح" };
  }

  // Look up user by email (admin only)
  const admin = createServiceClient();
  const { data: row } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();

  const otp = await issueOtp(email, "signup", row?.id);
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
    await sendOtpEmail({ to: email, code: otp.code, purpose: "signup" });
  } catch {
    return { ok: false, error: "تعذّر إرسال البريد." };
  }
  return { ok: true };
}

export async function signOutAction() {
  const sb = await createClient();
  await sb.auth.signOut();
  redirect("/login");
}
