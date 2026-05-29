/**
 * Order-fulfilled email notification.
 *
 * Sent automatically when allocate_account succeeds.
 * Uses the existing Resend setup (lib/auth/resend.ts already configured).
 */

import { Resend } from "resend";
import { env } from "@/lib/env";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

export async function sendOrderReadyEmail(args: {
  to: string;
  customerName: string;
  orderNumber: string;
  productName: string;
  pickupUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const r = getResend();
  if (!r) return { ok: false, error: "Resend not configured" };

  try {
    const result = await r.emails.send({
      from: env.RESEND_FROM,
      to: args.to,
      subject: `طلبك #${args.orderNumber} جاهز للاستلام`,
      html: renderTemplate(args),
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function renderTemplate(args: {
  customerName: string;
  orderNumber: string;
  productName: string;
  pickupUrl: string;
}): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>طلبك جاهز</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:48px 40px 32px 40px;text-align:center;">
              <div style="display:inline-block;width:60px;height:60px;background:#D4F542;border-radius:16px;line-height:60px;font-size:28px;margin-bottom:24px;">✓</div>
              <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:800;color:#0a0a0a;letter-spacing:-0.02em;">طلبك جاهز للاستلام</h1>
              <p style="margin:0;font-size:16px;color:#666;line-height:1.6;">مرحباً ${escapeHtml(args.customerName)}،</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f9f9f5;border-radius:16px;padding:24px;">
                <tr>
                  <td>
                    <div style="font-size:13px;color:#888;margin-bottom:6px;">رقم الطلب</div>
                    <div style="font-size:22px;font-weight:700;color:#0a0a0a;direction:ltr;text-align:right;font-family:ui-monospace,SFMono-Regular,monospace;margin-bottom:16px;">#${escapeHtml(args.orderNumber)}</div>
                    <div style="font-size:13px;color:#888;margin-bottom:6px;">المنتج</div>
                    <div style="font-size:16px;font-weight:600;color:#0a0a0a;">${escapeHtml(args.productName)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;text-align:center;">
              <p style="margin:0 0 24px 0;font-size:15px;color:#444;line-height:1.6;">
                للحصول على بيانات منتجك، اضغط على الزر أدناه وأدخل رقم الطلب وآخر 4 أرقام من جوالك المسجل في الطلب.
              </p>
              <a href="${escapeHtml(args.pickupUrl)}" style="display:inline-block;background:#0a0a0a;color:#D4F542;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;">
                استلم طلبك الآن
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background:#fafaf7;border-top:1px solid #ececea;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
                إذا كنت تواجه أي مشكلة في الاستلام، تواصل مع المتجر مباشرة.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
