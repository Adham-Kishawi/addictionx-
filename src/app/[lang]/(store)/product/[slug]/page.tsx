import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { ProductGallery } from "@/features/catalog/components/product-gallery";
import { PurchaseBox } from "@/features/catalog/components/purchase-box";
import {
  getProductBySlug,
  getCollections,
} from "@/features/catalog/data/products-db";
import { getWishlistIds } from "@/features/account/data";
import { WishlistButton } from "@/components/wishlist-button";
import { StarDisplay } from "@/features/reviews/components/star-input";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { siteUrl } from "@/lib/site-url";
import { Reveal } from "@/components/motion/reveal";
import { SectionGlow } from "@/components/motion/section-glow";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const isAr = locale === "ar";
  const name = isAr ? product.nameAr : product.nameEn;
  const description = isAr ? product.descriptionAr : product.descriptionEn;
  const path = `/${locale}/product/${product.slug}`;
  return {
    title: name,
    description,
    alternates: {
      canonical: path,
      languages: {
        en: `/en/product/${product.slug}`,
        ar: `/ar/product/${product.slug}`,
      },
    },
    openGraph: {
      title: name,
      description,
      type: "website",
      locale: isAr ? "ar_EG" : "en_US",
      url: path,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const wishlist = await getWishlistIds();
  const wishlisted = wishlist?.includes(product.id) ?? null;

  const [collections, session] = await Promise.all([getCollections(), auth()]);

  const approvedReviews = await prisma.review.findMany({
    where: { productId: product.id, isApproved: true, isHidden: false },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  const myReview = session?.user
    ? await prisma.review.findUnique({
        where: {
          productId_userId: { productId: product.id, userId: session.user.id },
        },
        select: { rating: true, title: true, content: true },
      })
    : null;
  const existingReview = myReview
    ? {
        rating: myReview.rating,
        title: myReview.title ?? "",
        content: myReview.content ?? "",
      }
    : null;

  const isAr = locale === "ar";
  const name = isAr ? product.nameAr : product.nameEn;
  const description = isAr ? product.descriptionAr : product.descriptionEn;
  const collectionMeta = collections.find((c) => c.slug === product.collection);

  const canonicalUrl = `${siteUrl}/${locale}/product/${product.slug}`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: [`${canonicalUrl}/opengraph-image`],
    brand: { "@type": "Brand", name: "ADDICTIONX" },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      price: (product.price / 100).toFixed(2),
      priceCurrency: "EGP",
      availability: product.isSoldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
    ...(product.reviewsCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewsCount,
          },
        }
      : {}),
  };

  return (
    <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <SectionGlow />
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/${locale}`}
          className="transition-colors hover:text-foreground"
        >
          {dict.nav.home}
        </Link>
        <span>/</span>
        <Link
          href={`/${locale}/catalog`}
          className="transition-colors hover:text-foreground"
        >
          {dict.nav.shop}
        </Link>
        <span>/</span>
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <Reveal y={40}>
          <div className="relative">
            <ProductGallery key={product.id} product={product} dict={dict} />
            {/* Badges */}
            <div className="absolute top-4 start-4 z-10 flex flex-col gap-2">
              {product.isNew && (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {dict.product.new}
                </span>
              )}
              {product.isBestseller && (
                <span className="rounded-full bg-card/90 px-3 py-1 text-xs font-semibold backdrop-blur">
                  {dict.product.bestseller}
                </span>
              )}
            </div>
          </div>
        </Reveal>

        {/* Details */}
        <Reveal delay={0.15} y={40}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                {isAr ? collectionMeta?.nameAr : collectionMeta?.nameEn}
              </span>
              <h1 className="font-display text-4xl font-bold sm:text-5xl">
                {name}
              </h1>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <Star className="size-4 fill-primary text-primary" />
                  {product.rating}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({product.reviewsCount} {dict.product.reviews})
                </span>
                <span className="mx-2 h-4 w-px bg-border" />
                <span className="text-sm text-muted-foreground">
                  {dict.product.gender}:{" "}
                  <span className="text-foreground">
                    {dict.product[product.gender]}
                  </span>
                </span>
              </div>
            </div>

            <p className="leading-relaxed text-muted-foreground">
              {description}
            </p>

            {/* Purchase box — price + size selector + add to cart */}
            <PurchaseBox product={product} locale={locale} dict={dict} />

            {/* Notes — perfume pyramid (top → heart → base) */}
            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <span className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                {dict.product.notes}
              </span>
              <div className="flex flex-col items-center gap-2.5">
                <NoteRow
                  label={dict.product.topNotes}
                  notes={product.notes.top}
                  width="w-4/5"
                  accent="bg-amber-400"
                />
                <NoteRow
                  label={dict.product.heartNotes}
                  notes={product.notes.heart}
                  width="w-[88%]"
                  accent="bg-violet-400"
                />
                <NoteRow
                  label={dict.product.baseNotes}
                  notes={product.notes.base}
                  width="w-full"
                  accent="bg-sky-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {wishlisted !== null && (
                <div className="flex items-center gap-3">
                  <WishlistButton
                    productId={product.id}
                    initial={wishlisted}
                    labels={{
                      add: dict.account.addToWishlist,
                      remove: dict.account.removeFromWishlist,
                    }}
                    className="h-11 w-11"
                  />
                  <span className="text-sm text-muted-foreground">
                    {wishlisted
                      ? dict.account.removeFromWishlist
                      : dict.account.addToWishlist}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>

      {/* ====== Reviews ====== */}
      <section className="mx-auto mt-20 max-w-4xl">
        <Reveal>
          <div className="mb-8 flex flex-col gap-3">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              {dict.reviews.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <StarDisplay value={product.rating} />
              <span className="font-semibold">
                {product.rating.toFixed(1)}/5
              </span>
              <span className="text-muted-foreground">
                ({product.reviewsCount} {dict.product.reviews})
              </span>
            </div>
          </div>
        </Reveal>

        {approvedReviews.length > 0 ? (
          <div className="flex flex-col gap-4">
            {approvedReviews.map((review) => (
              <Reveal key={review.id}>
                <article className="rounded-2xl border border-border bg-card/40 p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StarDisplay value={review.rating} />
                    {review.title && (
                      <span className="font-semibold">{review.title}</span>
                    )}
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                    {review.content}
                  </p>
                  <span className="text-xs text-muted-foreground/70">
                    {review.user.name || dict.reviews.reviewOn}{" "}
                    <span className="text-muted-foreground">
                      {review.createdAt.toLocaleDateString(
                        isAr ? "ar-EG" : "en-US",
                      )}
                    </span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            {dict.reviews.noReviews}
          </p>
        )}

        <div className="mt-8">
          {session?.user ? (
            <ReviewForm
              productId={product.id}
              existing={existingReview}
              dict={dict}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link
                href={`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/product/${product.slug}`)}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {dict.reviews.loginPrompt}
              </Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function NoteRow({
  label,
  notes,
  width,
  accent,
}: {
  label: string;
  notes: string[];
  width: string;
  accent: string;
}) {
  if (notes.length === 0) return null;
  return (
    <div
      className={`group relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-background/80 to-background/40 p-4 backdrop-blur-sm transition-all hover:border-border hover:shadow-lg ${width}`}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={`size-2 rounded-full ${accent} shadow-lg`}
        />
        <span className="text-xs font-bold uppercase tracking-widest text-foreground/90">
          {label}
        </span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {notes.map((note) => (
          <li key={note}>
            <span className="inline-flex items-center rounded-lg border border-border/50 bg-card/60 px-3 py-1.5 text-sm font-medium text-foreground/90 shadow-sm transition-colors hover:border-border hover:bg-card">
              {note}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
