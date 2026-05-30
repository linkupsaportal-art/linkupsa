import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "./telegram";
import { generateTotpCode } from "@/lib/handlers/totp";
import { findActiveBan } from "@/lib/db/phone-bans";

/**
 * Customer-facing Telegram pickup bot.
 *
 * Wraps the same security model as the /pickup web page in a chat:
 *   1. /start                       → idle, prompt for order#
 *   2. user types numeric order#    → look up + verify, ask for last4
 *   3. user types 4-digit code      → verify last4, deliver credentials
 *   4. /code  (after delivery)      → fresh TOTP if the product is 2FA
 *
 * Per-chat state lives in `telegram_pickup_sessions`. Failed attempts
 * are counted; after 5 the chat is locked for 30 minutes. The same
 * `phone_bans` and `auto-ban` evaluator that protects the web flow
 * applies here too — banned numbers can never receive credentials,
 * regardless of channel.
 */

const MAX_FAILED_ATTEMPTS = 5;
const SESSION_TTL_MIN = 30;

type SessionRow = {
  chat_id: string;
  user_data: Record<string, unknown> | null;
  state: "idle" | "awaiting_last4" | "verified" | "rate_limited";
  order_id: string | null;
  failed_attempts: number;
  last_action_at: string;
  expires_at: string;
};

type IncomingUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; username?: string; first_name?: string; language_code?: string };
    chat: { id: number; type: string };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; username?: string };
    message?: { chat: { id: number }; message_id: number };
    data?: string;
  };
};

export async function handleTelegramUpdate(
  update: IncomingUpdate,
  botToken: string,
): Promise<void> {
  // We only implement message + callback flows. Anything else is a no-op.
  if (update.message?.text) {
    await handleTextMessage(update, botToken);
    return;
  }
  if (update.callback_query?.data) {
    await handleCallback(update, botToken);
    return;
  }
}

/* ─── Text message handler ─────────────────────────────────────────── */

async function handleTextMessage(
  update: IncomingUpdate,
  botToken: string,
): Promise<void> {
  const msg = update.message!;
  const chatId = String(msg.chat.id);
  const text = (msg.text ?? "").trim();
  const sb = createServiceClient();

  const session = await loadOrCreateSession(sb, chatId, msg.from);
  if (sessionExpired(session)) {
    await resetSession(sb, chatId, "idle");
    session.state = "idle";
    session.failed_attempts = 0;
    session.order_id = null;
  }

  if (text === "/start" || text === "/help") {
    await reply(
      botToken,
      chatId,
      [
        "👋 <b>أهلاً بك في خدمة استلام الطلبات</b>",
        "",
        "أرسل <b>رقم الطلب</b> فقط لبدء عملية الاستلام.",
        "",
        "بعد التحقق من رقمك، تقدر تطلب أكواد التحقق الثنائية (إن وُجدت) في أي وقت بالأمر /code.",
      ].join("\n"),
    );
    await resetSession(sb, chatId, "idle");
    return;
  }

  if (text === "/cancel") {
    await resetSession(sb, chatId, "idle");
    await reply(botToken, chatId, "🔁 تم إلغاء العملية. أرسل /start لتبدأ من جديد.");
    return;
  }

  if (text === "/code") {
    await handleCodeRequest(sb, botToken, chatId, session);
    return;
  }

  if (session.state === "rate_limited") {
    await reply(
      botToken,
      chatId,
      "🛑 تم إيقاف الجلسة مؤقتاً بسبب محاولات متكررة. حاول لاحقاً أو راسل المتجر.",
    );
    return;
  }

  if (session.state === "verified" && session.order_id) {
    // Already verified — ignore arbitrary text, hint at /code.
    await reply(
      botToken,
      chatId,
      "✅ طلبك مستلم بالفعل. لطلب كود تحقق جديد، أرسل /code.",
    );
    return;
  }

  if (session.state === "idle") {
    // Awaiting an order number. Accept digits only.
    const cleanOrder = text.replace(/\D/g, "");
    if (!cleanOrder) {
      await reply(
        botToken,
        chatId,
        "🔢 أرسل <b>رقم الطلب</b> مكوّناً من أرقام فقط للبدء.",
      );
      return;
    }
    await beginOrderLookup(sb, botToken, chatId, session, cleanOrder);
    return;
  }

  if (session.state === "awaiting_last4") {
    const cleanLast4 = text.replace(/\D/g, "");
    if (!/^\d{4}$/.test(cleanLast4)) {
      await reply(
        botToken,
        chatId,
        "📱 أرسل آخر <b>4 أرقام</b> من جوالك المسجّل في الطلب — 4 أرقام بالضبط.",
      );
      return;
    }
    await verifyLast4(sb, botToken, chatId, session, cleanLast4);
    return;
  }
}

