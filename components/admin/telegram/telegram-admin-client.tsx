"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Lightbulb,
  Loader2,
  MessageSquare,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Webhook,
} from "lucide-react";
import {
  saveTelegramBotConfigAction,
  verifyTelegramBotAction,
  sendOperatorTestMessageAction,
  registerTelegramWebhookAction,
  unregisterTelegramWebhookAction,
} from "@/app/admin/telegram/actions";

type Settings = {
  bot_token_present: boolean;
  bot_username: string | null;
  operator_chat_id: string | null;
  enabled: boolean;
  mirror_orders: boolean;
  mirror_bans: boolean;
  pickup_flow_enabled: boolean;
  webhook_url: string | null;
  webhook_set_at: string | null;
};

export function TelegramAdminClient({ settings }: { settings: Settings }) {
  const [botToken, setBotToken] = useState("");
  const [operatorChatId, setOperatorChatId] = useState(
    settings.operator_chat_id ?? "",
  );
  const [enabled, setEnabled] = useState(settings.enabled);
  const [pickupFlowEnabled, setPickupFlowEnabled] = useState(
    settings.pickup_flow_enabled,
  );
  const [mirrorOrders, setMirrorOrders] = useState(settings.mirror_orders);
  const [mirrorBans, setMirrorBans] = useState(settings.mirror_bans);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [verifiedUsername, setVerifiedUsername] = useState<string | null>(
    settings.bot_username,
  );
  const [isSaving, startSave] = useTransition();
  const [isVerifying, setVerifying] = useState(false);
  const [isTesting, setTesting] = useState(false);
  const [isRegistering, setRegistering] = useState(false);
  const [isUnregistering, setUnregistering] = useState(false);

  function clearMsg() {
    setError(null);
    setOkMsg(null);
  }

  function save() {
    clearMsg();
    startSave(async () => {
      const res = await saveTelegramBotConfigAction({
        bot_token: botToken.trim() || undefined,
        operator_chat_id: operatorChatId.trim() || null,
        enabled,
        mirror_orders: mirrorOrders,
        mirror_bans: mirrorBans,
        pickup_flow_enabled: pickupFlowEnabled,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOkMsg("تم حفظ الإعدادات.");
    });
  }

  async function verifyToken() {
    clearMsg();
    if (!botToken.trim()) {
      setError("أدخل Bot Token أولاً");
      return;
    }
    setVerifying(true);
    const r = await verifyTelegramBotAction({ botToken: botToken.trim() });
    setVerifying(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setVerifiedUsername(r.data?.username ?? null);
    setOkMsg(`تم التحقق من البوت @${r.data?.username ?? "—"}`);
  }

  async function registerWebhook() {
    clearMsg();
    setRegistering(true);
    const r = await registerTelegramWebhookAction();
    setRegistering(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setOkMsg(`تم تسجيل الـ webhook على ${r.data?.url}`);
  }

  async function unregisterWebhook() {
    clearMsg();
    setUnregistering(true);
    const r = await unregisterTelegramWebhookAction();
    setUnregistering(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setOkMsg("تم إلغاء تسجيل الـ webhook وإيقاف البوت.");
  }

  async function sendOperatorTest() {
    clearMsg();
    setTesting(true);
    const r = await sendOperatorTestMessageAction();
    setTesting(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setOkMsg("تم إرسال رسالة اختبار إلى محادثتك على تيليجرام.");
  }

  return (
    <div className="space-y-5">
      {/* Hero — full width */}
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="size-11 shrink-0 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
            <Send className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-fg">قناة تيليجرام الذكية</h3>
              <StatusPill enabled={enabled} configured={settings.bot_token_present} />
            </div>
            <p className="text-sm text-fg-muted leading-relaxed">
              العميل يفتح بوتك على تيليجرام، يكتب رقم طلبه، يتحقق من جواله، فيستلم بياناته كاملة وكود التحقق الثنائي بزر واحد. وأنت تستلم نسخة فورية من كل طلب وحظر في محادثتك.
            </p>
          </div>
          <div className="self-end sm:self-auto">
            <BigToggle checked={enabled} onChange={setEnabled} />
          </div>
        </div>
      </div>

      {/* Bot Setup — config + tips side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Section
          icon={<KeyRound className="size-4" />}
          title="ربط البوت"
          description="أدخل Bot Token من BotFather. كل بوت له Token فريد."
          className="lg:col-span-2"
        >
          <Field
            label="Bot Token"
            hint={
              settings.bot_token_present
                ? "البوت مربوط حالياً. اترك الحقل فارغاً للإبقاء على القيمة المحفوظة."
                : "صيغة الـ Token عادة: 123456789:ABC-xyz... من BotFather."
            }
          >
            <input
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              type="password"
              dir="ltr"
              placeholder={
                settings.bot_token_present
                  ? "•••••••••••• (محفوظ)"
                  : "123456789:AA..."
              }
              className="h-11 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={verifyToken}
              disabled={isVerifying || !botToken.trim()}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-fg text-bg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="size-3.5" />
              )}
              تحقق من البوت
            </button>
            {verifiedUsername && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
                <CheckCircle2 className="size-3.5" />
                @{verifiedUsername}
              </span>
            )}
          </div>
        </Section>

        <TipCard
          title="كيف أنشئ بوت؟"
          steps={[
            "افتح تيليجرام وابحث عن @BotFather",
            "أرسل /newbot واتبع التعليمات",
            "اختر اسماً للبوت ثم اسماً للمعرّف (ينتهي بـ bot)",
            "ينسخ لك BotFather الـ Token — احفظه هنا",
          ]}
          link={{ label: "افتح BotFather", href: "https://t.me/BotFather" }}
        />
      </div>

      {/* Customer pickup flow — full width single section */}
      <Section
        icon={<Sparkles className="size-4" />}
        title="استلام العميل عبر البوت"
        description="عند تفعيله، يقدر العميل يفتح البوت ويكتب رقم طلبه ويستلم بياناته كاملة + كود التحقق الثنائي."
        accent="violet"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs text-fg-muted leading-relaxed flex-1 min-w-[260px]">
            الحماية الأمنية كاملة: نفس الفحص (رقم الطلب + آخر 4 أرقام)، نفس قوائم الحظر، نفس عداد المحاولات. الفرق الوحيد: العميل يستلم في تيليجرام بدل صفحة الويب.
          </div>
          <InlineToggle
            label={pickupFlowEnabled ? "مفعّل" : "موقوف"}
            checked={pickupFlowEnabled}
            onChange={setPickupFlowEnabled}
          />
        </div>
      </Section>

      {/* Operator mirror — config + tips side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Section
          icon={<MessageSquare className="size-4" />}
          title="نسخ الإشعارات إلى محادثتك"
          description="تستلم إشعار فوري في محادثتك على تيليجرام بكل طلب جديد ينفّذ وكل رقم يُحظر."
          className="lg:col-span-2"
        >
          <Field
            label="Chat ID للمسؤول"
            hint='تيليجرام يستخدم رقم Chat ID للتعريف، مثال: 123456789. للقنوات يبدأ بـ -100.'
          >
            <input
              value={operatorChatId}
              onChange={(e) => setOperatorChatId(e.target.value)}
              dir="ltr"
              placeholder="123456789"
              className="h-11 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <CheckRow
              label="نسخ كل طلب جاهز"
              description="رسالة تصلك بكل طلب نُفّذ تلقائياً."
              checked={mirrorOrders}
              onChange={setMirrorOrders}
            />
            <CheckRow
              label="نسخ كل عملية حظر"
              description="عند حظر أي رقم تصلك نسخة بالتفاصيل."
              checked={mirrorBans}
              onChange={setMirrorBans}
            />
          </div>
          <button
            onClick={sendOperatorTest}
            disabled={isTesting || !operatorChatId}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-fg text-xs font-bold hover:bg-surface transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isTesting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            إرسال رسالة اختبار للمسؤول
          </button>
        </Section>

        <TipCard
          title="كيف أعرف Chat ID؟"
          steps={[
            "افتح @userinfobot في تيليجرام",
            "أرسل أي رسالة، يرد عليك بـ Your ID",
            "انسخ الرقم وضعه هنا",
            "للقنوات: أضف البوت كأدمن، ثم استخدم @username_to_id_bot",
          ]}
          link={{
            label: "افتح userinfobot",
            href: "https://t.me/userinfobot",
          }}
        />
      </div>

      {/* Webhook — full width */}
      <Section
        icon={<Webhook className="size-4" />}
        title="ربط البوت بالخادم (Webhook)"
        description="بعد حفظ Bot Token، اضغط الزر لتسجيل الرابط مع تيليجرام. لا يستجيب البوت لأي رسالة قبل تسجيل الـ webhook."
        accent="amber"
      >
        {settings.webhook_url ? (
          <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-fg-faint">
                الـ Webhook الحالي
              </span>
              <CopyButton text={settings.webhook_url} />
            </div>
            <div className="font-mono text-xs text-fg break-all" dir="ltr">
              {settings.webhook_url}
            </div>
            {settings.webhook_set_at && (
              <div className="text-[11px] text-fg-muted">
                سُجّل في{" "}
                {new Date(settings.webhook_set_at).toLocaleString("ar-SA")}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-fg-muted">لم يُسجّل الـ webhook بعد.</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={registerWebhook}
            disabled={isRegistering || !settings.bot_token_present}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-fg text-bg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {isRegistering ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Webhook className="size-3.5" />
            )}
            {settings.webhook_url ? "إعادة تسجيل الـ Webhook" : "تسجيل الـ Webhook"}
          </button>
          {settings.webhook_url && (
            <button
              onClick={unregisterWebhook}
              disabled={isUnregistering}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-fg-muted text-xs font-bold hover:bg-surface hover:text-fg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isUnregistering ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              إلغاء وإيقاف
            </button>
          )}
        </div>
      </Section>

      {/* Status banners */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {okMsg && (
        <div className="flex items-start gap-2 text-xs text-accent font-semibold bg-accent/10 border border-accent/20 px-3 py-2.5 rounded-xl">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <span>{okMsg}</span>
        </div>
      )}

      {/* Save bar — sticky on small screens */}
      <div className="sticky bottom-0 -mx-5 px-5 py-3 bg-bg/80 backdrop-blur-md border-t border-[hsl(var(--hairline))] flex items-center justify-end gap-3">
        <button
          onClick={save}
          disabled={isSaving}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-fg text-bg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          <Save className="size-3.5" />
          {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────── */

function Section({
  icon,
  title,
  description,
  children,
  className,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  accent?: "violet" | "amber";
}) {
  const accentClasses =
    accent === "violet"
      ? "bg-violet-500/15 text-violet-400"
      : accent === "amber"
        ? "bg-amber-500/15 text-amber-500"
        : "bg-surface-2 text-fg-muted";

  return (
    <div
      className={`rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5 space-y-3 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`size-9 shrink-0 rounded-xl flex items-center justify-center ${accentClasses}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-fg mb-0.5">{title}</h4>
          {description && (
            <p className="text-xs text-fg-muted leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TipCard({
  title,
  steps,
  link,
}: {
  title: string;
  steps: string[];
  link?: { label: string; href: string };
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
          <Lightbulb className="size-4" />
        </div>
        <h4 className="font-bold text-sm text-fg">{title}</h4>
      </div>
      <ol className="space-y-2 text-xs text-fg-muted leading-relaxed list-decimal list-inside marker:text-amber-500 marker:font-bold">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {link && (
        <a
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 text-xs font-bold transition-colors"
        >
          <ExternalLink className="size-3" />
          {link.label}
        </a>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-fg-muted">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-fg-faint block">{hint}</span>}
    </label>
  );
}

function StatusPill({
  enabled,
  configured,
}: {
  enabled: boolean;
  configured: boolean;
}) {
  if (!configured) {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-fg-faint/15 text-fg-faint border border-fg-faint/25">
        غير معد
      </span>
    );
  }
  if (!enabled) {
    return (
      <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-amber-500/15 text-black border border-amber-500/25">
        موقوف
      </span>
    );
  }
  return (
    <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold bg-accent/15 text-black border border-accent/25">
      مفعّل
    </span>
  );
}

function BigToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-colors cursor-pointer shrink-0 ${
        checked ? "bg-accent" : "bg-surface-2 border border-[hsl(var(--hairline-strong))]"
      }`}
    >
      <span
        className={`absolute top-0.5 size-6 rounded-full bg-white shadow-md transition-all ${
          checked ? "right-0.5" : "right-[calc(100%-1.625rem)]"
        }`}
      />
    </button>
  );
}

function InlineToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-full bg-surface-2 border border-[hsl(var(--hairline))] px-3 py-1.5">
      <span className="text-xs font-bold text-fg">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer shrink-0 ${
          checked
            ? "bg-accent"
            : "bg-surface border border-[hsl(var(--hairline-strong))]"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow-md transition-all ${
            checked ? "right-0.5" : "right-[calc(100%-1.125rem)]"
          }`}
        />
      </button>
    </div>
  );
}

function CheckRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`text-start w-full rounded-xl border p-3 transition-colors cursor-pointer ${
        checked
          ? "bg-accent/10 border-accent/40"
          : "bg-surface-2 border-[hsl(var(--hairline-strong))] hover:bg-surface"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`size-4 rounded-md border flex items-center justify-center transition-colors ${
            checked
              ? "border-accent bg-accent"
              : "border-[hsl(var(--hairline-strong))] bg-surface"
          }`}
        >
          {checked && <CheckCircle2 className="size-3 text-bg" />}
        </div>
        <span className="font-bold text-xs text-fg">{label}</span>
      </div>
      <p className="text-[11px] text-fg-muted ms-6 leading-relaxed">{description}</p>
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-surface text-fg-muted hover:text-fg hover:bg-surface-2 text-[10px] font-bold border border-[hsl(var(--hairline))] transition-colors cursor-pointer"
    >
      {copied ? (
        <CheckCircle2 className="size-3 text-accent" />
      ) : (
        <Copy className="size-3" />
      )}
      {copied ? "تم النسخ" : "نسخ"}
    </button>
  );
}
