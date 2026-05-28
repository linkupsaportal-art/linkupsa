"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { OAuthRow } from "@/components/auth/oauth-buttons";
import { AuthDivider } from "@/components/auth/auth-divider";

/**
 * Login page — Shopify-style minimal form, RTL Arabic.
 *
 * Flow:
 *   - OAuth row at the top (the modern preference for sign-in surfaces)
 *   - Hairline divider with "أو"
 *   - Email + password (with show/hide toggle) + remember + forgot link
 *   - Submit button (loading state with spinner)
 *   - Footer: "ليس لديك حساب؟ إنشاء حساب"
 */

const schema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور لا تقل عن 8 خانات"),
  remember: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  function onSubmit(_values: FormValues) {
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 900); // wire to API later
  }

  return (
    <>
      <header className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-fg-subtle hover:text-fg transition-colors mb-6"
        >
          <ArrowLeft className="size-3.5 rotate-180" />
          العودة للموقع
        </Link>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          أهلاً بعودتك
        </h1>
        <p className="mt-2 text-sm text-fg-muted leading-relaxed">
          سجّل دخولك لمتابعة طلبات متجرك ومنتجاتك.
        </p>
      </header>

      <OAuthRow disabled={submitting} />
      <AuthDivider />

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <Label htmlFor="email" className="block mb-1.5">
            البريد الإلكتروني
          </Label>
          <Input
            id="email"
            inputSize="lg"
            type="email"
            autoComplete="email"
            placeholder="you@store.sa"
            startAdornment={<Mail className="size-4" />}
            invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password">كلمة المرور</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-accent hover:underline underline-offset-4"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
          <Input
            id="password"
            inputSize="lg"
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            placeholder="٨ خانات على الأقل"
            startAdornment={<Lock className="size-4" />}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                className="text-fg-faint hover:text-fg transition-colors"
              >
                {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
            invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-danger">{errors.password.message}</p>
          )}
        </div>

        <Checkbox label="ابقني مسجَّلاً" {...register("remember")} />

        <button
          type="submit"
          disabled={submitting}
          className="group/btn relative w-full overflow-hidden rounded-md h-12 px-6 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest bg-accent text-accent-fg hover:bg-accent-hi transition-colors shadow-[0_8px_28px_-8px_hsl(var(--accent)/0.6)] disabled:opacity-60 disabled:pointer-events-none"
        >
          <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-l from-transparent via-white/25 to-transparent" />
          <span className="relative z-10 flex items-center gap-2">
            {submitting ? (
              <>
                <span className="size-3 rounded-full border-2 border-accent-fg border-t-transparent animate-spin" />
                جاري الدخول…
              </>
            ) : (
              <>تسجيل الدخول</>
            )}
          </span>
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-fg-muted">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="text-accent font-semibold hover:underline underline-offset-4">
          إنشاء حساب جديد
        </Link>
      </p>
    </>
  );
}
