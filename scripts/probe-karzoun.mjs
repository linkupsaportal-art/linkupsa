const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHAiOnsibmFtZSI6InBvcnRhbGlvc2EtZGVsaXZlcnkiLCJjcmVhdGVkQXQiOiIyMDI2LTA1LTI1VDA4OjEwOjQ4LjE1N1oiLCJub0V4cGlyZSI6dHJ1ZSwiYWxsb3dBbGxQZXJtaXNzaW9uIjp0cnVlLCJfaWQiOiJMRnRXaERyY21qV2h2aTBRZ29QalkiLCJfX3YiOjB9LCJpYXQiOjE3ODAwODEwMzZ9.UPvdZAI5eNOrTWKaOzqcdjq89Hn3m7Y3fxjfaxgppPk";
const URL = "https://akgroup.api.karzoun.chat/graphql";

async function gql(query) {
  const r = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-app-token": TOKEN },
    body: JSON.stringify({ query }),
  });
  return await r.json();
}

const fields = ["_id text { foo } context { foo } form { foo } metadata"];
const r = await gql(`{
  conversations(page:1, perPage:1) {
    data {
      _id messages { ${fields[0]} }
    }
  }
}`);
console.log(JSON.stringify(r, null, 2).slice(0, 4500));
