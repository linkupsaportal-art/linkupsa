"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  MessageCircle,
  Save,
  ShieldCheck,
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
  saveWhatsAppConfigAction,
  testWhatsAppConnectionAction,
} from "@/app/admin/notifications/actions";

type FormState = {
  host: string;
  app_token: string;
  integration_id: string;
  default_template: string;
  ban_template: string;
  language: string;
  store_name: string;
};

const DEFAULTS: FormState = {
  host: "akgroup.api.karzoun.chat",
  app_token: "",
  integration_id: "",
  default_template: "order_ready_v1",
  ban_template: "phone_ban_alert_v1",
  language: "ar",
  store_name: "",
};

export function WhatsAppConfigDialog({
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
  const [isTesting, setTesting] = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function save() {
    setError(null);
    setOkMsg(null);
    startSave(async () => {
      const res = await saveWhatsAppConfigAction({
        enabled,
        config: {
          provider: "karzoun",
          ...form,
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

  async function testConnection() {
    setError(null);
    setOkMsg(null);
    setTesting(true);
    const r = await testWhatsAppConnectionAction({
      host: form.host,
      appToken: form.app_token,
      integrationId: form.integration_id,
    });
    setTesting(false);
    if (!r.ok) setError(r.error);
    else setOkMsg(`تم الاتصال. عدد القوالب المعتمدة: ${r.data?.approvedTemplates ?? 0}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-admin sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="size-4 text-emerald-400" />
            إعداد قناة الواتساب — كرزون شات
          </DialogTitle>
          <DialogDescription>
            بياناتك من حسابك في كرزون شات. نخزنها بأمان ولا نعرضها لأي طرف ثالث.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Toggle
            label="تفعيل قناة الواتساب"
            description="عند الإيقاف، الإشعارات ما تنرسل حتى لو الإعدادات مكتوبة."
            checked={enabled}
            onChange={setEnabled}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="عنوان السيرفر (Host)" hint="افتراضي: akgroup.api.karzoun.chat">
              <input
                value={form.host}
                onChange={(e) => set("host", e.target.value)}
                dir="ltr"
                className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
              />
            </Field>
            <Field label="Integration ID" hint="من قناة الواتساب في كرزون شات">
              <input
                value={form.integration_id}
                onChange={(e) => set("integration_id", e.target.value)}
                dir="ltr"
                className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
              />
            </Field>
          </div>

          <Field
            label="App Token (JWT)"
            hint="من المطور → التطبيقات ورموز API → إنشاء تطبيق في كرزون شات"
            icon={<KeyRound className="size-3" />}
          >
            <textarea
              value={form.app_token}
              onChange={(e) => set("app_token", e.target.value)}
              rows={3}
              dir="ltr"
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              className="px-3 py-2 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-xs w-full focus:outline-none focus:border-accent/60 font-mono resize-none break-all"
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="قالب الطلب الجاهز">
              <input
                value={form.default_template}
                onChange={(e) => set("default_template", e.target.value)}
                dir="ltr"
                className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
              />
            </Field>
            <Field label="قالب الحظر">
              <input
                value={form.ban_template}
                onChange={(e) => set("ban_template", e.target.value)}
                dir="ltr"
                className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
              />
            </Field>
            <Field label="لغة القوالب">
              <input
                value={form.language}
                onChange={(e) => set("language", e.target.value)}
                dir="ltr"
                placeholder="ar"
                className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60 font-mono"
              />
            </Field>
          </div>

          <Field label="اسم المتجر (يظهر في الرسائل)" hint="مثال: PortalIosa">
            <input
              value={form.store_name}
              onChange={(e) => set("store_name", e.target.value)}
              className="h-10 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm w-full focus:outline-none focus:border-accent/60"
            />
          </Field>

          <button
            onClick={testConnection}
            disabled={isTesting || !form.app_token || !form.integration_id}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-fg text-xs font-bold hover:bg-surface transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isTesting ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
            اختبار الاتصال
          </button>

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
            disabled={isSaving || !form.app_token || !form.integration_id}
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
