"use client";

import { useState } from "react";
import { FileClock, ShieldBan, Sparkles, Timer } from "lucide-react";
import type { OtpLogRow, OtpLogStats } from "@/lib/db/otp-logs";
import type { PhoneBan } from "@/lib/db/phone-bans";
import type {
  AutoBanSettings,
  PickupSessionSettings,
} from "@/lib/db/platform-settings";
import { LogsTab } from "./logs-tab";
import { BansTab } from "./bans-tab";
import { AutoBanTab } from "./auto-ban-tab";
import { SessionTab } from "./session-tab";

type Tab = "logs" | "bans" | "auto" | "session";

/**
 * Unified OTP & abuse-control hub. Four tabs:
 *   1. Verification logs — every code request, with filters and a search box.
 *   2. Phone bans         — manual + auto bans, listed in a single table.
 *   3. Auto-ban settings  — threshold rule editor; controls server-side
 *                            evaluator that auto-creates phone_bans rows.
 *   4. Session timing     — customer pickup idle-lock + TOTP visibility cap.
 */
export function OtpLogsClient({
  rows,
  total,
  stats,
  bans,
  products,
  autoBan,
  session,
}: {
  rows: OtpLogRow[];
  total: number;
  stats: OtpLogStats;
  bans: PhoneBan[];
  products: { id: string; name: string }[];
  autoBan: AutoBanSettings;
  session: PickupSessionSettings;
}) {
  const [tab, setTab] = useState<Tab>("logs");

  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex justify-center w-full">
        <Tabs
          active={tab}
          onChange={setTab}
          counts={{
            bans: bans.filter((b) => b.active).length,
            autoOn: autoBan.enabled,
          }}
        />
      </div>

      <div className="flex-1">
        {tab === "logs" && <LogsTab rows={rows} total={total} stats={stats} />}
        {tab === "bans" && <BansTab bans={bans} products={products} />}
        {tab === "auto" && (
          <div className="w-full flex justify-center">
            <div className="w-full max-w-3xl">
              <AutoBanTab initial={autoBan} />
            </div>
          </div>
        )}
        {tab === "session" && (
          <div className="w-full flex justify-center">
            <div className="w-full max-w-3xl">
              <SessionTab initial={session} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Tabs({
  active,
  onChange,
  counts,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  counts: { bans: number; autoOn: boolean };
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-surface-2 border border-[hsl(var(--hairline))] overflow-x-auto max-w-full">
      <TabButton
        icon={<FileClock className="size-3.5" />}
        label="سجل التحقق"
        active={active === "logs"}
        onClick={() => onChange("logs")}
      />
      <TabButton
        icon={<ShieldBan className="size-3.5" />}
        label="حظر الأرقام"
        badge={counts.bans > 0 ? String(counts.bans) : undefined}
        active={active === "bans"}
        onClick={() => onChange("bans")}
      />
      <TabButton
        icon={<Sparkles className="size-3.5" />}
        label="الحظر التلقائي"
        badge={counts.autoOn ? "مفعّل" : undefined}
        badgeTone={counts.autoOn ? "ok" : "neutral"}
        active={active === "auto"}
        onClick={() => onChange("auto")}
      />
      <TabButton
        icon={<Timer className="size-3.5" />}
        label="إعدادات الجلسة"
        active={active === "session"}
        onClick={() => onChange("session")}
      />
    </div>
  );
}

function TabButton({
  icon,
  label,
  badge,
  badgeTone = "neutral",
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeTone?: "ok" | "neutral";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
        active
          ? "bg-fg text-bg shadow-sm"
          : "text-fg-muted hover:text-fg hover:bg-surface"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span
          className={`inline-flex items-center h-5 px-1.5 rounded-full text-[10px] font-extrabold ${
            badgeTone === "ok"
              ? "bg-accent text-accent-fg"
              : active
                ? "bg-bg/15 text-current"
                : "bg-surface-2 text-fg-muted border border-[hsl(var(--hairline-strong))]"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
