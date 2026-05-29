import "server-only";

/**
 * Karzoun WhatsApp client — official Cloud API mode.
 *
 * Karzoun resells Meta's WhatsApp Cloud API behind a thin proxy at
 *   POST https://api.karzoun.app/CloudApi.php
 * Documented at: https://share.apidog.com/44d7bdb0-78dd-4961-aa24-9eb93cac2c86
 *
 * Auth model: query-string params (NOT JSON body), no headers.
 *   - token        → Meta system-user access token (from Karzoun dashboard
 *                    → "How to add system user and generate Access Tokens")
 *   - sender_id    → Meta phone_number_id (numeric, NOT a UUID)
 *   - phone        → recipient in E.164 without `+` (e.g. 213672661102)
 *   - template     → pre-approved Meta template name
 *   - param_1..N   → template variables, in order
 *   - url_button   → optional dynamic value for a URL-button placeholder
 *
 * Why templates and not free text?
 *   Meta's Cloud API blocks business-initiated free-form messages outside
 *   the 24h customer service window. A template is the only reliable way
 *   to deliver an order-ready notification to a fresh recipient.
 *
 * Karzoun returns the raw Meta Graph API response on success, or an error
 * envelope (e.g. `{error:{message:"...",type:"OAuthException"}}`) on failure.
 */

const ENDPOINT = "https://api.karzoun.app/CloudApi.php";

export type KarzounCloudConfig = {
  /** Meta system-user access_token (long-lived, starts with "EAA..."). */
  accessToken: string;
  /** Meta phone_number_id — 15-digit numeric string, NOT a UUID. */
  phoneNumberId: string;
  /** Default pre-approved template name (e.g. "order_ready"). */
  defaultTemplate: string;
};

export type KarzounSendArgs = {
  /** Recipient in E.164 without `+`, e.g. "213672661102". */
  to: string;
  /** Template parameters in order (param_1, param_2, ...). */
  params: string[];
  /** Optional URL-button dynamic value (rendered into a Meta URL button). */
  urlButton?: string;
  /** Override the default template for this send. */
  template?: string;
  config: KarzounCloudConfig;
};

export type KarzounSendResult =
  | { ok: true; messageId?: string; raw: unknown }
  | { ok: false; error: string; status?: number; raw?: unknown };

export async function sendKarzounWhatsApp(args: KarzounSendArgs): Promise<KarzounSendResult> {
  const { to, params, urlButton, template, config } = args;

  const cleanTo = to.replace(/[\s+\-()]/g, "");
  const tpl = template ?? config.defaultTemplate;

  if (!config.accessToken || !config.phoneNumberId || !tpl) {
    return { ok: false, error: "Karzoun config incomplete (accessToken / phoneNumberId / template)" };
  }

  const qs = new URLSearchParams({
    token: config.accessToken,
    sender_id: config.phoneNumberId,
    phone: cleanTo,
    template: tpl,
  });
  params.forEach((value, idx) => qs.set(`param_${idx + 1}`, value));
  if (urlButton) qs.set("url_button", urlButton);

  try {
    const r = await fetch(`${ENDPOINT}?${qs.toString()}`, {
      method: "POST",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });

    const raw = await safeJson(r);

    // Meta Graph errors come back as `{error:{message,type,code}}` even with HTTP 200,
    // because Karzoun proxies the response verbatim. Treat any `error` field as failure.
    const errorEnvelope = (raw as { error?: { message?: string } } | null)?.error;
    if (errorEnvelope?.message) {
      return { ok: false, status: r.status, error: errorEnvelope.message, raw };
    }

    if (!r.ok) {
      return { ok: false, status: r.status, error: extractError(raw) ?? `HTTP ${r.status}`, raw };
    }

    const messageId =
      (raw as { messages?: Array<{ id?: string }> })?.messages?.[0]?.id ?? undefined;

    return { ok: true, messageId, raw };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "network error" };
  }
}

async function safeJson(r: Response): Promise<unknown> {
  const text = await r.text();
  try { return JSON.parse(text); } catch { return text; }
}

function extractError(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "string") return raw.slice(0, 300);
  if (typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if (typeof o.message === "string") return o.message;
  if (typeof o.error === "string") return o.error;
  if (typeof o.msg === "string") return o.msg;
  return undefined;
}
