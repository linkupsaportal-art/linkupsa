import { listProducts } from "@/lib/db/products";
import { PageHeader } from "@/components/admin/page-header";
import { ProductsClient } from "@/components/admin/products/products-client";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await listProducts();

  return (
    <>
      <PageHeader
        title="المنتجات"
        eyebrow="إدارة المخزون"
        description="أضف منتجاتك الرقمية وحدد نوع التسليم لكل منتج."
      />
      <ProductsClient initialProducts={products} />
    </>
  );
}
