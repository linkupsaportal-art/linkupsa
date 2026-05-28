"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/admin/profile/section-card";
import { changePasswordAction } from "@/app/admin/profile/actions";

const schema = z
  .object({
    currentPassword: z.string().min(1, "أدخل كلمة المرور الحالية"),
    newPassword: z.string().min(8, "كلمة المرور لا تقل عن 8 خانات"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "كلمتا المرور غير متطابقتين",
  });
type FormValues = z.infer<typeof schema>;

export function PasswordCard() {
  const [pending, startTransition] = useTransition();
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPwd = watch("newPassword") ?? "";
  const strength = computeStrength(newPwd);

  function onSubmit(values: FormValues) {
    setServerError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await changePasswordAction(values);
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <SectionCard
        icon={KeyRound}
        title="كلمة المرور"
        description="ننصح باستخدام كلمة مرور قوية لا تستخدمها في أي موقع آخر."
        footer={
          <>
            {serverError && (
              <p className="me-auto inline-flex items-center gap-1.5 text-xs font-semibold text-danger">
                <AlertCircle className="size-3.5" />
                {serverError}
              </p>
            )}
            {success && !serverError && (
              <p className="me-auto inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                <Check className="size-3.5" />
                تم تحديث كلمة المرور
              </p>
            )}
            <Button type="submit" variant="primary" size="sm" disabled={pending || !isDirty}>
              {pending ? "جاري الحفظ…" : "تحديث كلمة المرور"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="currentPassword" className="block mb-1.5">
              كلمة المرور الحالية
            </Label>
            <Input
              id="currentPassword"
              inputSize="lg"
              type={showPwd.current ? "text" : "password"}
              autoComplete="current-password"
              startAdornment={<KeyRound className="size-4" />}
              endAdornment={
                <ToggleEye
                  shown={showPwd.current}
                  onToggle={() => setShowPwd((v) => ({ ...v, current: !v.current }))}
                />
              }
              invalid={!!errors.currentPassword}
              disabled={pending}
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p className="mt-1.5 text-xs text-danger">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="newPassword" className="block mb-1.5">
              كلمة المرور الجديدة
            </Label>
            <Input
              id="newPassword"
              inputSize="lg"
              type={showPwd.new ? "text" : "password"}
              autoComplete="new-password"
              placeholder="٨ خانات على الأقل"
              startAdornment={<KeyRound className="size-4" />}
              endAdornment={
                <ToggleEye
                  shown={showPwd.new}
                  onToggle={() => setShowPwd((v) => ({ ...v, new: !v.new }))}
                />
              }
              invalid={!!errors.newPassword}
              disabled={pending}
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="mt-1.5 text-xs text-danger">{errors.newPassword.message}</p>
            )}
            {newPwd.length > 0 && (
              <StrengthBar strength={strength} />
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="block mb-1.5">
              تأكيد كلمة المرور
            </Label>
            <Input
              id="confirmPassword"
              inputSize="lg"
              type={showPwd.confirm ? "text" : "password"}
              autoComplete="new-password"
              startAdornment={<KeyRound className="size-4" />}
              endAdornment={
                <ToggleEye
                  shown={showPwd.confirm}
                  onToggle={() => setShowPwd((v) => ({ ...v, confirm: !v.confirm }))}
                />
              }
              invalid={!!errors.confirmPassword}
              disabled={pending}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-danger">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>
      </SectionCard>
    </form>
  );
}

function ToggleEye({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      className="text-fg-faint hover:text-fg transition-colors"
    >
      {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

/** 0-4 strength based on length + mix of character classes. */
function computeStrength(pwd: string): { score: number; label: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const labels = ["ضعيف جداً", "ضعيف", "متوسط", "جيد", "قوي", "ممتاز"];
  return { score: Math.min(score, 5), label: labels[Math.min(score, 5)] };
}

function StrengthBar({ strength }: { strength: { score: number; label: string } }) {
  const colors = ["bg-danger", "bg-danger", "bg-warn", "bg-warn", "bg-success", "bg-success"];
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex-1 grid grid-cols-5 gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-colors ${
              i < strength.score ? colors[strength.score] : "bg-surface-2"
            }`}
          />
        ))}
      </div>
      <span className="text-[11px] font-bold text-fg-muted shrink-0">{strength.label}</span>
    </div>
  );
}
