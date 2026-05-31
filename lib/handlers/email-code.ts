import "server-only";
import { ImapFlow } from "imapflow";
import { env } from "@/lib/env";

/**
 * Email-code account handler.
 *
 * For products delivered as "an account whose login code arrives by email"
 * (Netflix, Disney+, etc.), the customer needs the latest verification code
 * sent to the account's inbox. This connects to that inbox over IMAP, reads
 * the newest matching message, and extracts the code.
 *
 * Security / privacy:
 *   - IMAP credentials are stored encrypted (email_auth_config_encrypted) and
 *     only ever live in memory here. Never returned to the client.
 *   - We only read the most recent messages within a short time window and
 *     return ONLY the extracted code — never message bodies.
 *
 * Config shape (JSON, stored encrypted per account):
 *   {
 *     "host": "imap.gmail.com",
 *     "port": 993,
 *     "user": "account@gmail.com",
 *     "password": "app-password",       // Gmail App Password, NOT the login
 *     "fromFilter": "netflix.com",       // optional sender contains-match
 *     "codeRegex": "\\b(\\d{4,8})\\b",   // optional override
 *     "maxAgeMinutes": 15                  // optional, default 15
 *   }
 */

export type EmailAuthConfig = {
  host: string;
  port?: number;
  user: string;
  password: string;
  fromFilter?: string;
  codeRegex?: string;
  maxAgeMinutes?: number;
};

export type EmailCodeResult =
  | { code: string; receivedAt: string }
  | { error: string };

const DEFAULT_CODE_REGEX = /\b(\d{4,8})\b/;

/** Parse the stored JSON config; falls back to the global test mailbox. */
export function parseEmailAuthConfig(json: string | null): EmailAuthConfig | null {
  if (json) {
    try {
      const cfg = JSON.parse(json) as EmailAuthConfig;
      if (cfg.host && cfg.user && cfg.password) return cfg;
    } catch {
      /* fall through to global */
    }
  }
  // Global IMAP fallback (testing only).
  if (env.IMAP_TEST_HOST && env.IMAP_TEST_USER && env.IMAP_TEST_PASSWORD) {
    return {
      host: env.IMAP_TEST_HOST,
      port: Number(env.IMAP_TEST_PORT || 993),
      user: env.IMAP_TEST_USER,
      password: env.IMAP_TEST_PASSWORD,
    };
  }
  return null;
}

/**
 * Connects, finds the newest message (optionally from a given sender) within
 * the age window, and extracts a verification code. Returns the code or an
 * error string — never throws to the caller.
 */
export async function fetchLatestEmailCode(
  config: EmailAuthConfig,
): Promise<EmailCodeResult> {
  const maxAgeMin = config.maxAgeMinutes ?? 15;
  const since = new Date(Date.now() - maxAgeMin * 60_000);
  const codeRe = config.codeRegex ? safeRegex(config.codeRegex) : DEFAULT_CODE_REGEX;
  if (!codeRe) return { error: "نمط الكود غير صالح" };

  const client = new ImapFlow({
    host: config.host,
    port: config.port ?? 993,
    secure: true,
    auth: { user: config.user, pass: config.password },
    logger: false,
    // Keep the handshake snappy; a hung IMAP server shouldn't block pickup.
    socketTimeout: 12_000,
    greetingTimeout: 8_000,
  });

  try {
    await client.connect();
  } catch {
    return { error: "تعذّر الاتصال ببريد الحساب. تحقق من الإعدادات." };
  }

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      // Newest first: search messages since the window, then scan downward.
      const uids = await client.search({ since }, { uid: true });
      if (!uids || uids.length === 0) {
        return { error: "لا يوجد كود حديث في البريد. اطلب الكود ثم حاول." };
      }

      // Walk newest → oldest until we find a code (optionally from the filter).
      const ordered = [...uids].sort((a, b) => b - a).slice(0, 25);
      for (const uid of ordered) {
        const msg = await client.fetchOne(
          String(uid),
          { envelope: true, source: true, internalDate: true },
          { uid: true },
        );
        if (!msg) continue;

        // Sender filter
        if (config.fromFilter) {
          const from = (msg.envelope?.from ?? [])
            .map((a) => `${a.address ?? ""}`)
            .join(" ")
            .toLowerCase();
          if (!from.includes(config.fromFilter.toLowerCase())) continue;
        }

        const text = extractText(msg.source);
        const m = text.match(codeRe);
        if (m) {
          const code = m[1] ?? m[0];
          const received = msg.internalDate
            ? new Date(msg.internalDate as string | Date)
            : new Date();
          return {
            code,
            receivedAt: received.toISOString(),
          };
        }
      }
      return { error: "لم يتم العثور على كود في الرسائل الأخيرة." };
    } finally {
      lock.release();
    }
  } catch {
    return { error: "خطأ أثناء قراءة البريد. حاول مجدداً." };
  } finally {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
  }
}

/** Best-effort plaintext extraction from a raw RFC822 buffer. */
function extractText(source: Buffer | undefined): string {
  if (!source) return "";
  const raw = source.toString("utf8");
  // Strip HTML tags so digit-only codes inside markup are still matched.
  const noTags = raw.replace(/<[^>]+>/g, " ");
  // Decode the most common quoted-printable artifacts.
  return noTags.replace(/=\r?\n/g, "").replace(/=3D/g, "=");
}

function safeRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
}
