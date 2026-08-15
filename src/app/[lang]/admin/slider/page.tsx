import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { SliderManager } from "@/components/admin/slider-manager";
import type { ImageAdjust } from "@/lib/image-adjust";

export const dynamic = "force-dynamic";

const primaryImage = (images: { url: string }[]) => images[0]?.url ?? null;

export default async function AdminSliderPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  await requirePermission("products", locale);
  const dict = getDictionary(locale);

  const [slideRows, productRows, collectionRows] = await Promise.all([
    prisma.homeSlide.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            nameEn: true,
            collection: true,
            isActive: true,
            basePrice: true,
            images: {
              orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
              take: 1,
            },
            variants: {
              where: { isActive: true },
              orderBy: { price: "asc" },
              take: 1,
              select: { price: true },
            },
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        nameEn: true,
        collection: true,
        basePrice: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
          take: 1,
        },
        variants: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          take: 1,
          select: { price: true },
        },
      },
    }),
    prisma.collection.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        slug: true,
        nameAr: true,
        nameEn: true,
        descriptionAr: true,
        descriptionEn: true,
      },
    }),
  ]);

  const productPrice = (p: {
    basePrice: number;
    variants: { price: number }[];
  }) => p.variants[0]?.price ?? p.basePrice;

  const slides = slideRows.map((s) => ({
    id: s.id,
    position: s.position,
    isActive: s.isActive,
    image: s.image,
    imageAdjust: (s.imageAdjust as ImageAdjust | null) ?? null,
    captionAr: s.captionAr,
    captionEn: s.captionEn,
    product: {
      id: s.product.id,
      slug: s.product.slug,
      name: s.product.name,
      nameEn: s.product.nameEn,
      image: primaryImage(s.product.images),
      collection: s.product.collection,
      isActive: s.product.isActive,
      price: productPrice(s.product),
    },
  }));

  const products = productRows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    nameEn: p.nameEn,
    image: primaryImage(p.images),
    collection: p.collection,
    price: productPrice(p),
  }));

  const collections = collectionRows.map((c) => ({
    slug: c.slug,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    descriptionAr: c.descriptionAr,
    descriptionEn: c.descriptionEn,
  }));

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">
        {dict.admin.slider}
      </h1>
      <SliderManager
        slides={slides}
        products={products}
        collections={collections}
        locale={locale}
        dict={dict}
      />
    </div>
  );
}
