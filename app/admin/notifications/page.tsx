import { listNotificationChannels, listRecentDispatches } from "@/lib/db/notifications";
import { PageHeader } from "@/components/admin/page-header";
import { NotificationsClient } from "@/components/admin/notifications/notifications-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [channels, dispatches] = await Promise.all([
    listNotificationChannels(),
    listRecentDispatches(50),
  ]);

  return (
    <>
      <PageHeader
        title="الإشعارات"
        eyebrow="التواصل والربط"
        description="قنوات تسليم الإشعارات للعميل وقت تنفيذ الطلب — واتساب · إيميل · رسائل · تليجرام."
      />
      <NotificationsClient channels={channels} dispatches={dispatches} />
    </>
  );
}
