"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
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
  saveEmailConfigAction,
  testEmailConnectionAction,
  sendEmailTestMessageAction,
} from "@/app/admin/notifications/actions";

type FormState = {
  api_key: string;
  verified_domain: string;
  from: string;
  reply_to: string;
};

const DEFAULTS: FormState = {
  api_key: "",
  verified_domain: "",
  from: "",
  reply_to: "",
};

/**
 * Email channel configuration. The merchant supplies their own Resend
 * API key (recommended) or leaves it blank to fall back on the platform
 * default. When enabled, emails fire on:
 *   - order ready for pickup
 *   - phone ban (mirrors the WhatsApp ban template)
 */
export function EmailConfigDialog({
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
  const [testEmail, setTestEmail] = useState("");

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function save() {
    setError(null);
    setOkMsg(null);
    startSave(async () => {
      const res = await saveEmailConfigAction({
        enabled,
        config: {
          api_key: form.api_key || undefined,
          verified_domain: form.verified_domain || undefined,
          from: form.from || undefined,
          reply_to: form.reply_to || undefined,
        },
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
    const r = await testEmailConnectionAction({ apiKey: form.api_key });
    setVerifying(false);
    if (!r.ok) setError(r.error);
    else
      setOkMsg(
        `تم التحقق من المفتاح. عدد النطاقات (Domains) المسجلة: ${r.data?.domains ?? 0}`,
      );
  }

  async function sendTest() {
    setError(null);
    setOkMsg(null);
    if (!testEmail.trim()) {
      setError("أدخل عنوان بريد لإرسال الاختبار إليه");
      return;
    }
    setSending(true);
    const r = await sendEmailTestMessageAction({
      apiKey: form.api_key || undefined,
      verifiedDomain: form.verified_domain || undefined,
      from: form.from || undefined,
      replyTo: form.reply_to || undefined,
      to: testEmail.trim(),
    });
    setSending(false);
    if (!r.ok) setError(r.error);
    else setOkMsg(`تم إرسال بريد الاختبار إلى ${testEmail.trim()}.`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-admin sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-4 text-blue-400" />
            إعداد قناة البريد الإلكتروني
          </DialogTitle>
          <DialogDescription>
            عند تفعيل هذه القناة، يستلم العميل عبر بريده نفس رسائل الواتساب: تأكيد الطلب الجاهز وتنبيه الحظر. أنشئ مفتاح API من{" "}
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
            >
              لوحة Resend <ExternalLink className="size-3" />
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Toggle
            label="تفعيل قناة البريد الإلكتروني"
            description="عند الإيقاف لن يصل العميل أي بريد. الواتساب وتيليجرام يبقون شغالين كالمعتاد."
            checked={enabled}
            onChange={setEnabled}
          />

          <Field
            label="API Key"
            hint="مفتاح Resend الخاص بك. يبدأ بـ re_... — يُخزن آمناً ولا يُعرض بعد الحفظ."
            icon={<KeyRound className="size-3" />}
          >
            <input
              value={form.api_key}
              onChange={(e) => set("api_key", e.target.value)}
              dir="ltr"
              type="password"
              placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
              className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
            />
          </Field>

          <Field
            label="النطاق الموثّق (Verified Domain)"
            hint="النطاق الذي وثّقته في Resend (مثال: portaliosa.com). يُستخدم تلقائياً كعنوان مرسل افتراضي إذا تركت الحقل التالي فارغاً."
          >
            <input
              value={form.verified_domain}
              onChange={(e) => set("verified_domain", e.target.value)}
              dir="ltr"
              placeholder="portaliosa.com"
              className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
            />
          </Field>

          <Field
            label="عنوان المرسل (From)"
            hint="مثال: متجري <noreply@yourstore.com>. اتركه فارغاً ليتحوّل تلقائياً إلى noreply@<النطاق الموثّق>."
          >
            <input
              value={form.from}
              onChange={(e) => set("from", e.target.value)}
              dir="ltr"
              placeholder="LinkUp <noreply@portaliosa.com>"
              className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
            />
          </Field>

          <Field
            label="عنوان الرد (Reply-To)"
            hint="اختياري — البريد الذي يرد عليه العميل عند الضغط على Reply."
          >
            <input
              value={form.reply_to}
              onChange={(e) => set("reply_to", e.target.value)}
              dir="ltr"
              placeholder="support@yourstore.com"
              className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
            />
          </Field>

          <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3 space-y-2.5">
            <div className="text-xs font-bold text-fg-muted">
              اختبار سريع
            </div>
            <input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              dir="ltr"
              placeholder="me@example.com"
              className="h-10 px-3 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={verify}
                disabled={isVerifying || !form.api_key}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-fg text-xs font-bold hover:bg-surface-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isVerifying ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-3.5" />
                )}
                التحقق من المفتاح
              </button>
              <button
                onClick={sendTest}
                disabled={isSending || !testEmail}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-fg text-xs font-bold hover:bg-surface-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                إرسال بريد اختبار
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] p-3 text-xs text-fg-muted leading-relaxed">
            <strong className="text-fg">ماذا يصل العميل عبر البريد؟</strong>
            <ul className="mt-2 space-y-1.5 list-disc list-inside">
              <li>تأكيد الطلب الجاهز للاستلام مع زر مباشر للصفحة.</li>
              <li>نسخة من تنبيه الحظر إذا تم تقييد رقمه (مع المدة والسبب).</li>
            </ul>
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
            disabled={isSaving}
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
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-fg-muted inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
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
