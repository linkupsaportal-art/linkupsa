"use client";

import { useState, useTransition } from "react";
import { Timer, Save, AlertTriangle, Lock, KeyRound } from "lucide-react";
import { updatePickupSessionSettingsAction } from "@/app/admin/otp-logs/actions";
import type { PickupSessionSettings } from "@/lib/db/platform-settings";

const IDLE_MIN = 30;
const IDLE_MAX = 60 * 30; // 30 minutes
const TOTP_MIN = 30;
const TOTP_MAX = 60 * 15; // 15 minutes

const IDLE_PRESETS: { label: string; seconds: number }[] = [
  { label: "1 دقيقة", seconds: 60 },
  { label: "3 دقائق", seconds: 180 },
  { label: "5 دقائق", seconds: 300 },
  { label: "10 دقائق", seconds: 600 },
  { label: "15 دقيقة", seconds: 900 },
];

const TOTP_PRESETS: { label: string; seconds: number }[] = [
  { label: "1 دقيقة", seconds: 60 },
  { label: "2 دقيقة", seconds: 120 },
  { label: "3 دقائق", seconds: 180 },
  { label: "5 دقائق", seconds: 300 },
  { label: "10 دقائق", seconds: 600 },
];

/**
 * Session timing tab. Lets the operator tune two pickup-page guard rails:
 *   - Idle lock window — hides credentials & TOTP after N seconds of zero
 *     mouse / keyboard / touch activity, until the customer confirms they
 *     are still present.
 *   - TOTP lifetime cap — hard ceiling on how long the rotating 2FA code
 *     stays visible without re-issuing. Encourages "copy and leave"
 *     instead of leaving the screen open at a café table.
 */
export function SessionTab({ initial }: { initial: PickupSessionSettings }) {
  const [settings, setSettings] = useState<PickupSessionSettings>(initial);
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    settings.idle_timeout_seconds !== initial.idle_timeout_seconds ||
    settings.totp_max_seconds !== initial.totp_max_seconds;

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updatePickupSessionSettingsAction(settings);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedAt(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    });
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Hero card */}
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5">
        <div className="flex items-start gap-4">
          <div className="size-11 shrink-0 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
            <Timer className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-fg mb-1">إعدادات جلسة الاستلام</h3>
            <p className="text-sm text-fg-muted leading-relaxed">
              تتحكم في توقيت قفل صفحة الاستلام تلقائياً وفي مدة عرض كود التحقق الثنائي. تمنع ترك بيانات الحساب مكشوفة على الشاشة بدون مراقبة.
            </p>
          </div>
        </div>
      </div>

      {/* Idle timeout */}
      <SettingCard
        icon={<Lock className="size-4" />}
        tone="amber"
        title="مهلة الخمول قبل قفل الصفحة"
        description="إذا لم يتفاعل العميل مع الصفحة (نقر، كتابة، تمرير) خلال هذه المدة، يُخفى الحساب وكود التحقق ويظهر زر استئناف."
      >
        <DurationInput
          value={settings.idle_timeout_seconds}
          min={IDLE_MIN}
          max={IDLE_MAX}
          onChange={(v) =>
            setSettings({ ...settings, idle_timeout_seconds: v })
          }
        />
        <PresetRow
          presets={IDLE_PRESETS}
          current={settings.idle_timeout_seconds}
          onPick={(v) => setSettings({ ...settings, idle_timeout_seconds: v })}
        />
      </SettingCard>

      {/* TOTP lifetime */}
      <SettingCard
        icon={<KeyRound className="size-4" />}
        tone="violet"
        title="الحد الأقصى لعرض كود التحقق الثنائي"
        description="بعد مرور هذه المدة على عرض الكود، يتم إخفاؤه ويُطلب من العميل إعادة طلبه. يقلل من فرصة سرقته إذا تُركت الشاشة مفتوحة."
      >
        <DurationInput
          value={settings.totp_max_seconds}
          min={TOTP_MIN}
          max={TOTP_MAX}
          onChange={(v) => setSettings({ ...settings, totp_max_seconds: v })}
        />
        <PresetRow
          presets={TOTP_PRESETS}
          current={settings.totp_max_seconds}
          onPick={(v) => setSettings({ ...settings, totp_max_seconds: v })}
        />
      </SettingCard>

      {/* Summary */}
      <div className="rounded-2xl bg-surface-2 border border-[hsl(var(--hairline))] p-4">
        <div className="text-[10px] font-bold tracking-widest text-fg-faint uppercase mb-2">
          الملخص
        </div>
        <p className="text-sm text-fg leading-relaxed">
          ستُقفل الصفحة بعد{" "}
          <strong className="font-num font-extrabold">
            {humanize(settings.idle_timeout_seconds)}
          </strong>{" "}
          من الخمول، وسيختفي كود التحقق الثنائي بعد{" "}
          <strong className="font-num font-extrabold">
            {humanize(settings.totp_max_seconds)}
          </strong>{" "}
          من ظهوره، حتى يُعاد طلبه.
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

/* ─── Sub-components ─────────────────────────────────────────────────── */

function SettingCard({
  icon,
  tone,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  tone: "amber" | "violet";
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const toneClasses =
    tone === "amber"
      ? "bg-amber-500/15 text-amber-500"
      : "bg-violet-500/15 text-violet-400";

  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div
          className={`size-8 shrink-0 rounded-lg flex items-center justify-center ${toneClasses}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-fg mb-0.5">{title}</h4>
          <p className="text-xs text-fg-muted leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DurationInput({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        className="h-11 px-3 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-base font-num font-extrabold text-fg w-32 focus:outline-none focus:border-accent/60"
      />
      <span className="text-xs text-fg-muted">ثانية</span>
      <span className="text-xs text-fg-faint ms-auto">
        ≈ <strong className="font-num font-extrabold">{humanize(value)}</strong>
      </span>
    </div>
  );
}

function PresetRow({
  presets,
  current,
  onPick,
}: {
  presets: { label: string; seconds: number }[];
  current: number;
  onPick: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((p) => {
        const active = p.seconds === current;
        return (
          <button
            key={p.seconds}
            type="button"
            onClick={() => onPick(p.seconds)}
            className={`h-8 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              active
                ? "bg-accent text-accent-fg"
                : "bg-surface-2 text-fg-muted border border-[hsl(var(--hairline-strong))] hover:bg-surface hover:text-fg"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

function humanize(seconds: number): string {
  if (seconds < 60) return `${seconds} ثانية`;
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (rem === 0) {
    if (mins === 1) return "دقيقة";
    if (mins === 2) return "دقيقتان";
    if (mins <= 10) return `${mins} دقائق`;
    return `${mins} دقيقة`;
  }
  return `${mins} د و ${rem} ث`;
}
