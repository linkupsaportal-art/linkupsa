/**
 * Minimal Salla webhook payload shape — only the fields we currently consume.
 * Salla emits version-2 payloads by default; we keep this intentionally
 * loose because (a) Salla evolves these without breaking changes and
 * (b) the `payload` is preserved verbatim in the inbox table for reprocessing.
 */
export type SallaWebhookEnvelope = {
  event: string;
  merchant?: number;
  created_at?: string;
  data?: Record<string, unknown>;
};

/** app.store.authorize → arrives once per install with OAuth tokens. */
export type AppStoreAuthorizeData = {
  access_token: string;
  refresh_token?: string;
  expires?: number; // seconds-from-now or unix epoch — Salla varies per docs
  expires_in?: number;
  scope?: string;
  token_type?: string;
  store?: { id?: number; name?: string };
  merchant?: { id?: number };
};
