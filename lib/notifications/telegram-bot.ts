import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { generateTotpCode } from "@/lib/handlers/totp";
import { findActiveBan } from "@/lib/db/phone-bans";

/**
 * Customer-facing Telegram pickup bot — editable-card UX.
 *
 * Instead of dumping a chain of messages (which clutters the chat with
 * timestamps and reply chains), the bot keeps a single "card" message
 * that it edits through every step. Buttons trigger ForceReply prompts
 * for input; after capture we delete both the prompt and the user's
 * reply so the chat stays focused on the card.
 *
 * State machine:
 *   idle → awaiting_order → awaiting_last4 → verified → /code on demand
 */

const MAX_FAILED_ATTEMPTS = 5;
const SESSION_TTL_MIN = 30;

type SessionRow = {
  chat_id: string;
  user_data: Record<string, unknown> | null;
  state: "idle" | "awaiting_last4" | "verified" | "rate_limited";
  awaiting: "order" | "last4" | null;
  order_id: string | null;
  failed_attempts: number;
  main_message_id: number | null;
  last_prompt_message_id: number | null;
  last_action_at: string;
  expires_at: string;
};

type IncomingUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; username?: string; first_name?: string };
    chat: { id: number; type: string };
    date: number;
    text?: string;
    reply_to_message?: { message_id: number };
  };
  callback_query?: {
    id: string;
    from: { id: number; username?: string; first_name?: string };
    message?: { chat: { id: number }; message_id: number };
    data?: string;
  };
};

export async function handleTelegramUpdate(
  update: IncomingUpdate,
  botToken: string,
): Promise<void> {
  if (update.message?.text) {
    await handleTextMessage(update, botToken);
    return;
  }
  if (update.callback_query?.data) {
    await handleCallback(update, botToken);
    return;
  }
}

/* ─── Text handler ─────────────────────────────────────────────────── */

async function handleTextMessage(
  update: IncomingUpdate,
  botToken: string,
): Promise<void> {
  const msg = update.message!;
  const chatId = String(msg.chat.id);
  const text = (msg.text ?? "").trim();
  const sb = createServiceClient();

  let session = await loadOrCreateSession(sb, chatId, msg.from);
  if (sessionExpired(session)) {
    session = await resetSession(sb, chatId, "idle");
  }

  // Commands always reset and re-render the welcome card.
  if (text === "/start" || text === "/help") {
    session = await resetSession(sb, chatId, "idle");
    await renderWelcomeCard(botToken, chatId, session, sb, msg.from?.first_name);
    return;
  }
  if (text === "/cancel") {
    session = await resetSession(sb, chatId, "idle");
    await renderWelcomeCard(botToken, chatId, session, sb, msg.from?.first_name);
    return;
  }
  if (text === "/code") {
    await handleCodeRequest(sb, botToken, chatId, session);
    return;
  }

  if (session.state === "rate_limited") {
    await sendEphemeral(
      botToken,
      chatId,
      "🛑 الجلسة موقوفة مؤقتاً بسبب محاولات متكررة. حاول لاحقاً أو راسل المتجر.",
    );
    return;
  }

  // Free text outside an awaiting prompt → re-render welcome.
  if (!session.awaiting) {
    await renderWelcomeCard(botToken, chatId, session, sb, msg.from?.first_name);
    return;
  }

  // Captured input — delete user's message + the prompt to keep chat clean.
  await deleteMessage(botToken, chatId, msg.message_id);
  if (session.last_prompt_message_id) {
    await deleteMessage(botToken, chatId, session.last_prompt_message_id);
  }

  if (session.awaiting === "order") {
    await handleOrderInput(sb, botToken, chatId, session, text);
    return;
  }
  if (session.awaiting === "last4") {
    await handleLast4Input(sb, botToken, chatId, session, text);
    return;
  }
}

/* ─── Callback handler (button taps) ───────────────────────────────── */

