# 🏛️ Architecture — Digital Product Delivery Platform

> Authoritative architectural reference. Every implementation decision must align with this document. If reality drifts, this file is updated **before** the code.

---

## 1. North Star

> **منصة تسليم منتجات رقمية تلقائية، مرتبطة بـ Salla، صفر VPS، صفر صيانة سيرفر، ملكية كاملة للعميل.**

Three guiding principles:

1. **Serverless / Edge-first** — لا نملك سيرفر، لا ندير nginx، لا ندفع مقابل وقت معطل
2. **Atomic & Idempotent** — كل webhook، كل توزيع حساب، كل إشعار يقدر يتكرر بأمان
3. **Portable** — لو بكرة العميل قرر يخرج من Supabase، الـ schema + الـ migrations + الـ code كلها معه

---

## 2. The Stack — Decisions & Rationale

### 2.1 Why this stack (vs the original `VPS + Nginx + PM2`)

| Concern | Original Plan (VPS) | Adopted Plan (Serverless) | Winner |
|---|---|---|---|
| Cold start | None | ~10ms on CF Workers, ~500ms on Vercel Functions (mitigated) | Acceptable trade |
| Cost floor | ~$10–25/mo always-on | $0 baseline, scales with use | **Serverless** |
| Maintenance | Manual nginx, PM2, OS patches | Zero | **Serverless** |
| SSL / DDoS | Manual certbot, no DDoS | Free + automatic | **Serverless** |
| Backups | Manual cron + S3 | Supabase PITR built-in | **Serverless** |
| Scaling | Manual / vertical | Automatic / horizontal | **Serverless** |
| Lock-in risk | Low (just Linux) | Medium (Supabase APIs) — mitigated by SQL portability | Tie |

**Verdict:** Serverless wins on every operational axis that matters for a $350 project that the client must own and maintain afterwards.

### 2.2 Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│  CUSTOMER (delivery.domain.com)                                  │
│  Next.js 15 Page → Server Action → Supabase RPC                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  CLOUDFLARE EDGE                                                 │
│  ─ DNS + WAF + DDoS                                              │
│  ─ Turnstile (captcha)                                           │
│  ─ Rate Limiter (KV-backed)                                      │
│  ─ Worker: /salla/webhook  (HMAC verify → enqueue)               │
│  ─ Worker: /api/notifications/dispatch  (consumer)               │
│  ─ Cloudflare Queues (notification fan-out)                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  VERCEL (Next.js)                                                │
│  ─ /          customer interface                                 │
│  ─ /admin     admin dashboard (RBAC, 2FA forced)                 │
│  ─ /code-limit  scoped panel (only raise code request limits)    │
│  ─ Server Actions → Supabase RPC (RLS-enforced)                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  SUPABASE                                                        │
│  ─ Postgres 15 (RLS, pgsodium, pg_cron)                          │
│  ─ Edge Functions (Deno):                                        │
│       • assign-account  (Round Robin atomic)                     │
│       • generate-totp   (returns TOTP from encrypted secret)     │
│       • generate-steam-guard                                     │
│       • generate-email-code                                      │
│       • salla-fetch-order                                        │
│  ─ pg_cron jobs:                                                 │
│       • archive-old-orders          @ 03:00 UTC daily            │
│       • cleanup-otp-logs            @ 03:30 UTC daily            │
│       • notification-retry-sweep    every 5 minutes              │
│  ─ Storage: digital-files bucket (signed URLs ≤ 5min)            │
│  ─ Auth: admin + code-limit users                                │
└─────────────────────────────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌────────────────┐           ┌─────────────────────┐
│  RESEND        │           │  SALLA API          │
│  email         │           │  OAuth2 + Webhooks  │
└────────────────┘           └─────────────────────┘
        │
        ▼ (other notification channels)
┌────────────────────────────────────────────┐
│  Meta WhatsApp Cloud API                    │
│  Local SMS Provider (Unifonic/Mobily)       │
│  Telegram Bot API                           │
└────────────────────────────────────────────┘
```

### 2.3 Why Cloudflare Workers receive Salla webhooks (not Vercel)

- Cold start ~10ms vs Vercel Functions ~500ms
- Salla retries aggressively — fast 200 response prevents duplicate retries
- HMAC verification + idempotency check happen at the edge before any DB write
- Cheaper at scale (CF Workers free tier: 100k req/day)

### 2.4 Why custom queue (not Bull/SQS/etc)

- The brief explicitly calls for **owned, portable** infrastructure
- Postgres + `FOR UPDATE SKIP LOCKED` is a battle-tested pattern
- Cloudflare Queues for fan-out (notifications) — managed, free up to threshold, no infra
- Avoids Redis/BullMQ which would force a paid Redis service or VPS

---

## 3. Database Schema (Initial Sketch)

> Refined during implementation. Migrations live in `/supabase/migrations/`.

```sql
-- Core entities
products              (id, name, type, image_url, status, handler_type, ...)
product_options       (id, product_id, label, value)         -- "شهر", "سنة"
accounts              (id, product_id, label, email, password_enc, instructions,
                       verification_type, totp_secret_enc, steam_shared_secret_enc,
                       verification_url, status, max_uses, current_uses,
                       max_code_requests, cooldown_seconds, last_used_at, created_at)
account_options       (account_id, option_id)                -- which options each account serves

-- Orders
orders                (id, salla_order_id UNIQUE, salla_event_id UNIQUE,
                       phone_last4, customer_email, customer_phone,
                       product_id, option_id, account_id, status,
                       payment_status, code_requests_used, code_requests_limit,
                       created_at, updated_at)

