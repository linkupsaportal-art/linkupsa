import { listOrders } from "@/lib/db/orders";
import { PageHeader } from "@/components/admin/page-header";
import { OrdersClient } from "@/components/admin/orders/orders-client";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { orders, total } = await listOrders({ limit: 100 });

  return (
    <>
      <PageHeader
        title="الطلبات"
        eyebrow="إدارة الطلبات"
        description="جميع الطلبات الواردة من سلة وحالة تسليمها."
      />
      <OrdersClient orders={orders} total={total} />
    </>
  );
}
