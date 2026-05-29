/**
 * Live test send — order_cancel template (only one that works with positional 5 params).
 * This proves the WhatsApp pipeline end-to-end on the merchant's Algeria number.
 */
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHAiOnsibmFtZSI6InBvcnRhbGlvc2EtZGVsaXZlcnkiLCJjcmVhdGVkQXQiOiIyMDI2LTA1LTI1VDA4OjEwOjQ4LjE1N1oiLCJub0V4cGlyZSI6dHJ1ZSwiYWxsb3dBbGxQZXJtaXNzaW9uIjp0cnVlLCJfaWQiOiJMRnRXaERyY21qV2h2aTBRZ29QalkiLCJfX3YiOjB9LCJpYXQiOjE3ODAwODEwMzZ9.UPvdZAI5eNOrTWKaOzqcdjq89Hn3m7Y3fxjfaxgppPk";
const URL = "https://akgroup.api.karzoun.chat/graphql";
const INTEGRATION_ID = "33tcPsPvYFyYgtmDFRgMj";
const TO = "213672661102";

const sendQ = `
mutation Send($integrationId: String!, $templateName: String!, $recipient: String!, $language: String!, $params: JSON) {
  whatsappSendTemplateMessage(
    integrationId: $integrationId, templateName: $templateName,
    recipient: $recipient, language: $language, params: $params
  ) { __typename }
}`;

// order_cancel placeholders, in order:
//   1. اسم العميل
//   2. رقم الطلب
//   3. المنتجات
//   4. قيمة الطلب  (used twice in body but counts as 1 named slot)
//   5. طريقة الدفع
const variables = {
  integrationId: INTEGRATION_ID,
  templateName: "order_cancel",
  recipient: TO,
  language: "ar",
  params: ["محمد - اختبار من PortalIosa", "TEST-" + Date.now(), "ChatGPT Plus", "99 ريال", "بطاقة بنكية"],
};

console.log("Sending test WhatsApp to:", TO);
console.log("Vars:", JSON.stringify(variables, null, 2));

const r = await fetch(URL, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-app-token": TOKEN },
  body: JSON.stringify({ query: sendQ, variables }),
});
const text = await r.text();
console.log("\nstatus:", r.status);
console.log("body:", text);
