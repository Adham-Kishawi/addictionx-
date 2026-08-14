import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { SliderManager } from "@/components/admin/slider-manager";

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

  const [slideRows, productRows] = await Promise.all([
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
            images: {
              orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
              take: 1,
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
        images: {
          orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
          take: 1,
        },
      },
    }),
  ]);

  const slides = slideRows.map((s) => ({
    id: s.id,
    position: s.position,
    isActive: s.isActive,
    image: s.image,
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
    },
  }));

  const products = productRows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    nameEn: p.nameEn,
    image: primaryImage(p.images),
    collection: p.collection,
  }));

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">
        {dict.admin.slider}
      </h1>
      <SliderManager
        slides={slides}
        products={products}
        locale={locale}
        dict={dict}
      />
    </div>
  );
}
