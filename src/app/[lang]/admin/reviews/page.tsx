import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { StarDisplay } from "@/features/reviews/components/star-input";
import { ReviewActions } from "@/components/admin/review-actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  await requirePermission("reviews");
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { slug: true, name: true, nameEn: true } },
      user: { select: { name: true, email: true } },
    },
  });

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
    </div>
  );
}
