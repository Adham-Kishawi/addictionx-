import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import type { ImageAdjust } from "@/lib/image-adjust";
import { CollectionForm } from "@/components/admin/collection-form";
import { CollectionEdit } from "@/components/admin/collection-edit";
import { CollectionDelete } from "@/components/admin/collection-delete";
import { CollectionActiveToggle } from "@/components/admin/collection-active-toggle";
import {
  HomeCollectionsManager,
  type HomeCollectionRow,
} from "@/components/admin/home-collections-manager";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  await requirePermission("collections", locale);
  const dict = getDictionary(locale);

  const collections = await prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      nameEn: true,
      collection: true,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const productsByCollection = new Map<string, typeof products>();
  for (const product of products) {
    const slug = product.collection ?? "";
    const list = productsByCollection.get(slug) ?? [];
    list.push(product);
    productsByCollection.set(slug, list);
  }

  const homeRows: HomeCollectionRow[] = collections.map((c) => ({
    slug: c.slug,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    image: c.image,
    imageAdjust: (c.imageAdjust as ImageAdjust | null) ?? null,
    descriptionAr: c.descriptionAr,
    descriptionEn: c.descriptionEn,
    showInHome: c.showInHome,
    isActive: c.isActive,
  }));

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">
        {dict.admin.collections}
      </h1>

      <div className="mb-8">
        <HomeCollectionsManager
          collections={homeRows}
          locale={locale}
          dict={dict}
        />
      </div>

      <div className="mb-6">
        <CollectionForm dict={dict} />
      </div>

      {collections.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {dict.admin.noCollections}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {collections.map((collection) => {
            const collectionProducts =
              productsByCollection.get(collection.slug) ?? [];
            return (
              <div
                key={collection.id}
                className="rounded-2xl border border-border bg-card/40 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    {collection.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={collection.image}
                        alt=""
                        className="h-10 w-10 rounded-lg border border-border object-cover"
                      />
                    ) : null}
                    <h2 className="font-display text-lg font-bold">
                      {locale === "ar" ? collection.nameAr : collection.nameEn}
                    </h2>
                    <span
                      className="font-mono text-xs text-muted-foreground"
                      dir="ltr"
                    >
                      /{collection.slug}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {collectionProducts.length}{" "}
                      {dict.admin.collectionProducts}
                    </span>
                    {!collection.isActive && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {dict.admin.slideHidden}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <CollectionActiveToggle
                      slug={collection.slug}
                      isActive={collection.isActive}
                      dict={dict}
                    />
                    <CollectionDelete
                      slug={collection.slug}
                      productCount={collectionProducts.length}
                      collections={collections.map((c) => ({
                        slug: c.slug,
                        nameAr: c.nameAr,
                        nameEn: c.nameEn,
                      }))}
                      dict={dict}
                    />
                  </div>
                </div>

                {collection.descriptionAr || collection.descriptionEn ? (
                  <p className="mb-3 max-w-2xl text-sm text-muted-foreground">
                    {locale === "ar"
                      ? collection.descriptionAr
                      : collection.descriptionEn || collection.descriptionAr}
                  </p>
                ) : null}

                <CollectionEdit
                  slug={collection.slug}
                  initial={{
                    nameAr: collection.nameAr,
                    nameEn: collection.nameEn,
                    image: collection.image,
                    imageAdjust:
                      (collection.imageAdjust as ImageAdjust | null) ?? null,
                    descriptionAr: collection.descriptionAr,
                    descriptionEn: collection.descriptionEn,
                  }}
                  dict={dict}
                />

                {collectionProducts.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {dict.admin.collectionEmpty}
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {collectionProducts.map((product) => (
                      <li
                        key={product.id}
                        className="rounded-lg border border-border/60 bg-background px-2.5 py-1 text-sm"
                      >
                        <span
                          className={
                            product.isActive ? "" : "text-muted-foreground"
                          }
                        >
                          {locale === "ar"
                            ? product.name
                            : product.nameEn || product.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
