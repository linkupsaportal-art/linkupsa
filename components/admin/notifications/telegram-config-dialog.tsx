"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Save,
  Send,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  saveTelegramConfigAction,
  testTelegramConnectionAction,
  sendTelegramTestMessageAction,
} from "@/app/admin/notifications/actions";

type FormState = {
  bot_token: string;
  chat_id: string;
  mirror_orders: boolean;
  mirror_bans: boolean;
};

const DEFAULTS: FormState = {
  bot_token: "",
  chat_id: "",
  mirror_orders: true,
  mirror_bans: true,
};

export function TelegramConfigDialog({
  open,
  onOpenChange,
  initial,
  initialEnabled,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Record<string, unknown>;
  initialEnabled: boolean;
}) {
  const [form, setForm] = useState<FormState>({
    ...DEFAULTS,
    ...(initial as Partial<FormState>),
  });
  const [enabled, setEnabled] = useState<boolean>(initialEnabled);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isVerifying, setVerifying] = useState(false);
  const [isSending, setSending] = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function save() {
    setError(null);
    setOkMsg(null);
    startSave(async () => {
      const res = await saveTelegramConfigAction({
        enabled,
        config: form,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOkMsg("تم حفظ الإعدادات.");
      setTimeout(() => onOpenChange(false), 800);
    });
  }

  async function verify() {
    setError(null);
    setOkMsg(null);
    setVerifying(true);
    const r = await testTelegramConnectionAction({ botToken: form.bot_token });
    setVerifying(false);
    if (!r.ok) setError(r.error);
    else setOkMsg(`متصل بالبوت @${r.data?.username ?? "—"}`);
  }

  async function sendTest() {
    setError(null);
    setOkMsg(null);
    setSending(true);
    const r = await sendTelegramTestMessageAction({
      botToken: form.bot_token,
      chatId: form.chat_id,
      text: "✅ <b>اختبار اتصال</b>\nقناة تيليجرام تعمل بشكل صحيح.",
    });
    setSending(false);
    if (!r.ok) setError(r.error);
    else setOkMsg("تم إرسال رسالة الاختبار. تحقق من المحادثة.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-admin sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-4 text-sky-400" />
            إعداد قناة تيليجرام
          </DialogTitle>
          <DialogDescription>
            أنشئ بوت من{" "}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:underline inline-flex items-center gap-0.5"
            >
              BotFather <ExternalLink className="size-3" />
            </a>
            ، احصل على Bot Token، ثم استخرج Chat ID من{" "}
            <a
              href="https://t.me/userinfobot"
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:underline inline-flex items-center gap-0.5"
            >
              userinfobot <ExternalLink className="size-3" />
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Toggle
            label="تفعيل قناة تيليجرام"
            description="عند الإيقاف، الإشعارات ما تنرسل حتى لو الإعدادات مكتوبة."
            checked={enabled}
            onChange={setEnabled}
          />

          <Field label="Bot Token" hint="مثال: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11">
            <input
              value={form.bot_token}
              onChange={(e) => set("bot_token", e.target.value)}
              dir="ltr"
              className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-xs w-full focus:outline-none focus:border-accent/60 font-mono"
            />
          </Field>

          <Field
            label="Chat ID"
            hint="رقم محادثة (مثال: 123456789) أو اسم قناة عامة (مثال: @my_channel)"
          >
            <input
              value={form.chat_id}
              onChange={(e) => set("chat_id", e.target.value)}
              dir="ltr"
              className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
            />
          </Field>

          <div className="space-y-2">
            <CheckRow
              label="نسخ كل طلب جاهز إلى المحادثة"
              description="عند تنفيذ كل طلب، تصلك رسالة فيها رقم الطلب واسم العميل والمنتج."
              checked={form.mirror_orders}
              onChange={(v) => set("mirror_orders", v)}
            />
            <CheckRow
              label="نسخ كل عملية حظر إلى المحادثة"
              description="عند حظر أي رقم (يدوي أو تلقائي)، تصلك رسالة بالتفاصيل."
              checked={form.mirror_bans}
              onChange={(v) => set("mirror_bans", v)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={verify}
              disabled={isVerifying || !form.bot_token}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-fg text-xs font-bold hover:bg-surface transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="size-3.5" />
              )}
              التحقق من البوت
            </button>
            <button
              onClick={sendTest}
              disabled={isSending || !form.bot_token || !form.chat_id}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-fg text-xs font-bold hover:bg-surface transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              إرسال رسالة اختبار
            </button>
          </div>

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
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-sm font-semibold text-fg hover:bg-surface-2 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={save}
            disabled={isSaving || !form.bot_token || !form.chat_id}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-fg text-bg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <Save className="size-3.5" />
            {isSaving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <div className="flex items-start gap-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-fg mb-0.5">{label}</div>
        <p className="text-xs text-fg-muted leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer shrink-0 ${
          checked ? "bg-accent" : "bg-surface border border-[hsl(var(--hairline-strong))]"
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