async function handleCallback(
  update: IncomingUpdate,
  botToken: string,
): Promise<void> {
  const cq = update.callback_query!;
  const chatId = cq.message?.chat?.id;
  if (!chatId) return;
  const data = (cq.data ?? "").trim();
  const sb = createServiceClient();
  const cid = String(chatId);

  // Acknowledge fast.
  await ackCallback(botToken, cq.id);

  let session = await loadOrCreateSession(sb, cid, cq.from);
  if (sessionExpired(session)) {
    session = await resetSession(sb, cid, "idle");
  }

  switch (data) {
    case "enter_order":
      await openPrompt(sb, botToken, cid, session, "order");
      return;
    case "enter_last4":
      if (!session.order_id) {
        // Order missing — bounce back to welcome.
        session = await resetSession(sb, cid, "idle");
        await renderWelcomeCard(botToken, cid, session, sb, cq.from.first_name);
        return;
      }
      await openPrompt(sb, botToken, cid, session, "last4");
      return;
    case "fresh_code":
      await handleCodeRequest(sb, botToken, cid, session);
      return;
    case "restart":
      session = await resetSession(sb, cid, "idle");
      await renderWelcomeCard(botToken, cid, session, sb, cq.from.first_name);
      return;
  }
}

/* ─── Card renderers ───────────────────────────────────────────────── */

async function renderWelcomeCard(
  botToken: string,
  chatId: string,
  session: SessionRow,
  sb: ReturnType<typeof createServiceClient>,
  firstName?: string,
): Promise<void> {
  const greeting = firstName ? `أهلاً <b>${escapeHtml(firstName)}</b>` : "أهلاً بك";
  const text = [
    "🎯 <b>بوابة الاستلام الذكية</b>",
    "━━━━━━━━━━━━━━━",
    "",
    `${greeting}،`,
    "",
    "استلم بياناتك في خطوتين فقط:",
    "",
    "①  أدخل <b>رقم طلبك</b>",
    "②  أكّد آخر <b>4 أرقام</b> من جوالك المسجّل",
    "",
    "🔒 جميع المحادثات مشفّرة ومحمية بسياسة الحظر التلقائي.",
  ].join("\n");

  const keyboard = [
    [{ text: "🔢 إدخال رقم الطلب", callback_data: "enter_order" }],
    [{ text: "🔄 إعادة من البداية", callback_data: "restart" }],
  ];

  await ensureCard(sb, botToken, chatId, session, text, keyboard);
}

async function renderOrderFoundCard(
  botToken: string,
  chatId: string,
  session: SessionRow,
  sb: ReturnType<typeof createServiceClient>,
  refId: string | number,
  productName: string,
): Promise<void> {
  const text = [
    "✅ <b>تم العثور على طلبك</b>",
    "━━━━━━━━━━━━━━━",
    "",
    `🔖 رقم الطلب: <code>${escapeHtml(String(refId))}</code>`,
    `🛒 المنتج: ${escapeHtml(productName)}`,
    "",
    "للتحقق من هويتك، أدخل الآن آخر <b>4 أرقام</b> من جوالك المسجّل في الطلب.",
  ].join("\n");
  const keyboard = [
    [{ text: "📱 إدخال آخر 4 أرقام", callback_data: "enter_last4" }],
    [{ text: "🔁 طلب مختلف", callback_data: "restart" }],
  ];
  await ensureCard(sb, botToken, chatId, session, text, keyboard);
}