/* ─── Callback handler (inline buttons) ────────────────────────────── */

async function handleCallback(
  update: IncomingUpdate,
  botToken: string,
): Promise<void> {
  const cq = update.callback_query!;
  const chatId = cq.message?.chat?.id;
  if (!chatId) return;
  const data = (cq.data ?? "").trim();

  // Acknowledge the click immediately so the user doesn't see a spinner.
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callback_query_id: cq.id }),
  }).catch(() => {});

  if (data === "fresh_code") {
    const sb = createServiceClient();
    const session = await loadOrCreateSession(sb, String(chatId), cq.from);
    await handleCodeRequest(sb, botToken, String(chatId), session);
  }
}

/* ─── Domain logic ─────────────────────────────────────────────────── */

async function beginOrderLookup(
  sb: ReturnType<typeof createServiceClient>,
  botToken: string,
  chatId: string,
  session: SessionRow,
  orderNumber: string,
): Promise<void> {
  const orderNumberAsBigint = Number(orderNumber);
  if (!Number.isFinite(orderNumberAsBigint)) {
    await reply(botToken, chatId, "❌ رقم الطلب غير صحيح.");
    return;
  }
  const { data: order } = await sb
    .from("orders")
    .select(
      `id, salla_order_id, salla_reference_id, customer_mobile_last4,
       payment_status, fulfillment_status, account_id, archived_at`,
    )
    .or(
      `salla_reference_id.eq.${orderNumberAsBigint},salla_order_id.eq.${orderNumberAsBigint}`,
    )
    .maybeSingle();

  if (!order) {
    await bumpFailure(sb, chatId, session);
    await reply(botToken, chatId, "❌ الطلب غير موجود. تحقق من الرقم وحاول مجدداً.");
    return;
  }
  if (order.archived_at) {
    await reply(botToken, chatId, "🗂️ هذا الطلب مؤرشف. تواصل مع المتجر.");
    return;
  }
  if (order.payment_status !== "paid") {
    await reply(botToken, chatId, "⏳ الطلب لم يكتمل دفعه بعد.");
    return;
  }
  if (order.fulfillment_status !== "fulfilled" || !order.account_id) {
    await reply(botToken, chatId, "⏳ الطلب قيد المعالجة. حاول بعد قليل.");
    return;
  }

  await sb
    .from("telegram_pickup_sessions")
    .update({
      state: "awaiting_last4",
      order_id: order.id,
      last_action_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + SESSION_TTL_MIN * 60_000).toISOString(),
    })
    .eq("chat_id", chatId);

  await reply(
    botToken,
    chatId,
    [
      "✅ تم العثور على الطلب.",
      "",
      "للتحقق من هويتك، أرسل <b>آخر 4 أرقام</b> من جوالك المسجّل في الطلب.",
    ].join("\n"),
  );
}

async function verifyLast4(
  sb: ReturnType<typeof createServiceClient>,
  botToken: string,
  chatId: string,
  session: SessionRow,
  last4: string,
): Promise<void> {
  if (!session.order_id) {
    await reply(botToken, chatId, "أرسل /start لبدء عملية جديدة.");
    return;
  }

  const { data: order } = await sb
    .from("orders")
    .select(
      `id, customer_mobile, customer_mobile_last4, product_id, salla_reference_id,
       account:accounts(
         email, instructions, password_encrypted,
         card_code_encrypted, file_storage_path, totp_secret_encrypted, status
       ), product:products(name, handler_type),
       option:product_options(name)`,
    )
    .eq("id", session.order_id)
    .single();

  if (!order) {
    await reply(botToken, chatId, "حصل خطأ. أرسل /start لإعادة المحاولة.");
    return;
  }

  if (order.customer_mobile_last4 !== last4) {
    await bumpFailure(sb, chatId, session);
    await reply(
      botToken,
      chatId,
      "❌ الأرقام لا تطابق الجوال المسجّل. أعد الإرسال.",
    );
    return;
  }

  // Phone-ban gate at delivery time. Catches bans that landed AFTER the
  // order was originally allocated.
  if (order.product_id && order.customer_mobile) {
    const ban = await findActiveBan({
      mobile: order.customer_mobile,
      productId: order.product_id,
    });
    if (ban) {
      await sb
        .from("telegram_pickup_sessions")
        .update({ state: "idle", order_id: null })
        .eq("chat_id", chatId);
      await reply(
        botToken,
        chatId,
        `🚫 تم تقييد رقمك من استلام هذا المنتج.\n📌 السبب: ${ban.reason ?? "حماية"}`,
      );
      return;
    }
  }

  await deliverCredentials(sb, botToken, chatId, order);

  await sb
    .from("telegram_pickup_sessions")
    .update({
      state: "verified",
      failed_attempts: 0,
      last_action_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + SESSION_TTL_MIN * 60_000).toISOString(),
    })
    .eq("chat_id", chatId);
}

