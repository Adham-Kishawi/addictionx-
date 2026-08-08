import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { requirePermission } from "@/lib/admin-permissions";
import { ProductForm } from "@/components/admin/product-form";
import { getCollections } from "@/features/catalog/data/products-db";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  await requirePermission("products");
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);
  const collections = await getCollections();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-3xl font-bold">
        {dict.admin.newProduct}
      </h1>
      <ProductForm
        locale={locale}
        dict={dict}
        mode="create"
        collections={collections}
      />
    </div>
  );
}