-- OTP / code requests
otp_logs              (id, order_id, account_id, code_type, ip, created_at)

-- Bans
phone_product_bans    (phone, product_id, reason, active)

-- Audit
audit_logs            (id, actor_id, action, target_type, target_id, ip, ua, payload, at)

-- Notifications
notification_jobs     (id, channel, payload, status, attempts, next_retry_at, created_at)

-- Archives (separate to keep main tables hot)
archived_orders       (mirrors orders, status='archived')
archived_otp_logs     (mirrors otp_logs, retention 90d)
```

### Key Constraints

- `orders.account_id` once set is **immutable** (enforced via trigger) — except by explicit admin action via `admin_change_account()` RPC which logs to `audit_logs`
- `orders.salla_event_id` UNIQUE — webhook idempotency
- Encrypted columns use `pgsodium.create_key()` → encrypted with column-level keys
- All tables have RLS enabled, default policy is DENY

---

## 4. Key Flows

### 4.1 Salla Webhook → Order Creation

```
Salla → POST https://delivery.domain.com/salla/webhook
      → Cloudflare Worker
        ├─ Verify X-Salla-Signature (HMAC-SHA256)
        ├─ Check idempotency (event_id in CF KV, 24h TTL)
        ├─ Enqueue to Supabase via Edge Function
        └─ Return 200 immediately (always, even on dedup)
      → Supabase Edge Function `process-salla-event`
        ├─ Insert into orders (ON CONFLICT salla_event_id DO NOTHING)
        ├─ Verify payment_status IN ('paid', 'completed')
        ├─ Verify phone NOT banned for product
        ├─ Call assign_account_atomic(product_id, option_value)
        ├─ Update orders.account_id
        └─ Enqueue notification_job(s) per product channels
```

### 4.2 Round Robin (Atomic)

```sql
-- assign_account_atomic() — runs inside transaction
WITH eligible AS (
  SELECT a.id
  FROM accounts a
  JOIN account_options ao ON ao.account_id = a.id
  WHERE a.product_id = $1
    AND ao.option_id = $2
    AND a.status = 'active'
    AND a.current_uses < a.max_uses
  ORDER BY a.last_used_at NULLS FIRST, a.id
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)
UPDATE accounts
SET current_uses = current_uses + 1,
    last_used_at = now()
WHERE id = (SELECT id FROM eligible)
RETURNING id;
```

`SKIP LOCKED` ensures parallel workers never grab the same account.

### 4.3 Customer Retrieval

```
Customer → POST /api/lookup { order_no, phone_last4 }
        → Server Action
          ├─ Turnstile verify
          ├─ Rate limit (5 attempts / 10 min / IP)
          ├─ SELECT from orders WHERE salla_order_id=? AND phone_last4=?
          ├─ If not found → call salla-fetch-order Edge Function (fallback)
          ├─ Issue short-lived signed JWT (15 min) → returned in HttpOnly cookie
          └─ Redirect to /order/[token]
```

### 4.4 TOTP / Steam Guard / Email Code Generation

- **Never** expose the secret to the client
- Customer clicks "Get Code"
  → Server Action calls `generate-totp` Edge Function
  → Edge Function decrypts secret via pgsodium
  → Computes RFC 6238 TOTP server-side
  → Returns only the 6-digit code
  → Logs to `otp_logs`, increments `code_requests_used`
  → Enforces cooldown + max_code_requests per order

### 4.5 Code-Limit Panel (Restricted)

- Separate Supabase Auth user role: `code_limit_operator`
- RLS policies allow:
  - `SELECT (id, salla_order_id, code_requests_used, code_requests_limit)` from orders
  - `UPDATE code_requests_limit` only — via stored procedure that audit-logs
- Cannot read passwords, secrets, accounts table at all
- 2FA enforced at login

---

## 5. Security Layers

1. **Cloudflare WAF** — generic OWASP rules + custom rules for `/admin`
2. **Turnstile** — on customer lookup form + admin login
3. **Rate Limiting** — CF Workers + KV (per-IP, per-order-no, per-phone)
4. **Webhook HMAC** — Salla signature verification
5. **RLS** — database-level access control, default DENY
6. **pgsodium encryption** — at-rest for sensitive columns
7. **Signed URLs** — Storage access ≤5 min TTL
8. **Audit logging** — every privileged mutation
9. **Admin 2FA** — TOTP enforced
10. **HTTPS/HSTS** — automatic via Vercel + CF

---

## 6. Open Decisions (ADR Stubs)

| ID | Decision Pending | Owner | Status |
|---|---|---|---|
| ADR-001 | WhatsApp BSP: Meta Cloud API direct vs Wati/UltraMsg | Client | ❓ |
| ADR-002 | SMS Provider: Unifonic vs Mobily vs Twilio | Client | ❓ |
| ADR-003 | Domain: subdomain of متجر vs new domain | Client | ❓ |
| ADR-004 | Salla App: existing Partner account or register new | Client | ❓ |
| ADR-005 | External backup mirror beyond Supabase PITR (S3?) | Razex | 💭 |
| ADR-006 | Sentry vs Supabase logs only for error tracking | Razex | 💭 |

---

## 7. Out of Scope (Phase 2 candidates)

- Mobile app
- Customer self-service refunds
- Multi-tenant (multiple stores on one platform)
- Advanced analytics dashboard with charts beyond basic counters

---

*Authored by Razex Xelite. Reviewed by: client (pending).*
