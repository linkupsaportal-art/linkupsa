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

  // Let's test two template names: order_ready_v1 and linkedforlinked
  const templatesToTest = ["order_ready_v1", "linkedforlinked"];
  
  for (const name of templatesToTest) {
    console.log(`\nTesting template: ${name} (with templateId = null)`);
    
    // We send positional params
    const params = {
      "BODY_{{1}}": "LinkUp",
      "BODY_{{2}}": "Mohammad",
      "BODY_{{3}}": "265022012",
      "BODY_{{4}}": "LinkedIn Premium",
      "BODY_{{5}}": "https://linkup.sa/pickup"
    };

    const res = await gql(SEND_MUTATION, {
      integrationId: INTEGRATION_ID,
      templateId: null,
      templateName: name,
      recipient: TO,
      language: "ar",
      params: params
    });

    console.log("Result:", JSON.stringify(res));
  }
}

main().catch(console.error);
