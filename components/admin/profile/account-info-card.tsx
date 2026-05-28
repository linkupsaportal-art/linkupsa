"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User as UserIcon, Store, Check, AlertCircle } from "lucide-react";
import type { CountryIso2 } from "react-international-phone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { SectionCard } from "@/components/admin/profile/section-card";
import { updateAccountInfoAction } from "@/app/admin/profile/actions";

// Phone is optional; if present must be a sane E.164 (+ then 7–18 digits).
const E164 = /^\+[1-9]\d{6,17}$/;

const schema = z.object({
  name: z.string().trim().min(2, "الاسم قصير").max(80),
  storeName: z.string().trim().min(2, "اسم المتجر قصير").max(80),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || E164.test(v), "رقم الجوال غير صالح")
    .optional()
    .default(""),
  phoneCountry: z.string().trim().toLowerCase().length(2).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

/** Edit display name + store name + phone (with locked country code). */
export function AccountInfoCard({
  defaultName,
  defaultStoreName,
  defaultPhone,
  defaultPhoneCountry,
}: {
  defaultName: string;
  defaultStoreName: string;
  defaultPhone: string;
  defaultPhoneCountry: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Track the success-message timeout so we can clear it on unmount AND when
  // a fresh save fires before the previous flash completes (prevents
  // "setState on unmounted component" warnings).
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Lock the country if there's already a saved phone — once chosen, the user
  // can't accidentally swap dial codes when editing other fields.
  const hadPhone = Boolean(defaultPhone);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultName,
      storeName: defaultStoreName,
      phone: defaultPhone,
      phoneCountry: (defaultPhoneCountry || "sa").toLowerCase(),
    },
  });

  function onSubmit(values: FormValues) {
    setServerError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await updateAccountInfoAction(values);
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      setSuccess(true);
      reset(values);
      router.refresh();
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        setSuccess(false);
        successTimeoutRef.current = null;
      }, 2500);
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <SectionCard
        icon={UserIcon}
        title="معلومات الحساب"
        description="هذه البيانات تظهر داخل لوحة التحكم وفي تواصلنا معك."
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
                تم الحفظ
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
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="name" className="block mb-1.5">
              الاسم الكامل
            </Label>
            <Input
              id="name"
              inputSize="lg"
              autoComplete="name"
              startAdornment={<UserIcon className="size-4" />}
              invalid={!!errors.name}
              disabled={pending}
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-danger">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="storeName" className="block mb-1.5">
              اسم المتجر
            </Label>
            <Input
              id="storeName"
              inputSize="lg"
              startAdornment={<Store className="size-4" />}
              invalid={!!errors.storeName}
              disabled={pending}
              {...register("storeName")}
            />
            {errors.storeName && (
              <p className="mt-1.5 text-xs text-danger">{errors.storeName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="block mb-1.5">
              رقم الجوال{" "}
              <span className="text-fg-faint font-normal">(اختياري)</span>
              {hadPhone && (
                <span className="ms-2 text-[10px] uppercase tracking-widest font-bold text-fg-faint">
                  · الدولة مقفلة
                </span>
              )}
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
                      value={field.value ?? ""}
                      onChange={(v, meta) => {
                        field.onChange(v);
                        countryField.onChange(meta.country);
                      }}
                      defaultCountry={
                        ((countryField.value || "sa").toLowerCase() as CountryIso2)
                      }
                      lockCountry={hadPhone}
                      lockedTo={
                        hadPhone
                          ? ((defaultPhoneCountry || "sa").toLowerCase() as CountryIso2)
                          : undefined
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
        </div>
      </SectionCard>
    </form>
  );
}
