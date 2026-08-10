import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductCard } from "@/features/catalog/components/product-card";
import {
  getProducts,
  getCollections,
} from "@/features/catalog/data/products-db";
import { getWishlistIds } from "@/features/account/data";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/reveal";
import { SectionGlow } from "@/components/motion/section-glow";
import { Pagination } from "@/features/catalog/components/pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 10;

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { lang, slug } = await params;
  const { page: pageParam } = await searchParams;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);
  const isRtl = locale === "ar";

  const [allProducts, collections] = await Promise.all([
    getProducts(),
    getCollections(),
  ]);
  const collection = collections.find((c) => c.slug === slug);
  if (!collection) notFound();

  const wishlist = await getWishlistIds();
  const products = allProducts.filter((p) => p.collection === slug);

  const page = Math.max(1, Number(pageParam) || 1);
  const totalPages = Math.max(1, Math.ceil(products.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageProducts = products.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE,
  );

  return (
    <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <SectionGlow />
      <Reveal>
        <header className="mb-10 flex flex-col gap-3">
          <Link
            href={`/${locale}/collections`}
            className="group inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {dict.collectionsPage.back}
          </Link>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-4xl font-bold">
              {isRtl ? collection.nameAr : collection.nameEn}
            </h1>
            <p className="text-muted-foreground">
              {products.length}{" "}
              {products.length === 1
                ? dict.collectionsPage.products
                : dict.collectionsPage.products}
            </p>
          </div>
        </header>
      </Reveal>

      {pageProducts.length > 0 ? (
        <>
          <RevealStagger className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {pageProducts.map((product) => (
              <RevealItem key={product.id}>
                <ProductCard
                  product={product}
                  locale={locale}
                  wishlisted={wishlist?.includes(product.id) ?? null}
                />
              </RevealItem>
            ))}
          </RevealStagger>

          <Pagination
            baseHref={`/${locale}/collections/${collection.slug}`}
            query={new URLSearchParams(
              pageParam ? { page: pageParam } : {},
            ).toString()}
            page={safePage}
            totalPages={totalPages}
            labels={{
              prev: dict.catalog.prev,
              next: dict.catalog.next,
              page: dict.catalog.pageOf,
              of: dict.catalog.of,
            }}
          />
        </>
      ) : (
        <p className="rounded-2xl border border-dashed border-border py-24 text-center text-sm text-muted-foreground">
          {dict.collectionsPage.empty}
        </p>
      )}
    </main>
  );
}
