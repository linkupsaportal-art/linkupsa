"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User as UserIcon, Store, Phone, Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/admin/profile/section-card";
import { updateAccountInfoAction } from "@/app/admin/profile/actions";

const schema = z.object({
  name: z.string().trim().min(2, "الاسم قصير").max(80),
  storeName: z.string().trim().min(2, "اسم المتجر قصير").max(80),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[+0-9\s-]*$/, "رقم الجوال غير صالح")
    .optional()
    .or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

/** Edit display name + store name + phone. */
export function AccountInfoCard({
  defaultName,
  defaultStoreName,
  defaultPhone,
}: {
  defaultName: string;
  defaultStoreName: string;
  defaultPhone: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultName,
      storeName: defaultStoreName,
      phone: defaultPhone,
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
      setTimeout(() => setSuccess(false), 2500);
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
              رقم الجوال <span className="text-fg-faint font-normal">(اختياري)</span>
            </Label>
            <Input
              id="phone"
              inputSize="lg"
              type="tel"
              dir="ltr"
              autoComplete="tel"
              placeholder="+966 5X XXX XXXX"
              startAdornment={<Phone className="size-4" />}
              invalid={!!errors.phone}
              disabled={pending}
              {...register("phone")}
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
