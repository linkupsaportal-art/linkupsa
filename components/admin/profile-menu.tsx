"use client";

import Link from "next/link";
import {
  LogOut, User as UserIcon, Settings, BellRing, CreditCard, ChevronLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOutAction } from "@/app/(auth)/actions";

/**
 * Profile dropdown — modern lime-themed design.
 *
 * Anatomy:
 *   - Trigger: avatar with lime ring on hover
 *   - Header card: avatar + name + email
 *   - Menu items: profile · settings · notifications · billing
 *   - Logout pinned to the bottom in danger color
 */
export function ProfileMenu({
  userEmail,
  userName,
  avatarUrl,
}: {
  userEmail?: string;
  userName?: string;
  avatarUrl?: string | null;
}) {
  const initial = (userName?.[0] ?? userEmail?.[0] ?? "U").toUpperCase();
  const displayName = userName ?? "حسابي";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="حسابي"
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg hover:ring-2 hover:ring-accent/40 transition-all"
        >
          <Avatar className="size-10 ring-2 ring-[hsl(220_18%_14%/0.08)]">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-[hsl(222_30%_6%)] text-[hsl(60_18%_95%)] font-bold text-sm">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        {/* Header card — dark surface with lime corner accent */}
        <div className="relative overflow-hidden rounded-xl bg-[hsl(222_22%_9%)] p-3 mb-1.5">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-8 -end-8 size-24 rounded-full opacity-50 blur-2xl"
            style={{ background: "radial-gradient(circle, hsl(72 86% 62% / 0.55), transparent 70%)" }}
          />
          <div className="relative flex items-center gap-3">
            <Avatar className="size-11 ring-2 ring-white/10 shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="bg-white/10 text-white font-bold text-sm">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{displayName}</p>
              <p className="text-[11px] text-white/55 font-mono truncate mt-0.5" dir="ltr">
                {userEmail ?? ""}
              </p>
            </div>
          </div>
        </div>

        <DropdownMenuItem asChild>
          <Link href="/admin/profile" className="gap-3 py-2.5">
            <span className="grid place-items-center size-9 rounded-xl bg-[hsl(60_14%_94%)] text-[hsl(222_30%_6%)] shrink-0">
              <UserIcon className="size-4" strokeWidth={1.7} />
            </span>
            <span className="flex-1 text-sm font-semibold text-[hsl(222_30%_6%)]">
              الملف الشخصي
            </span>
            <ChevronLeft className="size-4 text-[hsl(220_8%_52%)] shrink-0" />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/admin/settings" className="gap-3 py-2.5">
            <span className="grid place-items-center size-9 rounded-xl bg-[hsl(60_14%_94%)] text-[hsl(222_30%_6%)] shrink-0">
              <Settings className="size-4" strokeWidth={1.7} />
            </span>
            <span className="flex-1 text-sm font-semibold text-[hsl(222_30%_6%)]">
              إعدادات المتجر
            </span>
            <ChevronLeft className="size-4 text-[hsl(220_8%_52%)] shrink-0" />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/admin/notifications" className="gap-3 py-2.5">
            <span className="grid place-items-center size-9 rounded-xl bg-[hsl(60_14%_94%)] text-[hsl(222_30%_6%)] shrink-0">
              <BellRing className="size-4" strokeWidth={1.7} />
            </span>
            <span className="flex-1 text-sm font-semibold text-[hsl(222_30%_6%)]">
              الإشعارات
            </span>
            <ChevronLeft className="size-4 text-[hsl(220_8%_52%)] shrink-0" />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/admin/billing" className="gap-3 py-2.5">
            <span className="grid place-items-center size-9 rounded-xl bg-[hsl(60_14%_94%)] text-[hsl(222_30%_6%)] shrink-0">
              <CreditCard className="size-4" strokeWidth={1.7} />
            </span>
            <span className="flex-1 text-sm font-semibold text-[hsl(222_30%_6%)]">
              الفوترة والاشتراك
            </span>
            <ChevronLeft className="size-4 text-[hsl(220_8%_52%)] shrink-0" />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-semibold text-[hsl(0_75%_46%)] hover:bg-[hsl(0_75%_56%/0.08)] transition-colors"
          >
            <span className="grid place-items-center size-9 rounded-xl bg-[hsl(0_75%_56%/0.1)] text-[hsl(0_75%_46%)] shrink-0">
              <LogOut className="size-4" strokeWidth={1.7} />
            </span>
            تسجيل الخروج
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
