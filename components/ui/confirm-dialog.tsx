"use client";

import * as React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Themed confirmation modal — replaces the native window.confirm().
 *
 * Controlled component: parent owns `open`. Calls `onConfirm` (which may be
 * async) and shows a spinner until it resolves, then closes. `tone` switches
 * the confirm button between neutral and destructive styling.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <ConfirmDialog
 *     open={open} onOpenChange={setOpen}
 *     title="حذف الموظف؟" description="لا يمكن التراجع."
 *     confirmLabel="حذف" tone="danger"
 *     onConfirm={async () => { await doDelete(); }}
 *   />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  tone = "default",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void | Promise<void>;
}) {
  const [busy, setBusy] = React.useState(false);

  async function confirm() {
    try {
      setBusy(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {tone === "danger" && (
              <span className="grid place-items-center size-10 rounded-2xl bg-danger/10 text-danger shrink-0">
                <AlertTriangle className="size-5" />
              </span>
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="mt-1">{description}</DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="mt-2">
          <button
            type="button"
            onClick={() => confirm()}
            disabled={busy}
            className={cn(
              "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60",
              tone === "danger"
                ? "bg-danger text-white hover:bg-danger/90"
                : "bg-fg text-bg hover:bg-[hsl(var(--surface-4))]",
            )}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="inline-flex items-center justify-center h-10 px-5 rounded-full text-sm font-semibold text-fg-muted hover:text-fg hover:bg-[hsl(60_14%_94%)] transition-colors disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
