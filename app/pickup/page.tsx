import { PickupForm } from "./pickup-form";
import { getPickupSessionSettings, getPickupCustomizationSettings } from "@/lib/db/platform-settings";
import { getTelegramBotSettings } from "@/lib/db/telegram-bot";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  const sb = createServiceClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("store_name")
    .eq("email", "Linkup.saudi@gmail.com")
    .limit(1)
    .maybeSingle();

  const storeName = profile?.store_name || "متجرنا";

  return {
    title: `استلام طلبك | ${storeName}`,
    description: "أدخل رقم الطلب وآخر 4 أرقام من جوالك للاستلام",
  };
}

export const dynamic = "force-dynamic";

export default async function PickupPage() {
  const session = await getPickupSessionSettings();
  const customization = await getPickupCustomizationSettings();

  const sb = createServiceClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("store_name, avatar_url")
    .eq("email", "Linkup.saudi@gmail.com")
    .limit(1)
    .maybeSingle();

  const storeName = profile?.store_name || "متجرنا";
  const storeLogo = profile?.avatar_url || null;

  // Show the "Receive via Telegram" CTA only when the bot is fully
  // operational: enabled, has a token, has a username, has a webhook
  // registered, and customer pickup flow is on.
  // OR if a custom telegram username override is set.
  const tg = await getTelegramBotSettings().catch(() => null);
  const customTg = customization.telegram_username;
  const telegram = customTg
    ? { username: customTg }
    : (tg?.enabled &&
       tg.bot_token &&
       tg.bot_username &&
       tg.webhook_url &&
       tg.pickup_flow_enabled
         ? { username: tg.bot_username }
         : null);

  return (
    <div
      className="theme-admin min-h-svh flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, hsl(170 8% 92%) 0%, hsl(186 11% 84%) 50%, hsl(190 12% 78%) 100%)",
      }}
      dir="rtl"
    >
      {/* Decorative backdrop blobs to match high-end dashboard */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Enhanced package icon with glowing 3D-like container or dynamic store logo */}
          {storeLogo ? (
            <div className="inline-flex size-16 items-center justify-center rounded-2xl overflow-hidden mb-4 shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-white/20 bg-white">
              <img src={storeLogo} alt={storeName} className="size-full object-cover" />
            </div>
          ) : (
            <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-fg mb-4 shadow-[0_8px_32px_rgba(212,245,66,0.3)] border border-white/20">
              <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M20 7L12 3 4 7m16 0v10l-8 4-8-4V7m16 0l-8 4m0 0L4 7m8 4v10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Connected badge */}
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold border border-emerald-500/20 shadow-sm select-none">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              بوابة الاستلام الآمن · متصل
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-fg mb-2 tracking-tight">
            استلام طلبك من {storeName}
          </h1>
          <p className="text-sm text-fg-muted max-w-sm mx-auto leading-relaxed">
            أدخل رقم الطلب وآخر 4 أرقام من جوالك المسجل في الطلب للحصول على بيانات حسابك وأكواد التفعيل.
          </p>
        </div>

        <PickupForm
          sessionConfig={session}
          telegram={telegram}
          turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          supportUrl={customization.support_url}
        />
      </div>
    </div>
  );
}
