import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { StarDisplay } from "@/features/reviews/components/star-input";
import { ReviewActions } from "@/components/admin/review-actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission("reviews");
  const [{ lang }, { page }] = await Promise.all([params, searchParams]);
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const currentPage = Math.max(1, Number(page) || 1);

  const [reviews, totalReviews] = await Promise.all([
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        product: { select: { slug: true, name: true, nameEn: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.review.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalReviews / PAGE_SIZE));

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">
        {dict.admin.reviews}
      </h1>

      {reviews.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {dict.reviews.noReviews}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-border bg-card/40 p-4"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <StarDisplay value={review.rating} />
                  <span className="font-medium">{review.title}</span>
                </div>
                {!review.isApproved && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                    {dict.reviews.pendingBadge}
                  </span>
                )}
              </div>
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                {review.content}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="font-medium text-foreground">
                    {review.user.name || review.user.email}
                  </span>
                  <span>{dict.reviews.by}</span>
                  <Link
                    href={`/${locale}/product/${review.product.slug}`}
                    className="text-primary hover:underline"
                  >
                    {locale === "ar"
                      ? review.product.name
                      : review.product.nameEn || review.product.name}
                  </Link>
                  <span>{dict.reviews.reviewOn}</span>
                  <span dir="ltr">
                    {review.createdAt.toLocaleDateString(
                      locale === "ar" ? "ar-EG" : "en-US",
                    )}
                  </span>
                </div>
                <ReviewActions
                  reviewId={review.id}
                  isApproved={review.isApproved}
                  dict={dict}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/${locale}/admin/reviews${p > 1 ? `?page=${p}` : ""}`}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                currentPage === p
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
