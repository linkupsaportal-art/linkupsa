import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/(auth)/actions";
import { redirect } from "next/navigation";

/**
 * Placeholder dashboard — proves auth works end-to-end.
 * Real screens (Orders, Accounts, Settings…) go in here next.
 */
export default async function DashboardPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await sb
    .from("profiles")
    .select("name, store_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-svh flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-xl border border-[hsl(var(--hairline-strong))] bg-surface p-8">
        <h1 className="text-2xl font-bold font-display tracking-tight">
          أهلاً، {profile?.name ?? "صديقي"}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {profile?.store_name ? `متجر ${profile.store_name}` : "حسابك جاهز."}
        </p>
        <p className="mt-4 text-xs font-mono text-fg-faint" dir="ltr">
          {profile?.email ?? user.email}
        </p>

        <form action={signOutAction} className="mt-8">
          <button
            type="submit"
            className="rounded-md border border-[hsl(var(--hairline-strong))] px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-fg/10 transition-colors"
          >
            تسجيل الخروج
          </button>
        </form>
      </div>
    </main>
  );
}
