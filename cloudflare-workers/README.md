# Cloudflare Workers

Edge-deployed services that sit in front of (or alongside) the main Next.js
application. Each subfolder is a self-contained worker with its own
`wrangler.toml`, `package.json`, and source code.

## Why workers?

The spec mandates Cloudflare Workers for "Webhooks, Rate Limiting, Bot
Protection على edge". The main Next.js app on Vercel handles the heavy
lifting (admin UI, auth, fulfillment), but specific edge concerns belong
here:

| Worker | Path | Purpose |
| ------ | ---- | ------- |
| `salla-webhook-proxy` | [./salla-webhook-proxy](./salla-webhook-proxy/) | Receives Salla webhooks at the edge, verifies the auth token in <10ms, then either (a) acks immediately and forwards async to the Next.js inbox or (b) rate-limits abusive replays before they reach origin. |

## Common conventions

- Each worker has its own `wrangler.toml`.
- Secrets live in Cloudflare (`wrangler secret put NAME`), never in the repo.
- Local dev: `cd cloudflare-workers/<worker>` then `npm run dev`.
- Deploy: `cd cloudflare-workers/<worker>` then `npm run deploy`.

## Account

- Cloudflare account: `linkupsaportal@gmail.com`
- Account ID: `71a18d409d70ada0d143072afa97176d`
- Domain: `portaliosa.com`
