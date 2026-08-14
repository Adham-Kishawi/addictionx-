import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import {
  ProductForm,
  type ProductFormInitial,
} from "@/components/admin/product-form";
import { getCollections } from "@/features/catalog/data/products-db";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  await requirePermission("products", locale);
  const dict = getDictionary(locale);
  const collections = await getCollections();

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true, images: { orderBy: { position: "asc" } } },
  });
  if (!product) notFound();

  const notes =
    (product.notes as {
      top?: string[];
      heart?: string[];
      base?: string[];
    }) ?? {};
  const art =
    (product.art as {
      from?: string;
      to?: string;
      glow?: string;
    }) ?? {};

  const initial: ProductFormInitial = {
    name: product.name,
    nameEn: product.nameEn ?? "",
    slug: product.slug,
    description: product.description ?? "",
    descriptionEn: product.descriptionEn ?? "",
    collection: product.collection ?? "rush",
    gender: product.gender,
    basePrice: (product.basePrice / 100).toString(),
    compareAtPrice:
      product.compareAtPrice != null
        ? (product.compareAtPrice / 100).toString()
        : "",
    discountPercent: "",
    rating: String(product.rating),
    reviewsCount: String(product.reviewsCount),
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    notesTop: (notes.top ?? []).join("\n"),
    notesHeart: (notes.heart ?? []).join("\n"),
    notesBase: (notes.base ?? []).join("\n"),
    images: product.images.map((img) => img.url),
    artFrom: art.from ?? "#1e1b4b",
    artTo: art.to ?? "#020617",
    artGlow: art.glow ?? "#6366f1",
    variants: product.variants.map((v) => ({
      sizeMl: String(v.sizeMl),
      price: (v.price / 100).toString(),
      stock: String(v.stock),
      sku: v.sku,
    })),
  };

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/${locale}/admin/products`}
          className="transition-colors hover:text-foreground"
        >
          {dict.admin.products}
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <h1 className="mb-6 font-display text-3xl font-bold">
        {dict.admin.editProduct}
      </h1>

      <ProductForm
        locale={locale}
        dict={dict}
        mode="edit"
        productId={product.id}
        collections={collections}
        initial={initial}
      />
    </div>
  );
}
