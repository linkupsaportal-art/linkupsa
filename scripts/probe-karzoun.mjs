const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHAiOnsibmFtZSI6InBvcnRhbGlvc2EtZGVsaXZlcnkiLCJjcmVhdGVkQXQiOiIyMDI2LTA1LTI1VDA4OjEwOjQ4LjE1N1oiLCJub0V4cGlyZSI6dHJ1ZSwiYWxsb3dBbGxQZXJtaXNzaW9uIjp0cnVlLCJfaWQiOiJMRnRXaERyY21qV2h2aTBRZ29QalkiLCJfX3YiOjB9LCJpYXQiOjE3ODAwODEwMzZ9.UPvdZAI5eNOrTWKaOzqcdjq89Hn3m7Y3fxjfaxgppPk";
const URL = "https://akgroup.api.karzoun.chat/graphql";
const INTEGRATION_ID = "33tcPsPvYFyYgtmDFRgMj";
const TO = "213672661102";
const PICKUP = "https://www.portaliosa.com/pickup";

async function gql(query, variables) {
  const r = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-app-token": TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  return await r.json();
}

const sendQ = `mutation Send($integrationId: String!, $templateId: String, $templateName: String, $language: String, $recipient: String, $params: JSON) {
  whatsappSendTemplateMessage(integrationId: $integrationId, templateId: $templateId, templateName: $templateName, language: $language, recipient: $recipient, params: $params) { __typename }
}`;

// Test named template `new_order_for_c` with various key formats
const tests = [
  { label: "BODY_store_name", params: {
    "BODY_store_name": "لينك اب",
    "BODY_customer_name": "محمد",
    "BODY_order_number": "263047555",
    "BODY_product_name": "ChatGPT Plus",
    "BODY_duration": "1 شهر",
    "BODY_order_link": PICKUP,
  }},
  { label: "store_name", params: {
    store_name: "لينك اب",
    customer_name: "محمد",
    order_number: "263047555",
    product_name: "ChatGPT Plus",
    duration: "1 شهر",
    order_link: PICKUP,
  }},
  { label: "{{store_name}}", params: {
    "{{store_name}}": "لينك اب",
    "{{customer_name}}": "محمد",
    "{{order_number}}": "263047555",
    "{{product_name}}": "ChatGPT Plus",
    "{{duration}}": "1 شهر",
    "{{order_link}}": PICKUP,
  }},
];

for (const t of tests) {
  const r = await gql(sendQ, {
    integrationId: INTEGRATION_ID,
    templateId: "998580756440639",
    templateName: "new_order_for_c",
    language: "ar",
    recipient: TO,
    params: t.params,
  });
  const ok = r.data?.whatsappSendTemplateMessage;
  console.log(`${ok ? "✅" : "❌"}  ${t.label}: ${JSON.stringify(r).slice(0, 200)}`);
}
