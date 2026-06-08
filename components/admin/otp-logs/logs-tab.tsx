"use client";

import { useState, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  Globe,
  RefreshCw,
  FileClock,
  Search,
} from "lucide-react";
import type { OtpLogRow, OtpLogStats, OtpResult } from "@/lib/db/otp-logs";

const RESULT_LABELS: Record<string, { label: string; tone: "ok" | "warn" | "bad" }> = {
  success: { label: "نجح", tone: "ok" },
  limit_exceeded: { label: "تجاوز الحد", tone: "bad" },
  phone_mismatch: { label: "رقم خاطئ", tone: "bad" },
  cooldown: { label: "انتظار", tone: "warn" },
  totp_error: { label: "خطأ توليد", tone: "bad" },
  order_not_found: { label: "طلب غير موجود", tone: "bad" },
};

const TONE_CLASS = {
  ok: "bg-accent/15 text-black border-accent/25",
  warn: "bg-yellow-500/15 text-black border-yellow-500/25",
  bad: "bg-red-500/15 text-red-400 border-red-500/25",
} as const;

function formatMobile(mobile: string | null) {
  if (!mobile) return <span className="text-fg-faint text-sm">—</span>;
  if (mobile.length <= 4) {
    return (
      <span className="font-mono text-xs text-fg font-bold" dir="ltr">
        {mobile}
      </span>
    );
  }
  const mainPart = mobile.slice(0, -4);
  const boldPart = mobile.slice(-4);
  return (
    <span className="font-mono text-xs text-fg-muted" dir="ltr">
      {mainPart}<strong className="text-fg font-extrabold">{boldPart}</strong>
    </span>
  );
}

