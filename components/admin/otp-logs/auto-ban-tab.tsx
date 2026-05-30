"use client";

import { useState, useTransition } from "react";
import { Sparkles, Save, AlertTriangle } from "lucide-react";
import { updateAutoBanSettingsAction } from "@/app/admin/otp-logs/actions";
import type { AutoBanSettings } from "@/lib/db/platform-settings";

export function AutoBanTab({ initial }: { initial: AutoBanSettings }) {
  const [settings, setSettings] = useState<AutoBanSettings>(initial);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    settings.enabled !== initial.enabled ||
    settings.failures_threshold !== initial.failures_threshold ||
    settings.window_minutes !== initial.window_minutes ||
    settings.scope !== initial.scope;

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateAutoBanSettingsAction(settings);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedAt(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    });
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Hero card */}
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5">
        <div className="flex items-start gap-4">
          <div className="size-11 shrink-0 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <Sparkles className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-fg mb-1">الحظر التلقائي عند تجاوز الحد</h3>
            <p className="text-sm text-fg-muted leading-relaxed">
              يحظر تلقائياً أي رقم جوال يحاول طلب كود التحقق ويفشل أكثر من عدد محدد من المرات خلال نافذة زمنية. يحميك من التخمين والاعتداءات الآلية بدون تدخل يدوي.
            </p>
          </div>
          <Toggle
            checked={settings.enabled}
            onChange={(v) => setSettings({ ...settings, enabled: v })}
          />
        </div>
      </div>

      {/* Threshold settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="عدد المحاولات الفاشلة المسموح بها"
          hint="بعد هذا العدد سيتم حظر الرقم تلقائياً."
        >
          <input
            type="number"
            min={1}
            max={50}
            value={settings.failures_threshold}
            onChange={(e) =>
              setSettings({ ...settings, failures_threshold: Number(e.target.value) || 1 })
            }
            disabled={!settings.enabled}
            className="h-11 px-3 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-base font-num font-extrabold text-fg w-full focus:outline-none focus:border-accent/60 disabled:opacity-50"
          />
        </Field>
        <Field
          label="النافذة الزمنية (بالدقائق)"
          hint="المحاولات تُحسب خلال هذه المدة فقط."
        >
          <input
            type="number"
            min={1}
            max={1440}
            value={settings.window_minutes}
            onChange={(e) =>
              setSettings({ ...settings, window_minutes: Number(e.target.value) || 1 })
            }
            disabled={!settings.enabled}
            className="h-11 px-3 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-base font-num font-extrabold text-fg w-full focus:outline-none focus:border-accent/60 disabled:opacity-50"
          />
        </Field>
      </div>

      {/* Scope */}
      <Field label="نطاق الحظر" hint="يحدد ما إذا كان الحظر يشمل كل المنتجات أو منتج المحاولة فقط.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <ScopeOption
            active={settings.scope === "global"}
            onClick={() => setSettings({ ...settings, scope: "global" })}
            disabled={!settings.enabled}
            title="حظر عام"
            subtitle="يشمل كل المنتجات في المتجر"
          />
          <ScopeOption
            active={settings.scope === "per-product"}
            onClick={() => setSettings({ ...settings, scope: "per-product" })}
            disabled={!settings.enabled}
            title="منتج فقط"
            subtitle="يشمل المنتج الذي حدث فيه الفشل فقط"
          />
        </div>
      </Field>

      {/* Preview */}
      <div className="rounded-2xl bg-surface-2 border border-[hsl(var(--hairline))] p-4">
        <div className="text-[10px] font-bold tracking-widest text-fg-faint uppercase mb-2">
          الملخص
        </div>
        <p className="text-sm text-fg leading-relaxed">
          {settings.enabled ? (
            <>
              عند تسجيل{" "}
              <strong className="font-num font-extrabold">{settings.failures_threshold}</strong>{" "}
              محاولات فاشلة من نفس الرقم خلال{" "}
              <strong className="font-num font-extrabold">{settings.window_minutes}</strong>{" "}
              دقيقة، سيتم حظره{" "}
              {settings.scope === "global" ? "من كل المنتجات" : "من المنتج المعني فقط"}{" "}
              تلقائياً.
            </>
          ) : (
            <span className="text-fg-muted">الحظر التلقائي غير مفعّل حالياً. كل الحظر يُضاف يدوياً.</span>
          )}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/25 px-3 py-2.5 flex items-center gap-2 text-xs text-red-400 font-semibold">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Save bar */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="text-xs text-fg-faint">
          {savedAt ? (
            <span className="text-accent">تم الحفظ في {savedAt}</span>
          ) : dirty ? (
            <span>لديك تعديلات غير محفوظة.</span>
          ) : null}
        </div>
        <button
          onClick={save}
          disabled={isPending || !dirty}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-fg text-bg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Save className="size-3.5" />
          {isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
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
    <label className="block space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold text-fg-muted">{label}</span>
      </div>
      {children}
      {hint && <span className="text-[11px] text-fg-faint block">{hint}</span>}
    </label>
  );
}

function ScopeOption({
  active,
  disabled,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-start rounded-xl border p-3 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? "bg-accent/10 border-accent/40"
          : "bg-surface border-[hsl(var(--hairline-strong))] hover:bg-surface-2"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
            active ? "border-accent bg-accent" : "border-[hsl(var(--hairline-strong))] bg-surface"
          }`}
        >
          {active && <span className="size-1.5 rounded-full bg-bg" />}
        </div>
        <span className="font-bold text-sm text-fg">{title}</span>
      </div>
      <p className="text-[11px] text-fg-muted mt-1 ms-6 leading-relaxed">{subtitle}</p>
    </button>
  );
}
