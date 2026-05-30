import "server-only";

/**
 * Telegram Bot API client.
 *
 * Uses the public `https://api.telegram.org/bot<token>/sendMessage`
 * endpoint. Bot tokens are obtained from BotFather and stored on the
 * `notification_channels` row for the WhatsApp-equivalent channel
 * `telegram`. We deliberately keep this client tiny: no SDK, no extra
 * deps, plain fetch with a short timeout and clean error semantics.
 */

export type TelegramConfig = {
  botToken: string;
  chatId: string;
  parseMode?: "HTML" | "MarkdownV2" | "Markdown";
  /** Optional override; defaults to the public Bot API host. */
  apiBase?: string;
};

export type TelegramSendResult =
  | { ok: true; raw: unknown }
  | { ok: false; error: string; status?: number; raw?: unknown };

export async function sendTelegramMessage(args: {
  text: string;
  config: TelegramConfig;
  /** Disable web-page preview for cleaner cards. Default true. */
  disablePreview?: boolean;
  /** Inline keyboard buttons appended under the message. */
  buttons?: Array<{ text: string; url: string }>;
}): Promise<TelegramSendResult> {
  const { text, config } = args;
  const { botToken, chatId, parseMode = "HTML", apiBase } = config;

  if (!botToken || !chatId) {
    return { ok: false, error: "Telegram config incomplete (botToken / chatId)" };
  }

  const base = apiBase ?? "https://api.telegram.org";
  const url = `${base}/bot${botToken}/sendMessage`;

  const reply_markup = args.buttons?.length
    ? { inline_keyboard: [args.buttons.map((b) => ({ text: b.text, url: b.url }))] }
    : undefined;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: args.disablePreview ?? true,
        ...(reply_markup ? { reply_markup } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const raw = await safeJson(r);
    if (!r.ok || (raw as { ok?: boolean })?.ok === false) {
      return {
        ok: false,
        status: r.status,
        error:
          (raw as { description?: string })?.description ??
          `HTTP ${r.status}`,
        raw,
      };
    }
    return { ok: true, raw };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "network error" };
  }
}

/**
 * Verifies a bot token by calling `/getMe`. Used by the admin "test
 * connection" button before saving the channel config.
 */
export async function verifyTelegramBot(opts: {
  botToken: string;
  apiBase?: string;
}): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const base = opts.apiBase ?? "https://api.telegram.org";
  try {
    const r = await fetch(`${base}/bot${opts.botToken}/getMe`, {
      method: "GET",
      signal: AbortSignal.timeout(8_000),
    });
    const json = (await r.json().catch(() => null)) as
      | { ok: boolean; result?: { username?: string }; description?: string }
      | null;
    if (!json?.ok) {
      return { ok: false, error: json?.description ?? `HTTP ${r.status}` };
    }
    return { ok: true, username: json.result?.username ?? "unknown" };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "network error" };
  }
}

async function safeJson(r: Response): Promise<unknown> {
  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
