"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, ImagePlus, Check, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/admin/profile/section-card";
import { setAvatarAction, removeAvatarAction } from "@/app/admin/profile/actions";
import {
  AVATAR_ALLOWED_MIME,
  AVATAR_MAX_BYTES,
  avatarExtension,
} from "@/app/admin/profile/avatar-config";
import { createClient } from "@/lib/supabase/client";

/**
 * Avatar uploader.
 *
 * Pipeline:
 *   1. Client validates size + MIME.
 *   2. Client uploads directly to Supabase Storage (`avatars/{user_id}/...`).
 *      RLS limits writes to the user's own folder, so this is safe.
 *      Going direct sidesteps Next.js Server Action's 1 MB body cap.
 *   3. Client calls `setAvatarAction(url, path)` — small JSON payload — to
 *      persist the URL on `profiles` + `user_metadata` and clean up the
 *      previous file.
 */
export function AvatarCard({
  userName,
  userEmail,
  currentAvatar,
}: {
  userName: string;
  userEmail: string;
  currentAvatar: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const initial = (userName?.[0] ?? userEmail?.[0] ?? "U").toUpperCase();
  const busy = pending || isUploading;

  function pickFile() {
    if (busy) return;
    inputRef.current?.click();
  }

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setError(null);
    setSuccess(false);

    if (file.size > AVATAR_MAX_BYTES) {
      setError("الحجم أكبر من 2 ميغا");
      return;
    }
    if (!AVATAR_ALLOWED_MIME.includes(file.type as (typeof AVATAR_ALLOWED_MIME)[number])) {
      setError("الصيغة غير مدعومة. استخدم PNG أو JPG أو WebP.");
      return;
    }

    // Optimistic preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setIsUploading(true);

    try {
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new Error("غير مصرّح. أعد تسجيل الدخول.");

      const ext = avatarExtension(file.type);
      const storagePath = `${user.id}/avatar-${Date.now()}.${ext}`;

      // 1. Direct browser → Supabase Storage upload.
      const { error: upErr } = await sb.storage
        .from("avatars")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
          cacheControl: "3600",
        });
      if (upErr) {
        throw new Error(
          upErr.message?.includes("size")
            ? "الحجم أكبر من 2 ميغا"
            : upErr.message?.includes("mime") || upErr.message?.includes("type")
            ? "الصيغة غير مدعومة"
            : "تعذّر رفع الصورة",
        );
      }

      const { data: pub } = sb.storage.from("avatars").getPublicUrl(storagePath);
      // Cache-bust so the new avatar shows immediately. Without this, the
      // browser may serve a stale 304 from the previous filename if cache
      // headers from Storage are aggressive.
      const avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;

      // 2. Persist via server action (small JSON, no file payload).
      startTransition(async () => {
        const res = await setAvatarAction({ avatarUrl, storagePath });
        URL.revokeObjectURL(localUrl);
        setIsUploading(false);
        if (!res.ok) {
          setPreviewUrl(currentAvatar);
          setError(res.error);
          return;
        }
        setPreviewUrl(res.avatarUrl);
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 2500);
      });
    } catch (e) {
      URL.revokeObjectURL(localUrl);
      setPreviewUrl(currentAvatar);
      setIsUploading(false);
      setError(e instanceof Error ? e.message : "تعذّر رفع الصورة");
    }
  }

  function handleRemove() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await removeAvatarAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPreviewUrl(null);
      router.refresh();
    });
  }

  return (
    <SectionCard
      icon={Camera}
      title="صورة الملف الشخصي"
      description="تظهر في القائمة الجانبية وفي حساب المتجر. PNG / JPG / WebP — حتى 2 ميغا."
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Avatar preview */}
        <div className="relative shrink-0">
          <Avatar className="size-20 sm:size-24 ring-4 ring-bg shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)]">
            {previewUrl && <AvatarImage src={previewUrl} alt={userName} />}
            <AvatarFallback className="bg-fg text-bg font-display font-extrabold text-2xl sm:text-3xl">
              {initial}
            </AvatarFallback>
          </Avatar>
          {busy && (
            <span
              aria-live="polite"
              className="absolute inset-0 rounded-full grid place-items-center bg-bg/70 backdrop-blur-sm"
            >
              <span className="size-5 rounded-full border-2 border-fg border-t-transparent animate-spin" />
            </span>
          )}
        </div>

        {/* Drop zone + actions */}
        <div className="flex-1 min-w-0 w-full">
          <div
            onClick={pickFile}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`group relative cursor-pointer rounded-xl border-2 border-dashed p-3.5 transition-all ${
              isDragging
                ? "border-accent bg-accent/5"
                : "border-[hsl(var(--hairline-strong))] hover:border-fg/30 hover:bg-surface-2"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={AVATAR_ALLOWED_MIME.join(",")}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="flex items-center gap-3">
              <span className="grid place-items-center size-9 rounded-lg bg-surface-2 text-fg group-hover:bg-fg group-hover:text-bg transition-colors shrink-0">
                <ImagePlus className="size-4" strokeWidth={1.7} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-fg">
                  {isDragging ? "أفلت الصورة هنا" : "اسحب صورة أو اضغط للاختيار"}
                </p>
                <p className="text-[11px] text-fg-muted mt-0.5">
                  PNG · JPG · WebP — حد أقصى 2 ميغا
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={pickFile}
              disabled={busy}
            >
              <Camera className="size-4" />
              تغيير
            </Button>
            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={busy}
                className="text-danger hover:bg-danger/5 hover:border-danger/30"
              >
                <Trash2 className="size-4" />
                إزالة
              </Button>
            )}
            {error && (
              <p className="ms-auto inline-flex items-center gap-1.5 text-xs font-semibold text-danger">
                <AlertCircle className="size-3.5" />
                {error}
              </p>
            )}
            {success && !error && (
              <p className="ms-auto inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                <Check className="size-3.5" />
                تم تحديث الصورة
              </p>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