async function renderCredentialsCard(
  botToken: string,
  chatId: string,
  session: SessionRow,
  sb: ReturnType<typeof createServiceClient>,
  payload: {
    refId: string | number;
    productName: string;
    optionName?: string | null;
    email?: string | null;
    password?: string | null;
    cardCode?: string | null;
    fileUrl?: string | null;
    instructions?: string | null;
    totp?: { code: string; expiresInSeconds: number } | null;
  },
): Promise<void> {
  const lines: string[] = [
    "🎉 <b>طلبك جاهز للاستخدام</b>",
    "━━━━━━━━━━━━━━━",
    "",
    `🔖 رقم الطلب: <code>${escapeHtml(String(payload.refId))}</code>`,
    `🛒 المنتج: <b>${escapeHtml(payload.productName)}</b>`,
  ];
  if (payload.optionName) {
    lines.push(`⚙️ الباقة: ${escapeHtml(payload.optionName)}`);
  }
  lines.push("");
  lines.push("🔐 <b>بيانات الدخول</b>");
  if (payload.email) {
    lines.push(`📧 <code>${escapeHtml(payload.email)}</code>`);
  }
  if (payload.password) {
    lines.push(`🔑 <code>${escapeHtml(payload.password)}</code>`);
  }
  if (payload.cardCode) {
    lines.push(`💳 <code>${escapeHtml(payload.cardCode)}</code>`);
  }
  if (payload.fileUrl) {
    lines.push(`📎 ${escapeHtml(payload.fileUrl)}`);
  }
  if (payload.totp) {
    lines.push("");
    lines.push("⚡ <b>كود التحقق الثنائي</b>");
    lines.push(
      `   <code>${payload.totp.code}</code>  •  ينتهي خلال ${payload.totp.expiresInSeconds}ث`,
    );
  }
  if (payload.instructions) {
    lines.push("");
    lines.push("📝 <i>" + escapeHtml(payload.instructions) + "</i>");
  }
  lines.push("");
  lines.push("⚠️ <i>لا تشارك هذه البيانات مع أي شخص.</i>");

  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
  if (payload.totp) {
    keyboard.push([{ text: "🔄 طلب كود تحقق جديد", callback_data: "fresh_code" }]);
  }
  keyboard.push([{ text: "🔁 إعادة من البداية", callback_data: "restart" }]);

  await ensureCard(sb, botToken, chatId, session, lines.join("\n"), keyboard);
}

async function renderErrorCard(
  botToken: string,
  chatId: string,
  session: SessionRow,
  sb: ReturnType<typeof createServiceClient>,
  body: string,
): Promise<void> {
  const text = [
    "⚠️ <b>تعذّر إكمال العملية</b>",
    "━━━━━━━━━━━━━━━",
    "",
    body,
  ].join("\n");
  const keyboard = [
    [{ text: "🔁 المحاولة مجدداً", callback_data: "restart" }],
  ];
  await ensureCard(sb, botToken, chatId, session, text, keyboard);
}

/* ─── Domain logic ─────────────────────────────────────────────────── */

async function handleOrderInput(
  sb: ReturnType<typeof createServiceClient>,
  botToken: string,
  chatId: string,
  session: SessionRow,
  raw: string,
): Promise<void> {
  const orderNumber = raw.replace(/\D/g, "");
  if (!orderNumber) {
    await sendEphemeral(botToken, chatId, "🔢 أدخل رقم الطلب أرقاماً فقط.");
    await openPrompt(sb, botToken, chatId, session, "order");
    return;
  }
  const orderNumberAsBigint = Number(orderNumber);
  const { data: order } = await sb
    .from("orders")
    .select(
      `id, salla_order_id, salla_reference_id, customer_mobile_last4,
       payment_status, fulfillment_status, account_id, archived_at,
       product:products(name, handler_type)`,
    )
    .or(
      `salla_reference_id.eq.${orderNumberAsBigint},salla_order_id.eq.${orderNumberAsBigint}`,
    )
    .maybeSingle();

  if (!order) {
    await bumpFailure(sb, chatId, session);
    await renderErrorCard(
      botToken,
      chatId,
      session,
      sb,
      "❌ الطلب غير موجود. تأكد من الرقم وحاول مجدداً.",
    );
    return;
  }
  if (order.archived_at) {
    await renderErrorCard(
      botToken,
      chatId,
      session,
      sb,
      "🗂️ هذا الطلب مؤرشف. يرجى التواصل مع المتجر.",
    );
    return;
  }
  if (order.payment_status !== "paid") {
    await renderErrorCard(
      botToken,
      chatId,
      session,
      sb,
      "⏳ الطلب لم يكتمل دفعه بعد.",
    );
    return;
  }
  if (order.fulfillment_status !== "fulfilled" || !order.account_id) {
    await renderErrorCard(
      botToken,
      chatId,
      session,
      sb,
      "⏳ الطلب قيد المعالجة. حاول بعد قليل.",
    );
    return;
  }

  const product = Array.isArray(order.product) ? order.product[0] : order.product;
  await sb
    .from("telegram_pickup_sessions")
    .update({
      state: "awaiting_last4",
      order_id: order.id,
      awaiting: null,
      last_prompt_message_id: null,
      last_action_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + SESSION_TTL_MIN * 60_000).toISOString(),
    })
    .eq("chat_id", chatId);

  const refId = order.salla_reference_id ?? order.salla_order_id ?? "—";
  const fresh = await loadOrCreateSession(sb, chatId);
  await renderOrderFoundCard(
    botToken,
    chatId,
    fresh,
    sb,
    refId,
    product?.name ?? "منتج رقمي",
  );
}

