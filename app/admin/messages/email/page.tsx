import {
  listNotificationChannels,
  listDispatchesByChannel,
} from "@/lib/db/notifications";
import { PageHeader } from "@/components/admin/page-header";
import { EmailMessagesClient } from "@/components/admin/messages/email-messages-client";

export const dynamic = "force-dynamic";

export default async function EmailMessagesPage() {
  const [channels, dispatches] = await Promise.all([
    listNotificationChannels(),
    listDispatchesByChannel("email", 50),
  ]);

  const emailChannel = channels.find((c) => c.channel === "email") ?? null;

  return (
    <>
      <PageHeader
        title="رسائل الإيميل"
        eyebrow="الرسائل"
        description="إدارة قناة البريد الإلكتروني — إعداد Resend، قوالب الإيميل، وسجل الرسائل المرسلة."
      />
      <EmailMessagesClient channel={emailChannel} dispatches={dispatches} />
    </>
  );
}