type DbOrderForDelivery = {
  id: string;
  salla_reference_id: number | null;
  account: Array<{
    email: string | null;
    instructions: string | null;
    password_encrypted: unknown;
    card_code_encrypted: unknown;
    file_storage_path: string | null;
    totp_secret_encrypted: unknown;
    status: string;
  }> | {
    email: string | null;
    instructions: string | null;
    password_encrypted: unknown;
    card_code_encrypted: unknown;
    file_storage_path: string | null;
    totp_secret_encrypted: unknown;
    status: string;
  } | null;
  product: { name: string; handler_type: string } | Array<{ name: string; handler_type: string }> | null;
  option: { name: string } | Array<{ name: string }> | null;
};

async function deliverCredentials(
  sb: ReturnType<typeof createServiceClient>,
  botToken: string,
  chatId: string,
  order: DbOrderForDelivery,
): Promise<void> {
  const product = Array.isArray(order.product) ? order.product[0] : order.product;
  const option = Array.isArray(order.option) ? order.option[0] : order.option;
  const account = Array.isArray(order.account) ? order.account[0] : order.account;
  if (!product || !account) {
    await reply(botToken, chatId, "❌ بيانات الطلب غير مكتملة. تواصل مع المتجر.");
    return;
  }

  const password = decryptBytea(account.password_encrypted);
  const cardCode = decryptBytea(account.card_code_encrypted);
  const reference = order.salla_reference_id ?? "—";

  const lines: string[] = [];
  lines.push(`🎉 <b>طلبك جاهز</b>`);
  lines.push(``);
  lines.push(`🔖 رقم الطلب: <code>${reference}</code>`);
  lines.push(`🛒 المنتج: <b>${escapeHtml(product.name)}</b>`);
  if (option?.name) lines.push(`⚙️ الباقة: ${escapeHtml(option.name)}`);
  lines.push(``);

  if (account.email) {
    lines.push(`📧 البريد: <code>${escapeHtml(account.email)}</code>`);
  }
  if (password) {
    lines.push(`🔑 كلمة المرور: <code>${escapeHtml(password)}</code>`);
  }
  if (cardCode) {
    lines.push(`💳 كود البطاقة: <code>${escapeHtml(cardCode)}</code>`);
  }
  if (account.file_storage_path) {
    lines.push(`📎 ملف رقمي: ${escapeHtml(account.file_storage_path)}`);
  }
  if (account.instructions) {
    lines.push(``);
    lines.push(`📝 ملاحظات:\n${escapeHtml(account.instructions)}`);
  }

  const isTotp = product.handler_type === "2fa_account" && !!account.totp_secret_encrypted;
  if (isTotp) {
    const totp = generateTotpFromAccount(account.totp_secret_encrypted);
    if (totp) {
      lines.push(``);
      lines.push(
        `🔐 كود التحقق الثنائي الحالي: <code>${totp.code}</code> (يتجدد خلال ${totp.expiresInSeconds} ثانية)`,
      );
    }
  }

  lines.push(``);
  lines.push(`⚠️ لا تشارك بيانات الحساب مع أحد.`);

  await sendTelegramMessage({
    text: lines.join("\n"),
    config: { botToken, chatId },
    buttons: isTotp
      ? [{ text: "🔄 طلب كود تحقق جديد", url: "" }] // placeholder removed below
      : undefined,
  });

  // sendTelegramMessage's buttons are URL-only inline keyboards. For the
  // 2FA refresh button we want a callback button, so send a follow-up
  // with raw API to get the right keyboard type.
  if (isTotp) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "🔄 احتجت كوداً جديداً؟ اضغط الزر أو أرسل /code.",
        reply_markup: {
          inline_keyboard: [[{ text: "🔄 طلب كود جديد", callback_data: "fresh_code" }]],
        },
      }),
    }).catch(() => {});
  }
}

