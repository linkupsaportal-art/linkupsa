import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "akgroup.api.karzoun.chat";
const INTEGRATION_ID = "33tcPsPvYFyYgtmDFRgMj";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHAiOnsibmFtZSI6InBvcnRhbGlvc2EtZGVsaXZlcnkiLCJjcmVhdGVkQXQiOiIyMDI2LTA1LTI1VDA4OjEwOjQ4LjE1N1oiLCJub0V4cGlyZSI6dHJ1ZSwiYWxsb3dBbGxQZXJtaXNzaW9uIjp0cnVlLCJfaWQiOiJMRnRXaERyY21qV2h2aTBRZ29QalkiLCJfX3YiOjB9LCJpYXQiOjE3ODAwODEwMzZ9.UPvdZAI5eNOrTWKaOzqcdjq89Hn3m7Y3fxjfaxgppPk";

const TO = "213672661102";

async function gql(query, variables) {
  const r = await fetch(`https://${HOST}/graphql`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "x-app-token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  return r.json();
}

async function main() {
  console.log("Fetching templates from Karzoun Chat...");
  
  const QUERY = `query Q($id: String!) {
    whatsappGetTemplates(integrationId: $id) {
      data {
        _id
        name
        status
        language
        category
        mapping { name }
        components
      }
    }
  }`;

  const res = await gql(QUERY, { id: INTEGRATION_ID });
  if (res.errors) {
    console.error("GraphQL Errors:", res.errors);
    process.exit(1);
  }

  const templates = res.data?.whatsappGetTemplates?.data ?? [];
  const approved = templates.filter(t => t.status === "APPROVED");
  
  console.log(`\nFound total ${templates.length} templates.`);
  console.log(`Approved templates (${approved.length}):`);
  
  for (const t of approved) {
    const body = (t.components ?? []).find(c => c.type === "BODY")?.text ?? "";
    console.log(`▸ Name: ${t.name} (id: ${t._id})`);
    console.log(`  Mapping: ${t.mapping?.map(m => m.name).join(", ") || "(none)"}`);
    console.log(`  Body: ${body}`);
  }

  console.log("\n=======================================================");
  console.log(`Sending approved templates one by one to ${TO}...`);
  console.log("=======================================================");

  const SEND_MUTATION = `
    mutation Send(
      $integrationId: String!,
      $templateId: String,
      $templateName: String!,
      $recipient: String!,
      $language: String!,
      $params: JSON
    ) {
      whatsappSendTemplateMessage(
        integrationId: $integrationId,
        templateId: $templateId,
        templateName: $templateName,
        recipient: $recipient,
        language: $language,
        params: $params
      ) { __typename }
    }
  `.trim();

  // Test values to map to common template variables
  const placeholderValues = {
    customer_name: "محمد",
    order_number: "265022012",
    product_name: "LinkedIn Premium | لينكدان بريميوم",
    pickup_url: "https://linkup.portaliosa.com/pickup",
    store_name: "LinkUp SA",
    duration: "12 شهر",
    order_link: "https://linkup.portaliosa.com/pickup"
  };

  for (const t of approved) {
    console.log(`\nPreparing to send template: ${t.name}`);
    
    // Construct params based on template mapping
    let paramsObj = {};
    
    if (t.mapping && t.mapping.length > 0) {
      // Named parameters template mapping
      t.mapping.forEach(m => {
        const val = placeholderValues[m.name] || "تطبيق لينك اب";
        // Try multiple formats to ensure compatibility (standard, prefixed, wrapped)
        paramsObj[m.name] = val;
        paramsObj[`BODY_${m.name}`] = val;
        paramsObj[`BODY_{{${m.name}}}`] = val;
        paramsObj[`{{${m.name}}}`] = val;
      });
    } else {
      // Positional parameters template (e.g. BODY_{{1}}, BODY_{{2}}, etc.)
      // Let's send a list of standard placeholder values as positional
      const list = [
        placeholderValues.customer_name,
        placeholderValues.order_number,
        placeholderValues.product_name,
        placeholderValues.pickup_url,
        placeholderValues.store_name
      ];
      list.forEach((val, idx) => {
        paramsObj[`BODY_{{${idx + 1}}}`] = val;
        paramsObj[`{{${idx + 1}}}`] = val;
        paramsObj[idx + 1] = val;
      });
    }

    console.log(`Constructed Params object for ${t.name}:`, JSON.stringify(paramsObj));

    try {
      const sendRes = await gql(SEND_MUTATION, {
        integrationId: INTEGRATION_ID,
        templateId: null,
        templateName: t.name,
        recipient: TO,
        language: t.language || "ar",
        params: paramsObj
      });

      if (sendRes.errors) {
        console.error(`❌ Template ${t.name} failed with GraphQL error:`, JSON.stringify(sendRes.errors));
      } else {
        console.log(`✅ Template ${t.name} sent successfully! Result:`, sendRes.data?.whatsappSendTemplateMessage);
      }
    } catch (err) {
      console.error(`❌ Template ${t.name} send execution failed:`, err.message);
    }
    
    // Wait a brief moment between sends to avoid rate limit or race condition
    await new Promise(r => setTimeout(r, 1000));
  }
}

main().catch(console.error);
