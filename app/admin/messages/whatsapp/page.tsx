import {
  listNotificationChannels,
  listDispatchesByChannel,
} from "@/lib/db/notifications";
import { PageHeader } from "@/components/admin/page-header";
import { WhatsAppMessagesClient } from "@/components/admin/messages/whatsapp-messages-client";

export const dynamic = "force-dynamic";

export default async function WhatsAppMessagesPage() {
  const [channels, dispatches] = await Promise.all([
    listNotificationChannels(),
    listDispatchesByChannel("whatsapp", 50),
  ]);

  const whatsappChannel = channels.find((c) => c.channel === "whatsapp") ?? null;

  return (
    <>
      <PageHeader
        title="رسائل واتساب"
        eyebrow="الرسائل"
        description="إدارة قنوات الواتساب — واتساب بزنس العادي (محادثات مباشرة) وواتساب API المؤسسي (قوالب ميتا المعتمدة)."
      />
      <WhatsAppMessagesClient
        channel={whatsappChannel}
        dispatches={dispatches}
      />
    </>
  );
}
