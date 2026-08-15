import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-permissions";
import {
  ManualOrderForm,
  type ManualOrderProduct,
} from "@/components/admin/manual-order-form";

export const dynamic = "force-dynamic";

export default async function NewOrderPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  await requirePermission("orders", locale);
  const dict = getDictionary(locale);

  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      basePrice: true,
      stock: true,
      variants: {
        where: { isActive: true },
        select: { id: true, sizeMl: true, price: true, stock: true },
        orderBy: { sizeMl: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const products: ManualOrderProduct[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    basePrice: r.basePrice,
    stock: r.stock,
    variants: r.variants,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-3xl font-bold">
        {dict.admin.newOrder}
      </h1>
      <ManualOrderForm dict={dict} locale={locale} products={products} />
    </div>
  );
}