export function LogsTab({
  rows,
  total,
  stats,
}: {
  rows: OtpLogRow[];
  total: number;
  stats: OtpLogStats;
}) {
  const [filter, setFilter] = useState<OtpResult | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let r = rows;
    if (filter !== "all") r = r.filter((x) => x.result === filter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      r = r.filter(
        (x) =>
          String(x.order_reference ?? "").includes(q) ||
          x.customer_name?.toLowerCase().includes(q) ||
          x.customer_mobile?.includes(q) ||
          x.account_label?.toLowerCase().includes(q) ||
          x.ip_address?.includes(q),
      );
    }
    return r;
  }, [rows, filter, search]);

  return (
    <div className="space-y-5">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Activity} label="إجمالي خلال 30 يوم" value={stats.total} tone="neutral" />
        <Stat icon={ShieldCheck} label="نجاح" value={stats.success} tone="ok" />
        <Stat icon={ShieldAlert} label="فشل / محاولات" value={stats.failures} tone="bad" />
        <Stat icon={Globe} label="عناوين IP فريدة" value={stats.uniqueIps} tone="neutral" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <FilterTab label="الكل" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterTab label="نجاح" active={filter === "success"} onClick={() => setFilter("success")} />
          <FilterTab label="تجاوز الحد" active={filter === "limit_exceeded"} onClick={() => setFilter("limit_exceeded")} />
          <FilterTab label="رقم خاطئ" active={filter === "phone_mismatch"} onClick={() => setFilter("phone_mismatch")} />
          <FilterTab label="انتظار" active={filter === "cooldown"} onClick={() => setFilter("cooldown")} />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-fg-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الطلب أو IP أو الاسم..."
              className="h-9 ps-3 pe-9 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-sm w-64 focus:outline-none focus:border-accent/60"
            />
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            تحديث
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[850px] border-collapse">
              <thead className="bg-surface-2 border-b border-[hsl(var(--hairline))]">
                <tr className="text-[10px] font-bold tracking-widest text-fg-muted uppercase">
                  <th className="text-start px-4 py-3.5 font-bold w-[12%]">النتيجة</th>
                  <th className="text-start px-4 py-3.5 font-bold w-[12%]">#الطلب</th>
                  <th className="text-start px-4 py-3.5 font-bold w-[20%]">العميل</th>
                  <th className="text-start px-4 py-3.5 font-bold w-[16%]">رقم الجوال</th>
                  <th className="text-start px-4 py-3.5 font-bold w-[18%]">الحساب</th>
                  <th className="text-start px-4 py-3.5 font-bold w-[12%]">عنوان IP</th>
                  <th className="text-start px-4 py-3.5 font-bold w-[10%]">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--hairline))]">
                {filtered.map((row) => {
                  const meta = RESULT_LABELS[row.result] ?? { label: row.result, tone: "warn" as const };
                  const dotColor = {
                    ok: "bg-accent",
                    warn: "bg-yellow-400",
                    bad: "bg-red-400",
                  } as const;
                  return (
                    <tr key={row.id} className="hover:bg-surface-2/70 transition-colors">
                      <td className="px-4 py-4 align-middle">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-lg text-[10px] font-bold border transition-colors ${TONE_CLASS[meta.tone]}`}>
                            <span className={`size-1.5 rounded-full ${dotColor[meta.tone]} ${meta.tone === "ok" ? "animate-pulse" : ""}`} />
                            {meta.label}
                          </span>
                          {row.error_detail && (
                            <span className="text-[10px] text-red-400/80 max-w-[140px] truncate block" title={row.error_detail}>
                              {row.error_detail}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        {row.order_reference ? (
                          <span className="font-mono font-bold text-xs text-fg tracking-tight bg-accent/5 border border-accent/15 px-2.5 py-1 rounded-xl shadow-sm">
                            #{row.order_reference}
                          </span>
                        ) : (
                          <span className="text-fg-faint text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span className="text-sm font-semibold text-fg truncate block" title={row.customer_name ?? undefined}>
                          {row.customer_name ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle">{formatMobile(row.customer_mobile)}</td>
                      <td className="px-4 py-4 align-middle">
                        <div className="flex flex-col gap-0.5">
                          {row.account_label ? (
                            <span className="text-sm font-semibold text-fg truncate" title={row.account_label}>
                              {row.account_label}
                            </span>
                          ) : (
                            <span className="text-fg-faint text-sm">—</span>
                          )}
                          {row.product_name && (
                            <span className="text-[11px] font-semibold text-fg-muted truncate" title={row.product_name}>
                              {row.product_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        {row.ip_address ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-fg-muted bg-surface-2 border border-[hsl(var(--hairline-strong))] px-2.5 py-1 rounded-xl shadow-sm">
                            <Globe className="size-3 text-fg-faint" />
                            {row.ip_address}
                          </span>
                        ) : (
                          <span className="text-fg-faint text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span className="font-mono text-[11px] text-fg-muted block" dir="ltr">
                          {new Date(row.requested_at).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          }).replace(/\//g, "-")}
                        </span>
                        <span className="font-mono text-[10px] text-fg-faint block mt-0.5" dir="ltr">
                          {new Date(row.requested_at).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[hsl(var(--hairline))] px-4 py-2.5 text-xs text-fg-muted bg-surface-2 flex items-center justify-between">
            <div>
              عرض <span className="font-num font-semibold text-fg">{filtered.length}</span> من إجمالي{" "}
              <span className="font-num font-semibold text-fg">{total}</span> سجل
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof FileClock;
  label: string;
  value: number;
  tone: "ok" | "bad" | "neutral";
}) {
  const colors = {
    ok: "bg-accent/10 text-accent",
    bad: "bg-red-500/10 text-red-400",
    neutral: "bg-surface-2 text-fg-muted",
  } as const;
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-fg-faint">{label}</span>
        <div className={`size-7 rounded-lg flex items-center justify-center ${colors[tone]}`}>
          <Icon className="size-3.5" />
        </div>
      </div>
      <div className="font-num font-extrabold text-2xl text-fg">{value}</div>
    </div>
  );
}

function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center h-9 px-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
        active
          ? "bg-fg text-bg"
          : "bg-surface text-fg-muted hover:text-fg hover:bg-surface-2 border border-[hsl(var(--hairline-strong))]"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-12 text-center">
      <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-2 mb-4">
        <FileClock className="size-6 text-fg-muted" />
      </div>
      <h3 className="font-semibold text-fg mb-1">لا توجد سجلات</h3>
      <p className="text-sm text-fg-muted">ستظهر سجلات الأكواد هنا تلقائياً عند طلب الكود من صفحة الاستلام.</p>
    </div>
  );
}
