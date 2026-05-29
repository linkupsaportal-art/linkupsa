import "server-only";

/**
 * Karzoun Chat WhatsApp client (GraphQL API).
 *
 * Karzoun runs the merchant's Meta WhatsApp Cloud API number on their
 * tenant — we call their per-tenant GraphQL endpoint with an app token.
 *
 * Tenant URL: `https://<workspace>.api.karzoun.chat/graphql`
 *   (e.g. `akgroup` → `https://akgroup.api.karzoun.chat/graphql`)
 *
 * Auth: `x-app-token` header, value is a JWT created in
 *   Karzoun Chat → المطور → التطبيقات ورموز API → Create App
 *
 * Mutation we use:
 *   whatsappSendTemplateMessage(
 *     integrationId: ID,        # the WhatsApp inbox/integration id
 *     templateName:  String,    # pre-approved Meta template name
 *     recipient:     String,    # E.164 without `+`
 *     language:      String,    # template language code (e.g. "ar")
 *     params:        JSON,      # array of strings, positional, body-only
 *   ) { __typename }
 *
 * IMPORTANT — template constraints:
 *   Karzoun's send mutation passes `params` to Meta as **positional body
 *   parameters**. It does NOT support Meta's named-parameter syntax
 *   ({{store_name}}). Templates authored that way return Meta error
 *   #132000 "Number of parameters does not match". Use templates with
 *   numeric placeholders ({{1}}, {{2}}, ...) or with simple Arabic word
 *   placeholders that Meta resolves positionally.
 */

const DEFAULT_HOST = "akgroup.api.karzoun.chat";

export type KarzounChatConfig = {
  /** Tenant API host. Optional; defaults to `akgroup.api.karzoun.chat`. */
  host?: string;
  /** App JWT — Karzoun Chat → Developer → API Tokens → Create App. */
  appToken: string;
  /** Karzoun integration id of the WhatsApp inbox to send through. */
  integrationId: string;
  /** Pre-approved template name. */
  defaultTemplate: string;
  /** Optional: Meta template_id. Karzoun resolves it from name; passing it
   *  in is purely a hint that mirrors what the Karzoun UI does. */
  templateId?: string;
  /** Template language code (default `ar`). */
  language?: string;
};

export type KarzounSendArgs = {
  /** Recipient in E.164 without `+`, e.g. "213672661102". */
  to: string;
  /** Positional template parameters (body only). */
  params: string[];
  /** Override the default template for this send. */
  template?: string;
  config: KarzounChatConfig;
};

export type KarzounSendResult =
  | { ok: true; raw: unknown }
  | { ok: false; error: string; status?: number; raw?: unknown };

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
}`.trim();

export async function sendKarzounWhatsApp(args: KarzounSendArgs): Promise<KarzounSendResult> {
  const { to, params, template, config } = args;
  const cleanTo = to.replace(/[\s+\-()]/g, "");
  const tpl = template ?? config.defaultTemplate;
  const host = config.host ?? DEFAULT_HOST;
  const lang = config.language ?? "ar";

  if (!config.appToken || !config.integrationId || !tpl) {
    return { ok: false, error: "Karzoun config incomplete (appToken / integrationId / template)" };
  }

  // Karzoun's `whatsappSendTemplateMessage` mutation expects `params` as a
  // JSON object keyed by `BODY_{{N}}` where N is the placeholder position
  // for templates with `parameter_format: POSITIONAL`. The keys MUST include
  // the literal `{{` and `}}` characters. Discovered by inspecting the
  // `mapping[].name` field returned by `whatsappGetTemplates` and by reverse
  // engineering the SendTemplateDrawer chunk in the Karzoun frontend bundle.
  const keyedParams = params.reduce<Record<string, string>>((acc, value, idx) => {
    acc[`BODY_{{${idx + 1}}}`] = value;
    return acc;
  }, {});

  const variables = {
    integrationId: config.integrationId,
    templateId: config.templateId ?? null,
    templateName: tpl,
    recipient: cleanTo,
    language: lang,
    params: keyedParams,
  };

  try {
    const r = await fetch(`https://${host}/graphql`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "x-app-token": config.appToken,
      },
      body: JSON.stringify({ query: SEND_MUTATION, variables }),
      signal: AbortSignal.timeout(15_000),
    });

    const raw = await safeJson(r);

    // GraphQL errors come back with HTTP 200 and an `errors` array.
    const errors = (raw as { errors?: Array<{ message?: string }> })?.errors;
    if (errors && errors.length > 0) {
      return {
        ok: false,
        status: r.status,
        error: errors.map((e) => e.message ?? "unknown").join("; "),
        raw,
      };
    }

    if (!r.ok) {
      return { ok: false, status: r.status, error: `HTTP ${r.status}`, raw };
    }

    return { ok: true, raw };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "network error" };
  }
}

async function safeJson(r: Response): Promise<unknown> {
  const text = await r.text();
  try { return JSON.parse(text); } catch { return text; }
}
