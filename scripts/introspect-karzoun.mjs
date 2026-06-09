const HOST = "akgroup.api.karzoun.chat";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHAiOnsibmFtZSI6InBvcnRhbGlvc2EtZGVsaXZlcnkiLCJjcmVhdGVkQXQiOiIyMDI2LTA1LTI1VDA4OjEwOjQ4LjE1N1oiLCJub0V4cGlyZSI6dHJ1ZSwiYWxsb3dBbGxQZXJtaXNzaW9uIjp0cnVlLCJfaWQiOiJMRnRXaERyY21qV2h2aTBRZ29QalkiLCJfX3YiOjB9LCJpYXQiOjE3ODAwODEwMzZ9.UPvdZAI5eNOrTWKaOzqcdjq89Hn3m7Y3fxjfaxgppPk";

async function main() {
  const query = `
    query Introspect {
      __schema {
        types {
          name
          kind
        }
      }
    }
  `;

  console.log("Introspecting __schema on Karzoun Chat...");
  const r = await fetch(`https://${HOST}/graphql`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-app-token": TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  const res = await r.json();
  console.log("Response:", JSON.stringify(res, null, 2));
}

main().catch(console.error);
