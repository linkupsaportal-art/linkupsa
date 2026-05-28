import "server-only";

import { Resend } from "resend";
import { env } from "@/lib/env";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing. Add it to .env.");
    }
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
}

/**
 * Sends the 6-digit confirmation code to the user. RTL Arabic, brand colors,
 * no infrastructure mentions (NDA-safe).
 */
export async function sendOtpEmail(opts: {
  to: string;
  code: string;
  /** Used in the subject line and headline. */
  purpose?: "signup" | "recovery" | "email_change";
}) {
  const resend = getResend();
  const subject =
    opts.purpose === "recovery"
      ? "كود استعادة حسابك — LinkUp"
      : opts.purpose === "email_change"
      ? "تأكيد تغيير البريد — LinkUp"
      : "كود تأكيد حسابك — LinkUp";

  const html = renderOtpEmail({ code: opts.code, purpose: opts.purpose ?? "signup" });

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM,
    to: opts.to,
    subject,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message ?? "unknown"}`);
}

function renderOtpEmail({
  code,
  purpose,
}: {
  code: string;
  purpose: "signup" | "recovery" | "email_change";
}): string {
  const headline =
    purpose === "recovery"
      ? "استعادة حسابك"
      : purpose === "email_change"
      ? "تأكيد تغيير البريد"
      : "تأكيد حسابك";

  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${headline} · LinkUp</title>
  </head>
  <body style="margin:0;padding:0;background:#1E1F22;font-family:'IBM Plex Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">كود التأكيد: ${code}. يصلح لـ 10 دقائق فقط.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1E1F22;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#2B2D31;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:40px 32px;">
            <tr>
              <td align="right" style="padding-bottom:24px;">
                <span style="display:inline-block;background:#5865F2;color:#fff;padding:6px 12px;border-radius:6px;font-weight:700;font-size:18px;letter-spacing:0.02em;">LinkUp</span>
              </td>
            </tr>
            <tr>
              <td align="right" style="font-size:24px;font-weight:700;color:#F2F3F5;line-height:1.4;padding-bottom:8px;">
                ${headline}
              </td>
            </tr>
            <tr>
              <td align="right" style="font-size:14px;color:#B5BAC1;line-height:1.7;padding-bottom:24px;">
                استخدم الكود التالي لإكمال العملية. يصلح لمدة 10 دقائق فقط.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 0;">
                <div style="display:inline-block;background:#1E1F22;border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:20px 28px;font-family:'Geist Mono','Courier New',monospace;font-size:36px;letter-spacing:14px;color:#F2F3F5;font-weight:700;">
                  ${code}
                </div>
              </td>
            </tr>
            <tr>
              <td align="right" style="font-size:13px;color:#949BA4;line-height:1.7;padding-top:24px;">
                إذا لم تطلب هذا الكود، تجاهل هذه الرسالة. لن يتم اتخاذ أي إجراء على حسابك.
              </td>
            </tr>
            <tr>
              <td align="right" style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;margin-top:24px;font-size:12px;color:#6D6F78;">
                LinkUp · منصة التسليم الرقمي المؤتمت لمتاجر سلة
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
