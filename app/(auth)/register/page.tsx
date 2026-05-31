"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import type { CountryIso2 } from "react-international-phone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import { registerAction } from "@/app/(auth)/actions";

const E164 = /^\+[1-9]\d{6,17}$/;

const schema = z.object({
  name: z.string().min(2, "الاسم قصير"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور لا تقل عن 8 خانات"),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || E164.test(v), "رقم الجوال غير صالح"),
  phoneCountry: z.string().trim().toLowerCase().length(2).or(z.literal("")),
  agree: z.boolean().refine((v) => v === true, {
    message: "يجب الموافقة على الشروط للمتابعة",
  }),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", phone: "", phoneCountry: "sa", agree: false },
  });

  function onSubmit(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await registerAction(values);
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      router.replace(`/verify-email?email=${encodeURIComponent(res.email)}`);
    });
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
          إنشاء حساب جديد
        </h1>
        <p className="mt-2 text-sm text-fg-muted leading-relaxed">
          ابدأ بتسليم منتجاتك الرقمية تلقائياً خلال دقائق.
        </p>
      </header>

      {serverError && (
        <div className="mb-5 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name" className="block mb-1.5">
            الاسم الكامل
          </Label>
          <Input
            id="name"
            inputSize="lg"
            autoComplete="name"
            placeholder="عبدالله الراشد"
            startAdornment={<User className="size-4" />}
            invalid={!!errors.name}
            disabled={pending}
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p>
          )}
        </div>

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
            disabled={pending}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="block mb-1.5">
            رقم الجوال <span className="text-fg-faint font-normal">(اختياري)</span>
          </Label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Controller
                name="phoneCountry"
                control={control}
                render={({ field: countryField }) => (
                  <PhoneInput
                    id="phone"
                    value={field.value}
                    onChange={(v, meta) => {
                      field.onChange(v);
                      countryField.onChange(meta.country);
                    }}
                    defaultCountry={
                      ((countryField.value || "sa").toLowerCase() as CountryIso2)
                    }
                    disabled={pending}
                    invalid={!!errors.phone}
                    placeholder="5X XXX XXXX"
                  />
                )}
              />
            )}
          />
          {errors.phone && (
            <p className="mt-1.5 text-xs text-danger">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="block mb-1.5">
            كلمة المرور
          </Label>
          <Input
            id="password"
            inputSize="lg"
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
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
            disabled={pending}
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-danger">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Checkbox
            id="agree"
            disabled={pending}
            label={
              <>
                أوافق على{" "}
                <Link href="/terms" className="text-accent hover:underline underline-offset-4">
                  الشروط
                </Link>{" "}
                و{" "}
                <Link href="/privacy" className="text-accent hover:underline underline-offset-4">
                  سياسة الخصوصية
                </Link>
              </>
            }
            {...register("agree")}
          />
          {errors.agree && (
            <p className="mt-1.5 text-xs text-danger">{errors.agree.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="group/btn relative w-full overflow-hidden rounded-md h-12 px-6 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest bg-accent text-accent-fg hover:bg-accent-hi transition-colors shadow-[0_8px_28px_-8px_hsl(var(--accent)/0.6)] disabled:opacity-60 disabled:pointer-events-none"
        >
          <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-l from-transparent via-white/25 to-transparent" />
          <span className="relative z-10 flex items-center gap-2">
            {pending ? (
              <>
                <span className="size-3 rounded-full border-2 border-accent-fg border-t-transparent animate-spin" />
                جاري الإنشاء…
              </>
            ) : (
              <>إنشاء الحساب</>
            )}
          </span>
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-fg-muted">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="text-accent font-semibold hover:underline underline-offset-4">
          تسجيل الدخول
        </Link>
      </p>
    </>
  );
}