async function handleLast4Input(
  sb: ReturnType<typeof createServiceClient>,
  botToken: string,
  chatId: string,
  session: SessionRow,
  raw: string,
): Promise<void> {
  const last4 = raw.replace(/\D/g, "");
  if (!/^\d{4}$/.test(last4)) {
    await sendEphemeral(botToken, chatId, "📱 أدخل 4 أرقام بالضبط.");
    await openPrompt(sb, botToken, chatId, session, "last4");
    return;
  }
  if (!session.order_id) {
    const fresh = await resetSession(sb, chatId, "idle");
    await renderWelcomeCard(botToken, chatId, fresh, sb);
    return;
  }

  const { data: order } = await sb
    .from("orders")
    .select(
      `id, customer_mobile, customer_mobile_last4, product_id, salla_reference_id, salla_order_id,
       account:accounts(
         email, instructions, password_encrypted,
         card_code_encrypted, file_storage_path, totp_secret_encrypted, status
       ), product:products(name, handler_type),
       option:product_options(name)`,
    )
    .eq("id", session.order_id)
    .single();

  if (!order) {
    await renderErrorCard(
      botToken,
      chatId,
      session,
      sb,
      "حدث خطأ في تحميل الطلب. أعد المحاولة.",
    );
    return;
  }

  if (order.customer_mobile_last4 !== last4) {
    await bumpFailure(sb, chatId, session);
    await renderErrorCard(
      botToken,
      chatId,
      session,
      sb,
      "❌ الأرقام لا تطابق الجوال المسجّل في الطلب.",
    );
    return;
  }

  if (order.product_id && order.customer_mobile) {
    const ban = await findActiveBan({
      mobile: order.customer_mobile,
      productId: order.product_id,
    });
    if (ban) {
      await sb
        .from("telegram_pickup_sessions")
        .update({ state: "idle", order_id: null, awaiting: null })
        .eq("chat_id", chatId);
      await renderErrorCard(
        botToken,
        chatId,
        session,
        sb,
        `🚫 تم تقييد رقمك من استلام هذا المنتج.\n📌 السبب: ${escapeHtml(ban.reason ?? "حماية أمنية")}`,
      );
      return;
    }
  }

  const product = Array.isArray(order.product) ? order.product[0] : order.product;
  const option = Array.isArray(order.option) ? order.option[0] : order.option;
  const account = Array.isArray(order.account) ? order.account[0] : order.account;
  if (!product || !account) {
    await renderErrorCard(
      botToken,
      chatId,
      session,
      sb,
      "بيانات الطلب غير مكتملة. تواصل مع المتجر.",
    );
    return;
  }

  const password = decryptBytea(account.password_encrypted);
  const cardCode = decryptBytea(account.card_code_encrypted);
  const totpData =
    product.handler_type === "2fa_account" && account.totp_secret_encrypted
      ? generateTotpFromAccount(account.totp_secret_encrypted)
      : null;

  await sb
    .from("telegram_pickup_sessions")
    .update({
      state: "verified",
      failed_attempts: 0,
      awaiting: null,
      last_action_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + SESSION_TTL_MIN * 60_000).toISOString(),
    })
    .eq("chat_id", chatId);

  const fresh = await loadOrCreateSession(sb, chatId);
  await renderCredentialsCard(botToken, chatId, fresh, sb, {
    refId: order.salla_reference_id ?? order.salla_order_id ?? "—",
    productName: product.name,
    optionName: option?.name ?? null,
    email: account.email,
    password,
    cardCode,
    fileUrl: account.file_storage_path,
    instructions: account.instructions,
    totp: totpData
      ? { code: totpData.code, expiresInSeconds: totpData.expiresInSeconds }
      : null,
  });
}

