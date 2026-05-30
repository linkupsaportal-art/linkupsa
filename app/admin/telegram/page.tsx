import { PageHeader } from "@/components/admin/page-header";
import { getTelegramBotSettings } from "@/lib/db/telegram-bot";
import { TelegramAdminClient } from "@/components/admin/telegram/telegram-admin-client";

export const dynamic = "force-dynamic";

export default async function TelegramAdminPage() {
  const settings = await getTelegramBotSettings();
  return (
    <>
      <PageHeader
        title="بوت تيليجرام"
        eyebrow="التواصل والربط"
        description="إعداد البوت الذكي للعملاء — استلام الطلبات وأكواد التحقق مباشرة من خلال محادثة تيليجرام."
      />
      <TelegramAdminClient
        settings={{
          bot_token_present: !!settings.bot_token,
          bot_username: settings.bot_username,
          operator_chat_id: settings.operator_chat_id,
          enabled: settings.enabled,
          mirror_orders: settings.mirror_orders,
          mirror_bans: settings.mirror_bans,
          pickup_flow_enabled: settings.pickup_flow_enabled,
          webhook_url: settings.webhook_url,
          webhook_set_at: settings.webhook_set_at,
        }}
      />
    </>
  );
}
