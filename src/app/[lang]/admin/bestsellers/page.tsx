import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { BestSellerManager } from "@/components/admin/best-seller-manager";

export const dynamic = "force-dynamic";

export default async function AdminBestSellersPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  await requirePermission("products");
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const products = await prisma.product.findMany({
    include: { images: true },
    orderBy: [
      { isBestSeller: "desc" },
      { bestsellerOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">
          {dict.admin.bestsellers}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dict.admin.bestsellersManage}
        </p>
      </div>

      <BestSellerManager
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          nameEn: p.nameEn,
          slug: p.slug,
          isBestSeller: p.isBestSeller,
          bestsellerOrder: p.bestsellerOrder,
          isActive: p.isActive,
          collection: p.collection,
          images: p.images,
          art: p.art,
          price: p.basePrice,
        }))}
        locale={locale}
        labels={{
          hint: dict.admin.bestsellersHint,
          moveUp: dict.admin.moveUp,
          moveDown: dict.admin.moveDown,
          add: dict.admin.addToBestSellers,
          remove: dict.admin.removeFromBestSellers,
          edit: dict.admin.edit,
          noBestSellers: dict.admin.noBestSellers,
          count: dict.admin.bestSellersCount,
          others: dict.admin.otherProducts,
        }}
      />
    </div>
  );
}
