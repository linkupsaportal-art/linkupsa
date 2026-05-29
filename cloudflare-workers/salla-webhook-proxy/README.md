# salla-webhook-proxy

Edge receiver for Salla webhooks. Sits between Salla and our Next.js
fulfillment app, verifying authenticity at the edge and acking quickly so
Salla's 30s timeout never trips.

## Architecture

```
Salla  ──POST──▶  Cloudflare Worker  ──ack 200──▶ Salla
                       │
                       └──waitUntil──▶ Next.js /api/salla/webhook (Vercel)
                                            │
                                            └──INSERT──▶ webhook_events
```

## Local dev

```cmd
cd cloudflare-workers/salla-webhook-proxy
npm install
echo SALLA_WEBHOOK_TOKEN=<your token> > .dev.vars
npm run dev
```

Worker now serves on `http://localhost:8787`. Forward target is the
production origin by default; override per-run:

```cmd
ORIGIN_URL=http://localhost:3000/api/salla/webhook npm run dev
```

## Deploy

First time only:

```cmd
npx wrangler secret put SALLA_WEBHOOK_TOKEN
# paste 9ab2fd0f...09ea when prompted
```

Then for every release:

```cmd
npm run deploy
```

The deployed worker URL prints to stdout. Wire it into Salla as the
webhook URL once you're ready to switch.

## Tail logs

```cmd
npm run tail
```
