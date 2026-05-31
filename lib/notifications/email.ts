/**
 * Email notifications via Resend.
 *
 * Supports two modes:
 *   1. Platform default — uses `RESEND_API_KEY` + `RESEND_FROM` from env.
 *   2. Merchant override — pass `config.api_key` / `config.from` /
 *      `config.reply_to` from the per-store `notification_channels.config`
 *      JSONB. Each call instantiates a fresh Resend client when an
 *      override is supplied so we never leak keys across tenants.
 */

import { Resend } from "resend";
import { env } from "@/lib/env";

export type EmailOverrides = {
  apiKey?: string;
  from?: string;
  replyTo?: string;
};

let defaultClient: Resend | null = null;

function getClient(apiKey?: string): Resend | null {
  const key = apiKey || env.RESEND_API_KEY;
  if (!key) return null;
  if (apiKey) return new Resend(apiKey); // override → fresh per call
  if (!defaultClient) defaultClient = new Resend(key);
  return defaultClient;
}

function pickFrom(o?: EmailOverrides): string {
  return (o?.from && o.from.trim()) || env.RESEND_FROM;
}

export async function sendOrderReadyEmail(args: {
  to: string;
  customerName: string;
  orderNumber: string;
  productName: string;
  pickupUrl: string;
  overrides?: EmailOverrides;
}): Promise<{ ok: boolean; error?: string }> {
  const r = getClient(args.overrides?.apiKey);
  if (!r) return { ok: false, error: "Resend not configured" };
  try {
    const result = await r.emails.send({
      from: pickFrom(args.overrides),
      to: args.to,
      replyTo: args.overrides?.replyTo,
      subject: `طلبك #${args.orderNumber} جاهز للاستلام`,
      html: renderTemplate(args),
    });
    if (result.error) return { ok: false, error: result.error.message };
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

/**
 * Phone-ban email alert. Mirrors the WhatsApp ban template so customers
 * who have email-on-file (or whose number can't receive WhatsApp) still
 * see why their access was restricted.
 */
export async function sendBanAlertEmail(args: {
  to: string;
  customerName: string;
  storeName: string;
  reason: string;
  durationLabel?: string | null;
  overrides?: EmailOverrides;
}): Promise<{ ok: boolean; error?: string }> {
  const r = getClient(args.overrides?.apiKey);
  if (!r) return { ok: false, error: "Resend not configured" };
  try {
    const result = await r.emails.send({
      from: pickFrom(args.overrides),
      to: args.to,
      replyTo: args.overrides?.replyTo,
      subject: `تنبيه أمني — ${args.storeName}`,
      html: renderBanTemplate(args),
    });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function renderBanTemplate(args: {
  customerName: string;
  storeName: string;
  reason: string;
  durationLabel?: string | null;
}): string {
  const duration = args.durationLabel?.trim();
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>تنبيه أمني</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:48px 40px 32px 40px;text-align:center;">
              <div style="display:inline-block;width:60px;height:60px;background:#fff3d6;border-radius:16px;line-height:60px;font-size:28px;margin-bottom:24px;">⚠️</div>
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#0a0a0a;letter-spacing:-0.02em;">تنبيه أمني — ${escapeHtml(args.storeName)}</h1>
              <p style="margin:0;font-size:16px;color:#666;line-height:1.6;">مرحباً ${escapeHtml(args.customerName)}،</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fffaf0;border:1px solid #f5e7c8;border-radius:16px;padding:20px;">
                <tr>
                  <td>
                    <div style="font-size:13px;color:#a07b3a;margin-bottom:6px;">السبب</div>
                    <div style="font-size:15px;font-weight:600;color:#0a0a0a;line-height:1.6;">${escapeHtml(args.reason)}</div>
                    ${
                      duration
                        ? `<div style="margin-top:14px;padding-top:14px;border-top:1px dashed #f0d690;">
                             <div style="font-size:13px;color:#a07b3a;margin-bottom:4px;">مدة الحظر</div>
                             <div style="font-size:15px;font-weight:700;color:#0a0a0a;">${escapeHtml(duration)}</div>
                           </div>`
                        : ""
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;text-align:center;">
              <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">
                إذا كنت ترى أن هذا التقييد غير صحيح، يرجى التواصل مع خدمة العملاء لإعادة التفعيل.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background:#fafaf7;border-top:1px solid #ececea;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
                هذا إشعار آلي مرسل من نظام حماية الطلبات.
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

/**
 * Staff invitation email — tells an EXISTING platform user that a manager
 * granted them a role on the store dashboard. Uses the platform Resend key +
 * verified domain (portaliosa.com). RTL Arabic, brand lime/black, NDA-safe.
 */
export async function sendStaffInviteEmail(args: {
  to: string;
  inviteeName: string;
  inviterName: string;
  roleLabel: string;
  staffUrl: string;
  overrides?: EmailOverrides;
}): Promise<{ ok: boolean; error?: string }> {
  const r = getClient(args.overrides?.apiKey);
  if (!r) return { ok: false, error: "Resend not configured" };
  try {
    const result = await r.emails.send({
      from: pickFrom(args.overrides),
      to: args.to,
      replyTo: args.overrides?.replyTo,
      subject: `تمت دعوتك للوحة التحكم — ${args.roleLabel}`,
      html: renderStaffInviteTemplate(args),
    });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function renderStaffInviteTemplate(args: {
  inviteeName: string;
  inviterName: string;
  roleLabel: string;
  staffUrl: string;
}): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>دعوة للوحة التحكم</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:48px 40px 24px 40px;text-align:center;">
              <div style="display:inline-block;width:60px;height:60px;background:#D4F542;border-radius:16px;line-height:60px;font-size:28px;margin-bottom:24px;">👥</div>
              <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#0a0a0a;letter-spacing:-0.02em;">تمت دعوتك للفريق</h1>
              <p style="margin:0;font-size:16px;color:#666;line-height:1.6;">مرحباً ${escapeHtml(args.inviteeName)}،</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f9f9f5;border-radius:16px;padding:24px;">
                <tr>
                  <td>
                    <div style="font-size:13px;color:#888;margin-bottom:6px;">قام بدعوتك</div>
                    <div style="font-size:18px;font-weight:700;color:#0a0a0a;margin-bottom:16px;">${escapeHtml(args.inviterName)}</div>
                    <div style="font-size:13px;color:#888;margin-bottom:6px;">الدور الممنوح لك</div>
                    <div style="display:inline-block;background:#0a0a0a;color:#D4F542;font-size:14px;font-weight:700;padding:6px 14px;border-radius:999px;">${escapeHtml(args.roleLabel)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;text-align:center;">
              <p style="margin:0 0 24px 0;font-size:15px;color:#444;line-height:1.6;">
                لديك حساب على المنصة بالفعل. سجّل دخولك بنفس بريدك وكلمة مرورك، وستجد صلاحياتك الجديدة فعّالة فوراً.
              </p>
              <a href="${escapeHtml(args.staffUrl)}" style="display:inline-block;background:#0a0a0a;color:#D4F542;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;">
                الدخول إلى لوحة التحكم
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background:#fafaf7;border-top:1px solid #ececea;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
                إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة بأمان.
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

/**
 * Generic admin alert email — used to mirror in-app notifications to the
 * recipient's inbox (e.g. role changed). Minimal branded shell.
 */
export async function sendAdminAlertEmail(args: {
  to: string;
  heading: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  overrides?: EmailOverrides;
}): Promise<{ ok: boolean; error?: string }> {
  const r = getClient(args.overrides?.apiKey);
  if (!r) return { ok: false, error: "Resend not configured" };
  try {
    const result = await r.emails.send({
      from: pickFrom(args.overrides),
      to: args.to,
      replyTo: args.overrides?.replyTo,
      subject: args.heading,
      html: `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:40px 20px;"><tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">
      <tr><td style="padding:40px 40px 16px;text-align:center;">
        <div style="display:inline-block;width:56px;height:56px;background:#D4F542;border-radius:14px;line-height:56px;font-size:24px;margin-bottom:20px;">🔔</div>
        <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#0a0a0a;">${escapeHtml(args.heading)}</h1>
        <p style="margin:0;font-size:15px;color:#444;line-height:1.7;">${escapeHtml(args.message)}</p>
      </td></tr>
      ${
        args.actionUrl
          ? `<tr><td style="padding:8px 40px 36px;text-align:center;">
               <a href="${escapeHtml(args.actionUrl)}" style="display:inline-block;background:#0a0a0a;color:#D4F542;text-decoration:none;padding:13px 30px;border-radius:12px;font-size:14px;font-weight:700;">${escapeHtml(args.actionLabel ?? "فتح اللوحة")}</a>
             </td></tr>`
          : ""
      }
      <tr><td style="padding:20px 40px;background:#fafaf7;border-top:1px solid #ececea;text-align:center;">
        <p style="margin:0;font-size:12px;color:#999;">إشعار آلي من لوحة تحكم LinkUp.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
    });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Verifies a Resend API key by sending a HEAD-equivalent request to
 * the API. Used by the admin "Test connection" button.
 *
 * Resend doesn't expose a /me endpoint; the cheapest no-side-effect
 * check is `GET /domains` which returns 200 on a valid key and 401 on
 * a bad one.
 */
export async function verifyResendKey(opts: {
  apiKey: string;
}): Promise<
  | { ok: true; domains: number }
  | { ok: false; error: string }
> {
  try {
    const r = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: { authorization: `Bearer ${opts.apiKey}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (r.status === 401) return { ok: false, error: "API key غير صحيح" };
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const json = (await r.json().catch(() => null)) as
      | { data?: unknown[] }
      | null;
    return { ok: true, domains: Array.isArray(json?.data) ? json!.data!.length : 0 };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "network error" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
