# Deployment

## 1. Local setup (one-time)

1. Copy `.env.example` → `.env`:
   ```powershell
   cp .env.example .env
   ```
2. Open the Supabase dashboard → **Settings → API**:
   <https://supabase.com/dashboard/project/llnmoqzcpufrqtfgftba/settings/api>
3. Copy the **`service_role`** key (under "Project API keys") — it starts with `sb_secret_…`.
4. Paste it into `.env` for `SUPABASE_SERVICE_ROLE_KEY=…`.
5. Run:
   ```powershell
   npm install
   npm run dev
   ```

The dev server reads `.env` automatically — no `.env.local` needed.

## 2. Vercel deployment

### One-time

1. Push the repo to GitHub (the inner `web/` folder has been removed; the root is the project root).
2. Go to <https://vercel.com/new> → Import the GitHub repo.
3. Vercel auto-detects Next.js — leave build/install commands at their defaults.
4. **Add Environment Variables** (Settings → Environment Variables) for all 3 environments (Production, Preview, Development):

| Name                              | Value                                                    | Type    |
| --------------------------------- | -------------------------------------------------------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | `https://llnmoqzcpufrqtfgftba.supabase.co`               | Plain   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | `sb_publishable_dI6nYqlbUs0aDQZ6ud_jdQ_V8Gs_Atb`         | Plain   |
| `SUPABASE_SERVICE_ROLE_KEY`       | `sb_secret_…` (from dashboard, never commit)             | **Secret** |
| `RESEND_API_KEY`                  | `re_…` (rotate the one shared in chat first)             | **Secret** |
| `RESEND_FROM`                     | `LinkUp <onboarding@resend.dev>` (or your verified domain) | Plain |

5. Deploy.

### Or via Vercel CLI

```powershell
npm i -g vercel
vercel login
vercel link             # link this folder to a project
vercel env add SUPABASE_SERVICE_ROLE_KEY  # paste when prompted, choose Production+Preview+Development
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod           # production deploy
```

## 3. Resend setup

The current key works in **sandbox mode only** — you can send to your own verified email.

For production:
1. Go to <https://resend.com/domains> → add your domain (e.g. `linkup.sa`).
2. Add the DNS records Resend gives you (SPF, DKIM, DMARC).
3. Wait for verification (usually < 1 hour).
4. Update `RESEND_FROM` to use your verified domain, e.g. `LinkUp <hello@linkup.sa>`.

## 4. Supabase auth setup (already done via MCP)

The migrations applied:

- `public.profiles` — 1:1 with `auth.users`, RLS enabled, owner-only read/update
- `public.email_otps` — hashed 6-digit codes, server-only access (no client-facing policies)
- Triggers:
  - `on_auth_user_created` → auto-creates a profile on signup
  - `set_profiles_updated_at` → maintains `updated_at`

Auth flow:
1. `POST /register` → `auth.admin.createUser({ email_confirm: false })` + send 6-digit OTP via Resend
2. User enters code → `verifyEmailAction` consumes the OTP, flips `email_confirm = true`
3. User logs in → standard `signInWithPassword`
4. `proxy.ts` (Next.js middleware) refreshes the cookie on every request and gates `/dashboard/*`