async function handleCodeRequest(
  sb: ReturnType<typeof createServiceClient>,
  botToken: string,
  chatId: string,
  session: SessionRow,
): Promise<void> {
  if (session.state !== "verified" || !session.order_id) {
    await reply(
      botToken,
      chatId,
      "👋 يجب أن تتحقق من طلبك أولاً. أرسل رقم الطلب لبدء العملية.",
    );
    return;
  }
  const { data: order } = await sb
    .from("orders")
    .select(
      `id, otp_request_count, otp_request_limit,
       account:accounts(id, status, otp_cooldown_seconds, totp_secret_encrypted)`,
    )
    .eq("id", session.order_id)
    .single();
  if (!order) {
    await reply(botToken, chatId, "حدث خطأ. أرسل /start.");
    return;
  }
  if (order.otp_request_count >= order.otp_request_limit) {
    await reply(
      botToken,
      chatId,
      "🚫 تجاوزت الحد الأقصى لطلبات الكود لهذا الطلب. تواصل مع المتجر.",
    );
    return;
  }
  const acct = Array.isArray(order.account) ? order.account[0] : order.account;
  if (!acct?.totp_secret_encrypted) {
    await reply(botToken, chatId, "هذا المنتج لا يدعم كود تحقق ثنائي.");
    return;
  }

  const cooldown = acct.otp_cooldown_seconds ?? 30;
  const { data: recent } = await sb
    .from("otp_logs")
    .select("requested_at")
    .eq("order_id", order.id)
    .eq("result", "success")
    .order("requested_at", { ascending: false })
    .limit(1);
  if (recent?.length) {
    const elapsed = (Date.now() - new Date(recent[0].requested_at).getTime()) / 1000;
    if (elapsed < cooldown) {
      await reply(
        botToken,
        chatId,
        `⏳ انتظر ${Math.ceil(cooldown - elapsed)} ثانية قبل طلب كود جديد.`,
      );
      return;
    }
  }

  const totp = generateTotpFromAccount(acct.totp_secret_encrypted);
  if (!totp) {
    await reply(botToken, chatId, "تعذّر توليد الكود. تواصل مع المتجر.");
    return;
  }

  await sb
    .from("orders")
    .update({ otp_request_count: order.otp_request_count + 1 })
    .eq("id", order.id);
  await sb.from("otp_logs").insert({
    order_id: order.id,
    account_id: acct.id,
    result: "success",
  });

  await reply(
    botToken,
    chatId,
    [
      `🔐 الكود الجديد: <code>${totp.code}</code>`,
      `⏱️ متبقّي على انتهائه: ${totp.expiresInSeconds} ثانية`,
      `📊 طلبات متبقّية: ${order.otp_request_limit - (order.otp_request_count + 1)}`,
    ].join("\n"),
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

async function loadOrCreateSession(
  sb: ReturnType<typeof createServiceClient>,
  chatId: string,
  userData: unknown,
): Promise<SessionRow> {
  const { data } = await sb
    .from("telegram_pickup_sessions")
    .select("*")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (data) return data as SessionRow;

  const { data: created, error } = await sb
    .from("telegram_pickup_sessions")
    .insert({
      chat_id: chatId,
      user_data: userData ?? null,
      state: "idle",
    })
    .select("*")
    .single();
  if (error) throw error;
  return created as SessionRow;
}

async function resetSession(
  sb: ReturnType<typeof createServiceClient>,
  chatId: string,
  state: SessionRow["state"],
): Promise<void> {
  await sb
    .from("telegram_pickup_sessions")
    .update({
      state,
      order_id: null,
      failed_attempts: 0,
      last_action_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + SESSION_TTL_MIN * 60_000).toISOString(),
    })
    .eq("chat_id", chatId);
}

async function bumpFailure(
  sb: ReturnType<typeof createServiceClient>,
  chatId: string,
  session: SessionRow,
): Promise<void> {
  const next = session.failed_attempts + 1;
  const limited = next >= MAX_FAILED_ATTEMPTS;
  await sb
    .from("telegram_pickup_sessions")
    .update({
      failed_attempts: next,
      state: limited ? "rate_limited" : session.state,
      last_action_at: new Date().toISOString(),
    })
    .eq("chat_id", chatId);
}

function sessionExpired(s: SessionRow): boolean {
  return new Date(s.expires_at).getTime() <= Date.now();
}

function decryptBytea(raw: unknown): string | undefined {
  if (!raw) return undefined;
  const s = raw as string;
  if (s.startsWith("\\x")) return Buffer.from(s.slice(2), "hex").toString("utf8");
  try {
    return Buffer.from(s, "base64").toString("utf8");
  } catch {
    return s;
  }
}

function generateTotpFromAccount(secretRaw: unknown):
  | { code: string; expiresInSeconds: number; totalPeriod: number }
  | null {
  try {
    const decoded = decryptBytea(secretRaw);
    if (!decoded) return null;
    return generateTotpCode(decoded);
  } catch {
    return null;
  }
}

async function reply(botToken: string, chatId: string, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  }).catch(() => {});
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
