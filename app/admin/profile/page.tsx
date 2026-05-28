import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ProfileSidebar } from "@/components/admin/profile/profile-sidebar";
import { AccountInfoCard } from "@/components/admin/profile/account-info-card";
import { AvatarCard } from "@/components/admin/profile/avatar-card";
import { EmailCard } from "@/components/admin/profile/email-card";
import { PasswordCard } from "@/components/admin/profile/password-card";
import { TwoFactorCard } from "@/components/admin/profile/two-factor-card";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * /admin/profile — personal account settings.
 *
 * Sections (anchor-linkable via the sticky side-nav):
 *   #profile  → avatar + display name + store name + phone
 *   #email    → change email (OTP confirmation)
 *   #password → change password (current-password verification)
 *   #2fa      → TOTP authenticator + 8 backup codes
 *
 * Each section is its own client component with its own form/state, so a
 * failure in one doesn't affect the others.
 */
export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Pull the current profile row for display values + 2FA status check.
  const sb = await createClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("name, store_name, phone, phone_country, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { data: factors } = await sb.auth.mfa.listFactors();
  const hasMfa = (factors?.totp ?? []).some((f) => f.status === "verified");

  return (
    <>
      <PageHeader
        eyebrow="الإعدادات"
        title="الملف الشخصي والأمان"
        description="أدِر معلومات حسابك، صورة الملف الشخصي، البريد، كلمة المرور، والمصادقة بخطوتين."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 pb-8">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-2">
            <ProfileSidebar hasMfa={hasMfa} />
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-4 lg:space-y-5">
          <section id="profile" className="scroll-mt-4 space-y-4 lg:space-y-5">
            <AvatarCard
              userName={profile?.name ?? user.email ?? "User"}
              userEmail={user.email ?? ""}
              currentAvatar={profile?.avatar_url ?? null}
            />
            <AccountInfoCard
              defaultName={profile?.name ?? ""}
              defaultStoreName={profile?.store_name ?? ""}
              defaultPhone={profile?.phone ?? ""}
              defaultPhoneCountry={profile?.phone_country ?? ""}
            />
          </section>

          <section id="email" className="scroll-mt-4">
            <EmailCard currentEmail={user.email ?? ""} />
          </section>

          <section id="password" className="scroll-mt-4">
            <PasswordCard />
          </section>

          <section id="2fa" className="scroll-mt-4">
            <TwoFactorCard hasMfa={hasMfa} />
          </section>
        </div>
      </div>
    </>
  );
}
