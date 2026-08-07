import Link from "next/link";
import { ProductCard } from "@/features/catalog/components/product-card";
import { ProductArt } from "@/features/catalog/components/product-art";
import { CatalogSort } from "@/features/catalog/components/catalog-sort";
import { Reveal, RevealStagger, RevealItem } from "@/components/motion/reveal";
import { type Gender } from "@/features/catalog/data/products";
import {
  getProducts,
  getCollections,
} from "@/features/catalog/data/products-db";
import { getWishlistIds } from "@/features/account/data";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SortKey = "popular" | "newest" | "price-asc" | "price-desc" | "rating";

const genderOptions: {
  value: Gender | "all";
  labelKey: "male" | "female" | "unisex";
}[] = [
  { value: "male", labelKey: "male" },
  { value: "female", labelKey: "female" },
  { value: "unisex", labelKey: "unisex" },
];

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    collection?: string;
    gender?: string;
    sort?: string;
  }>;
}) {
  const { lang } = await params;
  const { collection, gender, sort } = await searchParams;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  // بناء رابط فلتر مع الحفاظ على باقي الفلاتر
  const buildFilterUrl = (key: string, value: string | null) => {
    const params = new URLSearchParams();
    if (collection && key !== "collection")
      params.set("collection", collection);
    if (gender && key !== "gender") params.set("gender", gender);
    if (sort && key !== "sort") params.set("sort", sort);
    if (value) params.set(key, value);
    const qs = params.toString();
    return `/${locale}/catalog${qs ? `?${qs}` : ""}`;
  };

  const sortKey = (sort ?? "popular") as SortKey;
  const selectedGender =
    gender === "male" || gender === "female" || gender === "unisex"
      ? gender
      : null;

  const allProducts = await getProducts();
  const collections = await getCollections();
  const wishlist = await getWishlistIds();
  let filtered = [...allProducts];
  if (collection)
    filtered = filtered.filter((p) => p.collection === collection);
  if (selectedGender)
    filtered = filtered.filter((p) => p.gender === selectedGender);

  switch (sortKey) {
    case "popular":
      filtered.sort(
        (a, b) =>
          Number(b.isBestseller) - Number(a.isBestseller) ||
          b.reviewsCount - a.reviewsCount,
      );
      break;
    case "newest":
      filtered.sort((a, b) => Number(b.isNew) - Number(a.isNew));
      break;
    case "price-asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
  }

  const hasFilters = Boolean(collection) || Boolean(selectedGender);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      {/* العنوان */}
      <Reveal>
        <header className="mb-8 flex flex-col gap-2">
          <h1 className="font-display text-4xl font-bold">
            {dict.catalog.title}
          </h1>
          <p className="text-muted-foreground">{dict.catalog.subtitle}</p>
        </header>
      </Reveal>

      {/* شريط الفلاتر */}
      <Reveal delay={0.1}>
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-card/40 p-4 lg:flex-row lg:items-center lg:justify-between">
          {/* المجموعات */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {dict.catalog.collectionFilter}
            </span>
            <FilterLink
              href={buildFilterUrl("collection", null)}
              active={!collection}
            >
              {dict.catalog.all}
            </FilterLink>
            {collections.map((c) => (
              <FilterLink
                key={c.slug}
                href={buildFilterUrl("collection", c.slug)}
                active={collection === c.slug}
              >
                {locale === "ar" ? c.nameAr : c.nameEn}
              </FilterLink>
            ))}
          </div>

          {/* النوع */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {dict.catalog.gender}
            </span>
            <FilterLink
              href={buildFilterUrl("gender", null)}
              active={!selectedGender}
            >
              {dict.catalog.all}
            </FilterLink>
            {genderOptions.map((opt) => (
              <FilterLink
                key={opt.value}
                href={buildFilterUrl("gender", opt.value)}
                active={selectedGender === opt.value}
              >
                {dict.product[opt.labelKey]}
              </FilterLink>
            ))}
          </div>

          {/* الترتيب */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {dict.catalog.sort}
            </span>
            <CatalogSort locale={locale} />
          </div>
        </div>
      </Reveal>

      {/* مسح الفلاتر */}
      {hasFilters && (
        <div className="mb-6">
          <Link
            href={`/${locale}/catalog`}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {dict.catalog.clearFilters}
          </Link>
        </div>
      )}

      {/* النتائج */}
      {filtered.length > 0 ? (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            {filtered.length} {dict.catalog.results}
          </p>
          <RevealStagger className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {filtered.map((product) => (
              <RevealItem key={product.id}>
                <ProductCard
                  product={product}
                  locale={locale}
                  wishlisted={wishlist?.includes(product.id) ?? null}
                />
              </RevealItem>
            ))}
          </RevealStagger>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-full">
            {allProducts[0] ? (
              <ProductArt
                product={allProducts[0]}
                showName={false}
                className="size-24"
              />
            ) : null}
          </div>
          <p className="text-lg font-medium">{dict.catalog.noResults}</p>
          <Link
            href={`/${locale}/catalog`}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {dict.catalog.clearFilters}
          </Link>
        </div>
      )}
    </main>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
