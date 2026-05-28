"use client";

import { useState } from "react";
import { ChevronDown, Plus, Check, Store as StoreIcon, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Store switcher dropdown for the admin topbar.
 *
 * - UI-only for now (no DB). Stores are demo seed data so the dropdown clicks
 *   feel real. The "Create new store" button opens a dialog that just shows a
 *   "قريباً" notice — backend will be wired in the next milestone.
 */

type Store = {
  id: string;
  name: string;
  slug: string;
};

const DEMO_STORES: Store[] = [
  { id: "1", name: "Spektrum Store", slug: "spektrum" },
  { id: "2", name: "Other Store", slug: "other" },
];

export function StoreSwitcher() {
  const [active, setActive] = useState(DEMO_STORES[0]);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "group inline-flex items-center gap-2.5 rounded-full bg-surface border border-[hsl(var(--hairline-strong))] px-3 py-1.5",
              "hover:bg-surface-2 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg",
            )}
          >
            <span className="grid place-items-center size-7 rounded-full bg-fg text-bg">
              <StoreIcon className="size-3.5" />
            </span>
            <span className="text-sm font-semibold leading-none truncate max-w-[140px] text-fg">
              {active.name}
            </span>
            <ChevronDown className="size-3.5 text-fg-faint group-data-[state=open]:rotate-180 transition-transform" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel>متاجرك</DropdownMenuLabel>
          {DEMO_STORES.map((store) => {
            const isActive = store.id === active.id;
            return (
              <DropdownMenuItem
                key={store.id}
                onClick={() => setActive(store)}
                className="gap-3 py-2.5"
              >
                <span className="grid place-items-center size-9 rounded-xl bg-[hsl(60_14%_94%)] text-[hsl(222_30%_6%)] shrink-0">
                  <StoreIcon className="size-4" strokeWidth={1.7} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-[hsl(222_30%_6%)] truncate">
                    {store.name}
                  </span>
                  <span className="block text-[11px] text-[hsl(220_8%_52%)] font-mono truncate mt-0.5" dir="ltr">
                    {store.slug}.linkup.sa
                  </span>
                </span>
                {isActive && (
                  <span className="grid place-items-center size-6 rounded-full pill-accent shrink-0">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateOpen(true)}
            className="gap-3 py-2.5 font-semibold text-[hsl(222_30%_6%)]"
          >
            <span className="grid place-items-center size-9 rounded-xl pill-accent shrink-0">
              <Plus className="size-4" strokeWidth={2.5} />
            </span>
            متجر جديد
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateStoreDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function CreateStoreDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Header — icon chip + title + description */}
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="grid place-items-center size-10 rounded-2xl bg-fg text-bg shrink-0">
              <StoreIcon className="size-4" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1 me-7">
              <DialogTitle>إنشاء متجر جديد</DialogTitle>
              <DialogDescription className="mt-1">
                كل متجر يحصل على نطاق فرعي مستقل ولوحة تحكم منفصلة.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-1.5">
            <Label htmlFor="store-name">اسم المتجر</Label>
            <Input
              id="store-name"
              inputSize="lg"
              placeholder="متجري الجديد"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="store-slug">النطاق الفرعي</Label>
            <Input
              id="store-slug"
              inputSize="lg"
              placeholder="my-store"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              dir="ltr"
              endAdornment={
                <span className="text-xs text-[hsl(220_8%_52%)] font-mono whitespace-nowrap">
                  .linkup.sa
                </span>
              }
            />
            <p className="text-xs text-[hsl(220_10%_48%)]">
              الأحرف الإنجليزية الصغيرة والأرقام والشرطة. مثال:{" "}
              <span dir="ltr" className="font-mono font-bold text-[hsl(222_30%_6%)]">my-store</span>
            </p>
          </div>

          {/* Slug preview */}
          {slug && (
            <div className="rounded-xl bg-[hsl(60_14%_94%)] px-3 py-2.5 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[hsl(220_8%_52%)]">
                المعاينة
              </span>
              <span
                className="ms-auto font-mono text-sm font-bold text-[hsl(222_30%_6%)] truncate"
                dir="ltr"
              >
                {slug}.linkup.sa
              </span>
            </div>
          )}

          {/* "Coming soon" notice — lime-tinted instead of warn-yellow */}
          <div className="rounded-xl bg-accent/15 border border-accent/40 px-3.5 py-3 flex items-start gap-2.5">
            <span className="grid place-items-center size-7 rounded-full pill-accent shrink-0 mt-0.5">
              <Sparkles className="size-3.5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[hsl(222_30%_6%)]">قريباً</p>
              <p className="text-[11px] text-[hsl(220_16%_26%)] leading-relaxed mt-0.5">
                حالياً للعرض فقط. سيتم تفعيل إنشاء المتاجر في التحديث القادم.
              </p>
            </div>
          </div>
        </form>

        <DialogFooter className="mt-1">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button variant="primary" disabled>
            <Plus className="size-4" />
            إنشاء المتجر
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
