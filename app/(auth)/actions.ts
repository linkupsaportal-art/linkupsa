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
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور لا تقل عن 8 خانات"),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+[1-9]\d{6,17}$/.test(v), "رقم الجوال غير صالح")
    .optional()
    .default(""),
  phoneCountry: z
    .string()
    .trim()
    .toLowerCase()
    .length(2)
    .or(z.literal(""))
    .optional()
    .default("sa"),
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
  const { name, email, password, phone, phoneCountry } = parsed.data;
  const normalized = email.trim().toLowerCase();

  const admin = createServiceClient();

  // We use admin.createUser so we can leave email_confirm=false and roll our own OTP.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: normalized,
    password,
    email_confirm: false,
    user_metadata: {
      name,
      phone: phone || null,
      phone_country: phoneCountry || null,
    },
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
    try {
      await admin
        .from("email_otps")
        .update({ consumed_at: new Date().toISOString() })
        .eq("email", normalized)
        .is("consumed_at", null);
    } catch {
      // best-effort cleanup; swallow
    }
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
 *
 * Returns one of:
 *   { ok: true, mfaRequired: false }                → AAL1 session is enough; client redirects to /admin
 *   { ok: true, mfaRequired: true, factorId: "..." } → Client must complete MFA via verifyLoginMfaAction
 *   { ok: false, error }                            → Show inline error
 */
export async function loginAction(input: unknown): Promise<
  ActionResult<
    { mfaRequired: false } | { mfaRequired: true; factorId: string }
  >
> {
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

  // After password auth, check whether MFA is required to fully sign in.
  // Supabase exposes the assurance levels — if `nextLevel` > `currentLevel`,
  // we have a verified factor that hasn't been challenged yet.
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel === "aal1") {
    const { data: factors } = await sb.auth.mfa.listFactors();
    const totp = (factors?.totp ?? []).find((f) => f.status === "verified");
    if (totp) {
      revalidatePath("/", "layout");
      return { ok: true, mfaRequired: true, factorId: totp.id };
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, mfaRequired: false };
}

const verifyLoginMfaSchema = z.object({
  factorId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "الكود يجب أن يكون 6 أرقام"),
});

/**
 * Step 2 of MFA-enabled login: completes the TOTP challenge.
 * Caller already has an AAL1 session from `loginAction` — this upgrades it
 * to AAL2 by verifying the 6-digit code from the user's authenticator app.
 */
export async function verifyLoginMfaAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = verifyLoginMfaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "انتهت الجلسة. سجّل دخولك مجدداً." };

  const { data: challenge, error: chalErr } = await sb.auth.mfa.challenge({
    factorId: parsed.data.factorId,
  });
  if (chalErr || !challenge) return { ok: false, error: "تعذّر بدء التحقق." };

  const { error: verifyErr } = await sb.auth.mfa.verify({
    factorId: parsed.data.factorId,
    challengeId: challenge.id,
    code: parsed.data.code,
  });
  if (verifyErr) return { ok: false, error: "الكود غير صحيح أو منتهي." };

  revalidatePath("/", "layout");
  return { ok: true };
}

const verifyBackupSchema = z.object({
  /** XXXXX-XXXXX format — see app/admin/profile/actions.ts:generateBackupCode */
  code: z.string().regex(/^[A-F0-9]{5}-[A-F0-9]{5}$/i, "كود غير صالح"),
});

/**
 * Backup-code recovery path. Used when the user lost their authenticator
 * device. Verifies the code (atomic single-use), then unenrols all factors so
 * the user can log in without MFA. They MUST re-enrol from /admin/profile
 * after — UI surfaces this prominently.
 */
export async function verifyLoginBackupCodeAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = verifyBackupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "كود غير صالح. الصيغة: XXXXX-XXXXX" };
  }
  const code = parsed.data.code.toUpperCase();

  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "انتهت الجلسة. سجّل دخولك مجدداً." };

  const result = await consumeBackupCode(user.id, code);
  if (!result.ok) return { ok: false, error: result.error };

  // Code is good — wipe ALL TOTP factors so the AAL gate passes. The user
  // will be prompted to re-enrol from the profile page.
  const { data: factors } = await sb.auth.mfa.listFactors();
  for (const f of factors?.totp ?? []) {
    await sb.auth.mfa.unenroll({ factorId: f.id }).catch(() => undefined);
  }

  // Wipe remaining backup codes too — the device is presumed compromised.
  const admin = createServiceClient();
  await admin.from("mfa_backup_codes").delete().eq("user_id", user.id);

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Atomically consumes a single backup code for `userId`. Returns `{ ok: true }`
 * if a row matched the code's hash AND was successfully marked consumed.
 *
 * Implementation: pull the user's unconsumed rows, hash the input against each
 * row's salt to find the match, then UPDATE with a `.is("consumed_at", null)`
 * filter so a concurrent attempt can't reuse the same code.
 */
async function consumeBackupCode(
  userId: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createServiceClient();
  const { createHash } = await import("crypto");

  const { data: rows, error } = await admin
    .from("mfa_backup_codes")
    .select("id, code_hash, salt")
    .eq("user_id", userId)
    .is("consumed_at", null);

  if (error || !rows) return { ok: false, error: "حدث خطأ. حاول مجدداً." };

  const match = rows.find((r) => {
    const h = createHash("sha256").update(`${r.salt}:${code}`).digest("hex");
    return h === r.code_hash;
  });
  if (!match) return { ok: false, error: "كود غير صحيح أو سبق استخدامه." };

  const { data: consumed, error: consumeErr } = await admin
    .from("mfa_backup_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", match.id)
    .is("consumed_at", null)
    .select("id");

  if (consumeErr || !consumed || consumed.length === 0) {
    return { ok: false, error: "كود غير صحيح أو سبق استخدامه." };
  }
  return { ok: true };
}

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "الكود يجب أن يكون 6 أرقام"),
});

/**
 * Confirms the OTP, marks the auth user's email as verified, flips
 * profiles.email_verified, and (best-effort) auto-signs the user in so they
 * land on the dashboard instead of the login page. `signedIn` tells the
 * client which redirect to use.
 */
export async function verifyEmailAction(
  input: unknown,
): Promise<ActionResult<{ signedIn?: boolean }>> {
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

  // Sync profile flag — surface failures so the caller knows the flag wasn't
  // synced, instead of returning a misleading { ok: true }.
  const { error: profileErr } = await admin
    .from("profiles")
    .update({ email_verified: true })
    .eq("id", result.userId);

  if (profileErr) {
    console.error("[verifyEmailAction] profile sync failed", {
      userId: result.userId,
      message: profileErr.message,
    });
    return { ok: false, error: "تعذّر مزامنة الملف الشخصي. حاول مجدداً." };
  }

  // Auto-login: establish a session right after verification so the user
  // lands on the dashboard instead of the login page. We don't have the
  // password here, so we mint a one-time magic-link token with the admin
  // client and immediately consume it on the SSR client — this sets the
  // auth cookies server-side without re-prompting for credentials.
  try {
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = linkData?.properties?.hashed_token;
    if (!linkErr && tokenHash) {
      const ssr = await createClient();
      const { error: otpErr } = await ssr.auth.verifyOtp({
        token_hash: tokenHash,
        type: "magiclink",
      });
      if (!otpErr) {
        return { ok: true, signedIn: true };
      }
    }
  } catch (e) {
    // Non-fatal — fall through to the verified-but-not-signed-in result so
    // the user can still log in manually.
    console.error("[verifyEmailAction] auto-login failed", e);
  }

  return { ok: true, signedIn: false };
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
