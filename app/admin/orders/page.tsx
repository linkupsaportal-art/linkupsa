import { listOrders } from "@/lib/db/orders";
import { listAccounts } from "@/lib/db/accounts";
import { getCurrentRole } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { OrdersClient } from "@/components/admin/orders/orders-client";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [{ orders, total }, accounts, role] = await Promise.all([
    listOrders({ limit: 100 }),
    listAccounts(),
    getCurrentRole(),
  ]);

  // Minimal account projection for the reassignment picker (no secrets).
  const accountOptions = accounts.map((a) => ({
    id: a.id,
    label: a.label,
    productId: a.product_id,
    productName: a.product_name ?? null,
    status: a.status,
    usage: a.current_usage,
    maxUsage: a.max_usage,
  }));

  return (
    <>
      <PageHeader
        title="الطلبات"
        eyebrow="إدارة الطلبات"
        description="جميع الطلبات الواردة من سلة وحالة تسليمها."
      />
      <OrdersClient
        orders={orders}
        total={total}
        initialQuery={q ?? ""}
        accounts={accountOptions}
        canManage={role === "manager" || role === "supervisor"}
        canDelete={role === "manager"}
      />
    </>
  );
}
