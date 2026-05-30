"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  KeyRound,
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
        bot_token: botToken.trim() || undefined, // undefined preserves current value
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
    <div className="space-y-5 max-w-3xl">
      {/* Hero */}
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5">
        <div className="flex items-start gap-4">
          <div className="size-11 shrink-0 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
            <Send className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-fg mb-1">قناة تيليجرام الذكية</h3>
            <p className="text-sm text-fg-muted leading-relaxed">
              العميل يفتح بوتك على تيليجرام، يكتب رقم طلبه، يتحقق من جواله، فيستلم بياناته كاملة. مع طلب كود تحقق ثنائي جديد بزر واحد. وأنت تستلم نسخة فورية من كل طلب وحظر في محادثتك.
            </p>
          </div>
          <Toggle checked={enabled} onChange={setEnabled} />
        </div>
      </div>

      {/* Bot setup */}
      <Section icon={<KeyRound className="size-4" />} title="ربط البوت">
        <Field
          label="Bot Token"
          hint={
            settings.bot_token_present
              ? "البوت مربوط حالياً. اترك الحقل فارغاً للإبقاء على القيمة المحفوظة."
              : "أنشئ البوت من BotFather واحصل على الـ Token."
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
            className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-xs w-full focus:outline-none focus:border-accent/60 font-mono"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
          >
            BotFather <ExternalLink className="size-3" />
          </a>
          <button
            onClick={verifyToken}
            disabled={isVerifying || !botToken.trim()}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-fg text-xs font-bold hover:bg-surface transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isVerifying ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
            تحقق من البوت
          </button>
          {verifiedUsername && (
            <span className="text-xs text-fg-muted">
              @{verifiedUsername}
            </span>
          )}
        </div>
      </Section>

      {/* Customer pickup flow */}
      <Section
        icon={<Sparkles className="size-4" />}
        title="استلام العميل عبر البوت"
        description="عند تفعيله، يقدر العميل يفتح البوت ويكتب رقم طلبه ويستلم بياناته كاملة + كود التحقق الثنائي."
      >
        <Toggle
          inline
          label={pickupFlowEnabled ? "مفعّل" : "موقوف"}
          checked={pickupFlowEnabled}
          onChange={setPickupFlowEnabled}
        />
        <p className="text-[11px] text-fg-faint leading-relaxed">
          الحماية الأمنية كاملة: نفس الفحص (رقم الطلب + آخر 4 أرقام)، نفس قوائم الحظر، نفس عداد المحاولات. الفرق الوحيد: العميل يستلم في تيليجرام بدل صفحة الويب.
        </p>
      </Section>

      {/* Operator mirror */}
      <Section
        icon={<MessageSquare className="size-4" />}
        title="نسخ الإشعارات إلى محادثتك"
        description="تستلم إشعار فوري في محادثتك على تيليجرام بكل طلب جديد ينفّذ وكل رقم يُحظر."
      >
        <Field
          label="Chat ID للمسؤول"
          hint="أرسل /start إلى @userinfobot في تيليجرام لتعرف Chat ID الخاص بك."
        >
          <input
            value={operatorChatId}
            onChange={(e) => setOperatorChatId(e.target.value)}
            dir="ltr"
            placeholder="123456789"
            className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
          />
        </Field>
        <div className="space-y-2">
          <CheckRow
            label="نسخ كل طلب جاهز"
            description="رسالة تصلك بكل طلب نُفّذ تلقائياً مع رابط صفحة الاستلام."
            checked={mirrorOrders}
            onChange={setMirrorOrders}
          />
          <CheckRow
            label="نسخ كل عملية حظر"
            description="عند حظر أي رقم (يدوي أو تلقائي) تصلك نسخة بالتفاصيل."
            checked={mirrorBans}
            onChange={setMirrorBans}
          />
        </div>
        <button
          onClick={sendOperatorTest}
          disabled={isTesting || !operatorChatId}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-fg text-xs font-bold hover:bg-surface transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isTesting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          إرسال رسالة اختبار للمسؤول
        </button>
      </Section>

      {/* Webhook registration */}
      <Section
        icon={<Webhook className="size-4" />}
        title="ربط البوت بالخادم (Webhook)"
        description="بعد حفظ الـ Bot Token، اضغط هنا لتسجيل الرابط مع تيليجرام. لا يتعامل البوت مع أي رسالة قبل تسجيل الـ webhook."
      >
        {settings.webhook_url ? (
          <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3 space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-widest text-fg-faint">
              الـ Webhook الحالي
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
            {isRegistering ? <Loader2 className="size-3.5 animate-spin" /> : <Webhook className="size-3.5" />}
            {settings.webhook_url ? "إعادة تسجيل الـ Webhook" : "تسجيل الـ Webhook"}
          </button>
          {settings.webhook_url && (
            <button
              onClick={unregisterWebhook}
              disabled={isUnregistering}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-fg-muted text-xs font-bold hover:bg-surface hover:text-fg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isUnregistering ? <Loader2 className="size-3.5 animate-spin" /> : null}
              إلغاء وإيقاف
            </button>
          )}
        </div>
      </Section>

      {/* Status banners */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {okMsg && (
        <div className="flex items-start gap-2 text-xs text-accent font-semibold bg-accent/10 border border-accent/20 px-3 py-2 rounded-lg">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <span>{okMsg}</span>
        </div>
      )}

      {/* Save bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={save}
          disabled={isSaving}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-fg text-bg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          <Save className="size-3.5" />
          {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="size-8 shrink-0 rounded-lg flex items-center justify-center bg-surface-2 text-fg-muted">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-fg mb-0.5">{title}</h4>
          {description && (
            <p className="text-xs text-fg-muted leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">{children}</div>
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

function Toggle({
  checked,
  onChange,
  inline,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  inline?: boolean;
  label?: string;
}) {
  if (inline && label) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-fg-muted">{label}</span>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer shrink-0 ${
            checked ? "bg-accent" : "bg-surface-2 border border-[hsl(var(--hairline-strong))]"
          }`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-white shadow-md transition-all ${
              checked ? "right-0.5" : "right-[calc(100%-1.375rem)]"
            }`}
          />
        </button>
      </div>
    );
  }
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
            checked ? "border-accent bg-accent" : "border-[hsl(var(--hairline-strong))] bg-surface"
          }`}
        >
          {checked && <CheckCircle2 className="size-3 text-bg" />}
        </div>
        <span className="font-bold text-sm text-fg">{label}</span>
      </div>
      <p className="text-xs text-fg-muted ms-6 leading-relaxed">{description}</p>
    </button>
  );
}
