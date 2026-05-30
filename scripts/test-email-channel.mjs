/**
 * Live Resend smoke test.
 *
 * Verifies the API key, then sends both templates (order-ready + ban
 * alert) so we can confirm rendering + deliverability end-to-end.
 *
 * Run:  node scripts/test-email-channel.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const file of [".env", ".env.local"]) {
  try {
    const txt = readFileSync(path.join(root, file), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {}
}

const API_KEY = "re_NLLv1q7S_8MFLEKBJ247Q42JPAKbLfPuR";
const TO = process.argv[2] || "razexelite11@gmail.com";

// This is a send-only key (`restricted_api_key`), so /domains is forbidden.
// We skip the verify step and go straight to sending — Resend will reject
// unverified senders for us anyway.

// Verified sender domain: portaliosa.com (set up in the Resend dashboard).
const FROM = "PortalIosa <noreply@portaliosa.com>";
const REPLY_TO = "support@portaliosa.com";

console.log(`→ Using From: ${FROM}`);
console.log(`→ Sending to: ${TO}\n`);

async function send(payload) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => null);
  return { status: r.status, body: j };
}

// 2. Order-ready email.
const orderHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,Segoe UI,Tahoma,Arial,sans-serif;">
  <table width="100%" style="padding:40px 20px;"><tr><td align="center">
    <table width="600" style="max-width:600px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">
      <tr><td style="padding:48px 40px 32px 40px;text-align:center;">
        <div style="display:inline-block;width:60px;height:60px;background:#D4F542;border-radius:16px;line-height:60px;font-size:28px;margin-bottom:24px;">✓</div>
        <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:800;color:#0a0a0a;">طلبك جاهز للاستلام</h1>
        <p style="margin:0;font-size:16px;color:#666;">مرحباً محمد،</p>
      </td></tr>
      <tr><td style="padding:0 40px 24px 40px;">
        <table width="100%" style="background:#f9f9f5;border-radius:16px;padding:24px;"><tr><td>
          <div style="font-size:13px;color:#888;margin-bottom:6px;">رقم الطلب</div>
          <div style="font-size:22px;font-weight:700;color:#0a0a0a;direction:ltr;text-align:right;font-family:ui-monospace,monospace;margin-bottom:16px;">#TEST-1234</div>
          <div style="font-size:13px;color:#888;margin-bottom:6px;">المنتج</div>
          <div style="font-size:16px;font-weight:600;color:#0a0a0a;">ChatGPT Plus — اختبار قناة البريد</div>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:0 40px 32px 40px;text-align:center;">
        <p style="margin:0 0 24px 0;font-size:15px;color:#444;line-height:1.6;">
          للحصول على بيانات منتجك، اضغط على الزر أدناه.
        </p>
        <a href="https://www.portaliosa.com/pickup" style="display:inline-block;background:#0a0a0a;color:#D4F542;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;">استلم طلبك الآن</a>
      </td></tr>
      <tr><td style="padding:24px 40px;background:#fafaf7;border-top:1px solid #ececea;text-align:center;">
        <p style="margin:0;font-size:12px;color:#999;">إذا واجهت أي مشكلة، تواصل مع المتجر مباشرة.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

console.log("→ Sending order-ready email...");
const r1 = await send({
  from: FROM,
  to: TO,
  reply_to: REPLY_TO,
  subject: "طلبك #TEST-1234 جاهز للاستلام",
  html: orderHtml,
});
console.log(`  HTTP ${r1.status}`);
console.log(`  Response: ${JSON.stringify(r1.body)}`);

// 3. Ban-alert email.
const banHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,Segoe UI,Tahoma,Arial,sans-serif;">
  <table width="100%" style="padding:40px 20px;"><tr><td align="center">
    <table width="600" style="max-width:600px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">
      <tr><td style="padding:48px 40px 32px 40px;text-align:center;">
        <div style="display:inline-block;width:60px;height:60px;background:#fff3d6;border-radius:16px;line-height:60px;font-size:28px;margin-bottom:24px;">⚠️</div>
        <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#0a0a0a;">تنبيه أمني — PortalIosa</h1>
        <p style="margin:0;font-size:16px;color:#666;">مرحباً محمد،</p>
      </td></tr>
      <tr><td style="padding:0 40px 24px 40px;">
        <table width="100%" style="background:#fffaf0;border:1px solid #f5e7c8;border-radius:16px;padding:20px;"><tr><td>
          <div style="font-size:13px;color:#a07b3a;margin-bottom:6px;">السبب</div>
          <div style="font-size:15px;font-weight:600;color:#0a0a0a;">تم رصد محاولات متعددة فاشلة لطلب كود التحقق.</div>
          <div style="margin-top:14px;padding-top:14px;border-top:1px dashed #f0d690;">
            <div style="font-size:13px;color:#a07b3a;margin-bottom:4px;">مدة الحظر</div>
            <div style="font-size:15px;font-weight:700;color:#0a0a0a;">يوم</div>
          </div>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:0 40px 32px 40px;text-align:center;">
        <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">
          إذا كنت ترى أن هذا التقييد غير صحيح، يرجى التواصل مع خدمة العملاء.
        </p>
      </td></tr>
      <tr><td style="padding:20px 40px;background:#fafaf7;border-top:1px solid #ececea;text-align:center;">
        <p style="margin:0;font-size:12px;color:#999;">هذا إشعار آلي مرسل من نظام حماية الطلبات.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

console.log("\n→ Sending ban-alert email...");
const r2 = await send({
  from: FROM,
  to: TO,
  reply_to: REPLY_TO,
  subject: "تنبيه أمني — PortalIosa",
  html: banHtml,
});
console.log(`  HTTP ${r2.status}`);
console.log(`  Response: ${JSON.stringify(r2.body)}`);

const ok = (r1.status === 200 || r1.status === 202) && (r2.status === 200 || r2.status === 202);
if (ok) {
  console.log(`\n✓ Both emails sent. Check inbox for ${TO}.`);
} else {
  console.error("\n✗ One or both emails failed. See responses above.");
  process.exit(1);
}
