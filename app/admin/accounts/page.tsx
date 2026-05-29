import { listAccounts } from "@/lib/db/accounts";
import { listProducts } from "@/lib/db/products";
import { PageHeader } from "@/components/admin/page-header";
import { AccountsClient } from "@/components/admin/accounts/accounts-client";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const [accounts, products] = await Promise.all([listAccounts(), listProducts()]);

  return (
    <>
      <PageHeader
        title="الحسابات"
        eyebrow="مخزون الاعتمادات"
        description="أضف الحسابات والأكواد والملفات الرقمية التي سيتم تسليمها للعملاء."
      />
      <AccountsClient initialAccounts={accounts} products={products} />
    </>
  );
}