async function handleCodeRequest(
  sb: ReturnType<typeof createServiceClient>,
  botToken: string,
  chatId: string,
  session: SessionRow,
): Promise<void> {
  if (session.state !== "verified" || !session.order_id) {
    await sendEphemeral(
      botToken,
      chatId,
      "👋 يجب التحقق من الطلب أولاً.",
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
    await sendEphemeral(botToken, chatId, "حدث خطأ. أعد المحاولة.");
    return;
  }
  if (order.otp_request_count >= order.otp_request_limit) {
    await sendEphemeral(
      botToken,
      chatId,
      "🚫 تجاوزت الحد الأقصى لطلبات الكود لهذا الطلب.",
    );
    return;
  }
  const acct = Array.isArray(order.account) ? order.account[0] : order.account;
  if (!acct?.totp_secret_encrypted) {
    await sendEphemeral(botToken, chatId, "هذا المنتج لا يدعم كود تحقق ثنائي.");
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
      await sendEphemeral(
        botToken,
        chatId,
        `⏳ انتظر ${Math.ceil(cooldown - elapsed)} ثانية قبل طلب كود جديد.`,
      );
      return;
    }
  }

  const totp = generateTotpFromAccount(acct.totp_secret_encrypted);
  if (!totp) {
    await sendEphemeral(botToken, chatId, "تعذّر توليد الكود.");
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

  // Re-render the credentials card with the fresh code so the chat
  // doesn't grow more messages.
  const { data: full } = await sb
    .from("orders")
    .select(
      `id, salla_reference_id, salla_order_id,
       account:accounts(email, instructions, password_encrypted,
         card_code_encrypted, file_storage_path, totp_secret_encrypted),
       product:products(name, handler_type),
       option:product_options(name)`,
    )
    .eq("id", session.order_id)
    .single();
  if (!full) return;
  const product = Array.isArray(full.product) ? full.product[0] : full.product;
  const option = Array.isArray(full.option) ? full.option[0] : full.option;
  const account = Array.isArray(full.account) ? full.account[0] : full.account;
  const fresh = await loadOrCreateSession(sb, chatId);
  await renderCredentialsCard(botToken, chatId, fresh, sb, {
    refId: full.salla_reference_id ?? full.salla_order_id ?? "—",
    productName: product?.name ?? "منتج",
    optionName: option?.name ?? null,
    email: account?.email,
    password: decryptBytea(account?.password_encrypted),
    cardCode: decryptBytea(account?.card_code_encrypted),
    fileUrl: account?.file_storage_path,
    instructions: account?.instructions,
    totp: { code: totp.code, expiresInSeconds: totp.expiresInSeconds },
  });
}

/* ─── Card / prompt helpers ────────────────────────────────────────── */

/**
 * Either edits the existing main card or sends a fresh one. Persists
 * the message_id back onto the session so subsequent edits hit the
 * same card. If editing fails (message too old / deleted), we fall
 * back to a new message gracefully.
 */
async function ensureCard(
  sb: ReturnType<typeof createServiceClient>,
  botToken: string,
  chatId: string,
  session: SessionRow,
  text: string,
  keyboard: Array<Array<{ text: string; callback_data: string }>>,
): Promise<void> {
  const reply_markup = { inline_keyboard: keyboard };

  if (session.main_message_id) {
    const editRes = await tg(botToken, "editMessageText", {
      chat_id: chatId,
      message_id: session.main_message_id,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup,
    });
    if (editRes?.ok) {
      await sb
        .from("telegram_pickup_sessions")
        .update({
          last_action_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + SESSION_TTL_MIN * 60_000).toISOString(),
        })
        .eq("chat_id", chatId);
      return;
    }
  }

  const sent = await tg(botToken, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup,
  });
  const messageId = sent?.result?.message_id;
  if (typeof messageId === "number") {
    await sb
      .from("telegram_pickup_sessions")
      .update({
        main_message_id: messageId,
        last_action_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + SESSION_TTL_MIN * 60_000).toISOString(),
      })
      .eq("chat_id", chatId);
  }
}

