import { listOtpLogs } from "@/lib/db/otp-logs";
import { listPhoneBans } from "@/lib/db/phone-bans";
import { listProducts } from "@/lib/db/products";
import {
  getAutoBanSettings,
  getPickupSessionSettings,
} from "@/lib/db/platform-settings";
import { PageHeader } from "@/components/admin/page-header";
import { OtpLogsClient } from "@/components/admin/otp-logs/otp-logs-client";

export const dynamic = "force-dynamic";

export default async function OtpLogsPage() {
  const [{ rows, total, stats }, bans, productsRaw, autoBan, session] =
    await Promise.all([
      listOtpLogs({ limit: 200 }),
      listPhoneBans(),
      listProducts(),
      getAutoBanSettings(),
      getPickupSessionSettings(),
    ]);
  const products = productsRaw.map((p) => ({ id: p.id, name: p.name }));
  return (
    <>
      <PageHeader
        title="سجل التحقق وحظر الأرقام"
        eyebrow="التحقق والأمان"
        description="كل طلب كود تحقق مع الـ IP والوقت، حظر الأرقام يدوياً، وإعدادات الجلسة والحظر التلقائي."
      />
      <OtpLogsClient
        rows={rows}
        total={total}
        stats={stats}
        bans={bans}
        products={products}
        autoBan={autoBan}
        session={session}
      />
    </>
  );
}
