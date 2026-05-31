"use client";

import { useState, useTransition } from "react";
import {
  Users, Shield, UserCircle2, Mail, UserPlus, Trash2, ChevronDown, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from "@/lib/auth/rbac";
import {
  setStaffRoleAction,
  inviteStaffAction,
  removeStaffAction,
} from "@/app/admin/staff/actions";

export type StaffMember = {
  id: string;
  email: string;
  name: string;
  role: Role;
  has2fa: boolean;
  isSelf: boolean;
};

/**
 * Staff manager — manager-only controls for assigning roles, inviting new
 * staff, and removing members. Read-only for non-managers (they only reach
 * this page if the route map allowed it, which currently it doesn't, but the
 * component degrades gracefully either way).
 *
 * Visual language matches the rest of the admin: surface cards, hairline
 * borders, lime accent, RTL.
 */
export function StaffManager({
  members,
  canManage,
}: {
  members: StaffMember[];
  canManage: boolean;
}) {
  return (
    <div className="space-y-5">
      {canManage && <InviteCard />}

      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5">
        <div className="flex items-start gap-3 mb-4 pb-4 border-b border-[hsl(var(--hairline))]">
          <div className="size-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Users className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-fg">المستخدمون النشطون</h3>
            <p className="text-xs text-fg-muted mt-0.5">
              إجمالي:{" "}
              <span className="font-num font-bold text-fg">{members.length}</span> مستخدم
            </p>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="text-sm text-fg-muted text-center py-6">لا يوجد مستخدمون مسجلون.</div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <StaffRow key={m.id} member={m} canManage={canManage} />
            ))}
          </div>
        )}
      </div>

      {/* Role reference legend */}
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5">
        <h3 className="font-bold text-fg mb-3">الأدوار والصلاحيات</h3>
        <ul className="space-y-2.5">
          {ROLES.map((role) => (
            <li key={role} className="flex items-start gap-3">
              <span
                className={cn(
                  "inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-bold shrink-0 mt-0.5",
                  ROLE_PILL[role],
                )}
              >
                {ROLE_LABELS[role]}
              </span>
              <p className="text-xs text-fg-muted leading-relaxed flex-1">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const ROLE_PILL: Record<Role, string> = {
  manager: "bg-fg text-bg",
  supervisor: "bg-accent/15 text-accent border border-accent/25",
  support: "bg-fg/10 text-fg border border-fg/20",
  code_limit: "bg-warn/15 text-warn border border-warn/25",
};

function StaffRow({ member, canManage }: { member: StaffMember; canManage: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function changeRole(role: Role) {
    setMenuOpen(false);
    if (role === member.role) return;
    setError(null);
    startTransition(async () => {
      const res = await setStaffRoleAction({ userId: member.id, role });
      if (!res.ok) setError(res.error);
    });
  }

  function remove() {
    if (!confirm(`حذف ${member.name}؟ لا يمكن التراجع.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await removeStaffAction({ userId: member.id });
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))]">
      <div className="flex items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-full bg-surface flex items-center justify-center shrink-0">
            <UserCircle2 className="size-5 text-fg-muted" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-fg truncate flex items-center gap-2">
              {member.name}
              {member.isSelf && (
                <span className="text-[10px] font-semibold text-fg-faint">(أنت)</span>
              )}
            </div>
            <div className="text-[11px] text-fg-muted flex items-center gap-1 font-num" dir="ltr">
              <Mail className="size-3" />
              {member.email}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {member.has2fa && (
            <span
              className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/25"
              title="2FA مفعّل"
            >
              <Shield className="size-2.5" />
              2FA
            </span>
          )}

          {/* Role control — dropdown for managers, static pill otherwise. */}
          {canManage && !member.isSelf ? (
            <div className="relative">
              <button
                type="button"
                disabled={pending}
                onClick={() => setMenuOpen((o) => !o)}
                className={cn(
                  "inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-bold transition-colors",
                  ROLE_PILL[member.role],
                  "hover:opacity-90 disabled:opacity-50",
                )}
              >
                {pending ? <Loader2 className="size-3 animate-spin" /> : null}
                {ROLE_LABELS[member.role]}
                <ChevronDown className="size-3" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden
                  />
                  <div className="absolute end-0 mt-1 z-20 w-44 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] shadow-lg p-1">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => changeRole(r)}
                        className={cn(
                          "w-full text-start px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between",
                          r === member.role
                            ? "bg-surface-2 text-fg"
                            : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                        )}
                      >
                        {ROLE_LABELS[r]}
                        {r === member.role && (
                          <span className="size-1.5 rounded-full bg-accent" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <span
              className={cn(
                "inline-flex items-center h-5 px-2 rounded-full text-[10px] font-bold",
                ROLE_PILL[member.role],
              )}
            >
              {ROLE_LABELS[member.role]}
            </span>
          )}

          {canManage && !member.isSelf && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              aria-label="حذف"
              className="grid place-items-center size-7 rounded-full text-fg-faint hover:bg-danger/10 hover:text-danger transition-colors disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="px-3 pb-2.5 -mt-1 text-[11px] text-danger">{error}</p>
      )}
    </div>
  );
}

function InviteCard() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("support");

  function submit() {
    setMsg(null);
    startTransition(async () => {
      const res = await inviteStaffAction({ email, role });
      if (res.ok) {
        setMsg({ kind: "ok", text: res.message ?? "تم الإرسال." });
        setEmail("");
        setRole("support");
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="size-10 rounded-xl bg-fg/5 text-fg flex items-center justify-center shrink-0">
          <UserPlus className="size-5" />
        </div>
        <div>
          <h3 className="font-bold text-fg">دعوة موظف</h3>
          <p className="text-xs text-fg-muted mt-0.5">
            يجب أن يملك الموظف حساباً على المنصة. يصله إشعار + بريد، وتُفعّل صلاحياته فوراً.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Field label="بريد الموظف (حساب مسجّل)">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@example.com"
            dir="ltr"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="الدور">
          <div className="flex flex-wrap gap-2">
            {ROLES.filter((r) => r !== "manager").map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "h-9 px-3 rounded-full text-xs font-bold border transition-colors",
                  role === r
                    ? "bg-fg text-bg border-fg"
                    : "bg-surface text-fg-muted border-[hsl(var(--hairline-strong))] hover:text-fg",
                )}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !email}
          className={cn(
            "inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-bold transition-all",
            "bg-fg text-bg hover:bg-[hsl(var(--surface-4))] active:scale-[0.98] disabled:opacity-50",
          )}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4 text-accent" />}
          إرسال الدعوة
        </button>
        {msg && (
          <span className={cn("text-xs font-semibold", msg.kind === "ok" ? "text-success" : "text-danger")}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}

const inputCls = cn(
  "w-full h-10 px-3 rounded-xl border border-[hsl(var(--hairline-strong))] bg-surface text-sm text-fg",
  "placeholder:text-fg-faint focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg",
);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-fg-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}