/**
 * Sends a ForceReply prompt and remembers its message_id so we can
 * delete it after capturing the user's reply.
 */
async function openPrompt(
  sb: ReturnType<typeof createServiceClient>,
  botToken: string,
  chatId: string,
  session: SessionRow,
  awaiting: "order" | "last4",
): Promise<void> {
  const promptText =
    awaiting === "order"
      ? "🔢 <b>أدخل رقم الطلب:</b>\nمثال: <code>5232685</code>"
      : "📱 <b>أدخل آخر 4 أرقام من جوالك:</b>\nمثال: <code>1102</code>";
  const sent = await tg(botToken, "sendMessage", {
    chat_id: chatId,
    text: promptText,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      force_reply: true,
      input_field_placeholder:
        awaiting === "order" ? "رقم الطلب" : "4 أرقام فقط",
      selective: false,
    },
  });
  const promptId = sent?.result?.message_id ?? null;
  await sb
    .from("telegram_pickup_sessions")
    .update({
      awaiting,
      last_prompt_message_id: promptId,
      last_action_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + SESSION_TTL_MIN * 60_000).toISOString(),
    })
    .eq("chat_id", chatId);
}

/**
 * Sends a short auto-deleting toast — used for transient validation errors.
 */
async function sendEphemeral(
  botToken: string,
  chatId: string,
  text: string,
): Promise<void> {
  const sent = await tg(botToken, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
  const messageId = sent?.result?.message_id;
  if (typeof messageId === "number") {
    setTimeout(() => {
      void deleteMessage(botToken, chatId, messageId);
    }, 5_000);
  }
}

async function deleteMessage(
  botToken: string,
  chatId: string,
  messageId: number,
): Promise<void> {
  await tg(botToken, "deleteMessage", { chat_id: chatId, message_id: messageId });
}

async function ackCallback(botToken: string, callbackId: string): Promise<void> {
  await tg(botToken, "answerCallbackQuery", { callback_query_id: callbackId });
}

async function tg(
  botToken: string,
  method: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; result?: { message_id: number } } | null> {
  try {
    const r = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await r.json().catch(() => null)) as never;
  } catch {
    return null;
  }
}

/* ─── Session helpers ──────────────────────────────────────────────── */

async function loadOrCreateSession(
  sb: ReturnType<typeof createServiceClient>,
  chatId: string,
  userData?: unknown,
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
      user_data: (userData as Record<string, unknown> | undefined) ?? null,
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
): Promise<SessionRow> {
  // Keep main_message_id so we can keep editing the same card.
  const { data, error } = await sb
    .from("telegram_pickup_sessions")
    .update({
      state,
      order_id: null,
      failed_attempts: 0,
      awaiting: null,
      last_prompt_message_id: null,
      last_action_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + SESSION_TTL_MIN * 60_000).toISOString(),
    })
    .eq("chat_id", chatId)
    .select("*")
    .single();
  if (error) throw error;
  return data as SessionRow;
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
      awaiting: null,
      last_prompt_message_id: null,
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
 