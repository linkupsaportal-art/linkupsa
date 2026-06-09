"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send, Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updatePickupCustomizationSettingsAction } from "@/app/admin/settings/actions";
import type { PickupCustomizationSettings } from "@/lib/db/platform-settings";

export function PickupCustomizationForm({
  initialSettings,
}: {
  initialSettings: PickupCustomizationSettings;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [supportUrl, setSupportUrl] = useState(initialSettings.support_url);
  const [telegramUsername, setTelegramUsername] = useState(initialSettings.telegram_username);

  // Check if form values are dirty
  const isDirty =
    supportUrl !== initialSettings.support_url ||
    telegramUsername !== initialSettings.telegram_username;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSuccess(false);

    if (!supportUrl.trim()) {
      setServerError("رابط خدمة العملاء مطلوب");
      return;
    }

    startTransition(async () => {
      const res = await updatePickupCustomizationSettingsAction({
        support_url: supportUrl,
        telegram_username: telegramUsername,
      });

      if (!res.ok) {
        setServerError(res.error);
        return;
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => {
        setSuccess(false);
      }, 2500);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supportUrl" className="block mb-1.5 font-bold text-fg-muted">
            رابط خدمة العملاء (واتساب / تواصل)
          </Label>
          <Input
            id="supportUrl"
            type="url"
            inputSize="lg"
            startAdornment={<MessageSquare className="size-4" />}
            value={supportUrl}
            onChange={(e) => setSupportUrl(e.target.value)}
            disabled={pending}
            placeholder="مثال: https://wa.me/966555000000"
          />
          <p className="mt-1 text-[11px] text-fg-faint">
            الرابط الذي ينتقل إليه العميل عند الضغط على "التواصل مع خدمة العملاء" أسفل شاشة الاستلام.
          </p>
        </div>

        <div>
          <Label htmlFor="telegramUsername" className="block mb-1.5 font-bold text-fg-muted">
            معرف بوت تيليجرام البديل (اختياري)
          </Label>
          <Input
            id="telegramUsername"
            type="text"
            inputSize="lg"
            startAdornment={<Send className="size-4" />}
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value)}
            disabled={pending}
            placeholder="مثال: roxinetbot"
          />
          <p className="mt-1 text-[11px] text-fg-faint">
            اسم مستخدم بوت تيليجرام البديل للاستلام. اتركه فارغاً للاعتماد على إعدادات البوت الرسمية.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[hsl(var(--hairline))]">
        {serverError && (
          <p className="me-auto inline-flex items-center gap-1.5 text-xs font-semibold text-danger animate-in fade-in duration-200">
            <AlertCircle className="size-3.5" />
            {serverError}
          </p>
        )}
        {success && (
          <p className="me-auto inline-flex items-center gap-1.5 text-xs font-semibold text-success animate-in fade-in duration-200">
            <Check className="size-3.5" />
            تم حفظ الإعدادات
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={pending || !isDirty}
        >
          {pending ? "جاري الحفظ…" : "حفظ التغييرات"}
        </Button>
      </div>
    </form>
  );
}
