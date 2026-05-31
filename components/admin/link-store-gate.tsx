"use client";

import * as React from "react";
import { Store, ArrowLeft, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

/**
 * Link-store gate — a tiny context that any locked control (sidebar item,
 * topbar CTA, search box) can call to surface a single shared dialog telling
 * the user they must connect their store before that section unlocks.
 *
 * Why a context instead of prop-drilling callbacks: the locked shell renders
 * the sidebar, the topbar, AND the mobile drawer's sidebar. Threading an
 * `onLocked` callback through all three (plus their nested item components)
 * is noisy. A no-op-safe context keeps the call site a one-liner:
 *
 *     const { requestLink } = useLinkStoreGate();
 *     <button onClick={requestLink}>…</button>
 *
 * The hook is safe to call even when no provider is mounted (the normal
 * member shell) — it returns a no-op so shared components don't need to know
 * whether they're locked.
 */
type LinkStoreGateCtx = {
  /** Open the "connect your store first" dialog. */
  requestLink: () => void;
};

const Ctx = React.createContext<LinkStoreGateCtx>({ requestLink: () => {} });

export function useLinkStoreGate(): LinkStoreGateCtx {
  return React.useContext(Ctx);
}

export function LinkStoreGateProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  const value = React.useMemo<LinkStoreGateCtx>(
    () => ({ requestLink: () => setOpen(true) }),
    [],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="grid place-items-center size-12 rounded-2xl bg-[hsl(60_14%_94%)] mb-1.5">
              <Lock className="size-5 text-[hsl(222_30%_6%)]" strokeWidth={2} />
            </div>
            <DialogTitle>اربط متجرك أولاً</DialogTitle>
            <DialogDescription>
              هذا القسم يُفتح بعد ربط متجرك بتطبيق LinkUp. تستغرق العملية أقل من
              دقيقة، وبعدها تظهر طلباتك ومنتجاتك وكل الأقسام تلقائياً.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-1">
            <a
              href="/api/salla/oauth/start"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-accent text-accent-fg text-sm font-extrabold hover:brightness-105 active:scale-[0.98] transition-all"
            >
              <Store className="size-4" strokeWidth={2.2} />
              ربط المتجر الآن
              <ArrowLeft className="size-4" strokeWidth={2.5} />
            </a>
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center h-11 px-5 rounded-full text-sm font-bold text-fg-muted hover:bg-fg/5 transition-colors"
              >
                لاحقاً
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}
