/**
 * Minimal Salla webhook payload shape — only the fields we currently consume.
 *
 * Verified from production payloads (May 2026):
 *   - The store/merchant id lives on the envelope as `merchant`, not in `data`.
 *   - Salla emits version-2 payloads by default; we keep the inner `data`
 *     intentionally loose because (a) Salla evolves these without breaking
 *     changes and (b) the full envelope is preserved verbatim in the inbox
 *     table for reprocessing.
 */
export type SallaWebhookEnvelope = {
  event: string;
  merchant?: number; // ← Salla's store id. Same value you'd see in dashboard.
  created_at?: string;
  data?: Record<string, unknown>;
};

/**
 * `app.store.authorize` data — fires once on install (Easy auth mode).
 *
 * Shape verified from a real install on demo store 1375098081 (May 2026):
 *   data.id           = APP id (not store)
 *   data.access_token = OAuth bearer token (ory_at_...)
 *   data.refresh_token = OAuth refresh token (ory_rt_...)
 *   data.expires      = absolute unix epoch in seconds
 *   data.scope        = space-separated scope list
 *   data.token_type   = "bearer"
 *   data.app_name / app_type / app_description
 */
export type AppStoreAuthorizeData = {
  id?: number;
  access_token: string;
  refresh_token?: string;
  expires?: number;     // absolute unix epoch (seconds)
  expires_in?: number;  // fallback: relative seconds-from-now
  scope?: string;
  token_type?: string;
  app_name?: string;
  app_type?: string;
  app_description?: string;
};
