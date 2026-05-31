"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MailCheck } from "lucide-react";
import { OtpInput } from "@/components/auth/otp-input";
import { resendCodeAction, verifyEmailAction } from "@/app/(auth)/actions";

const RESEND_COOLDOWN_SEC = 60;

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const search = useSearchParams();
  const router = useRouter();
  const email = (search.get("email") ?? "").trim().toLowerCase();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [cooldown, setCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // No email param? bounce to register
  useEffect(() => {
    if (!email) router.replace("/register");
  }, [email, router]);

  function submit(value?: string) {
    const codeToSend = value ?? code;
    if (codeToSend.length !== 6) return;
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await verifyEmailAction({ email, code: codeToSend });
      if (!res.ok) {
        setError(res.error);
        setCode("");
        return;
      }
      // If we got auto-signed-in, go straight to the dashboard. Otherwise
      // fall back to the login page with a verified hint.
      if (res.signedIn) {
        // Full navigation so the freshly-set auth cookies are picked up by
        // the server on the very next request (middleware + layout).
        window.location.assign("/admin");
      } else {
        router.replace("/login?verified=1");
      }
    });
  }

  function resend() {
    if (cooldown > 0) return;
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await resendCodeAction(email);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setInfo("تم إرسال كود جديد. تحقق من بريدك.");
      setCooldown(RESEND_COOLDOWN_SEC);
    });
  }

  // Mask the email for display (e.g. ah***@store.sa)
  const masked = email.replace(/^(.{2})(.*)(@.*)$/, (_m, a, b, c) =>
    a + "*".repeat(Math.max(b.length, 2)) + c,
  );

  return (
    <>
      <header className="mb-8 text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-xs text-fg-subtle hover:text-fg transition-colors mb-6"
        >
          <ArrowLeft className="size-3.5 rotate-180" />
          العودة
        </Link>
        <div className="inline-flex size-14 items-center justify-center rounded-full bg-accent/10 border border-accent/30 mx-auto mb-4">
          <MailCheck className="size-6 text-accent" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          تحقق من بريدك
        </h1>
        <p className="mt-2 text-sm text-fg-muted leading-relaxed">
          أرسلنا كوداً مكوّناً من 6 أرقام إلى
          <br />
          <span className="text-fg font-mono" dir="ltr">{masked}</span>
        </p>
      </header>

      {error && (
        <div className="mb-5 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger text-center">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-5 rounded-md border border-success/40 bg-success/10 px-4 py-3 text-sm text-success text-center">
          {info}
        </div>
      )}

      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={(c) => submit(c)}
        disabled={pending}
        invalid={!!error}
      />

      <button
        onClick={() => submit()}
        disabled={pending || code.length !== 6}
        className="mt-6 group/btn relative w-full overflow-hidden rounded-md h-12 px-6 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest bg-accent text-accent-fg hover:bg-accent-hi transition-colors shadow-[0_8px_28px_-8px_hsl(var(--accent)/0.6)] disabled:opacity-60 disabled:pointer-events-none"
      >
        <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-l from-transparent via-white/25 to-transparent" />
        <span className="relative z-10 flex items-center gap-2">
          {pending ? (
            <>
              <span className="size-3 rounded-full border-2 border-accent-fg border-t-transparent animate-spin" />
              جاري التحقق…
            </>
          ) : (
            "تأكيد الكود"
          )}
        </span>
      </button>

      <p className="mt-6 text-center text-sm text-fg-muted">
        لم يصلك الكود؟{" "}
        <button
          onClick={resend}
          disabled={cooldown > 0 || pending}
          className="text-accent font-semibold hover:underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
        >
          {cooldown > 0 ? `إعادة الإرسال خلال ${cooldown}ث` : "إعادة إرسال"}
        </button>
      </p>
    </>
  );
}
