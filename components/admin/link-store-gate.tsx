"use client";

import * as React from "react";
import { Webhook, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
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
 * Now points to the webhook setup (integrations page) instead of the old
 * Salla OAuth flow.
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
              هذا القسم يُفتح بعد ربط متجرك عبر الويب هوك.
              اذهب لصفحة الربط لإعداد الويب هوك — العملية تأخذ أقل من دقيقة.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-1">
            <Link
              href="/admin/integrations"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-accent text-accent-fg text-sm font-extrabold hover:brightness-105 active:scale-[0.98] transition-all"
            >
              <Webhook className="size-4" strokeWidth={2.2} />
              إعداد الويب هوك
              <ArrowLeft className="size-4" strokeWidth={2.5} />
            </Link>
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
