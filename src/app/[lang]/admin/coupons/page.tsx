import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { formatPrice } from "@/features/catalog/data/products";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponActions } from "@/components/admin/coupon-actions";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  await requirePermission("coupons");
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">
        {dict.admin.coupons}
      </h1>

      <div className="mb-6">
        <CouponForm dict={dict} />
      </div>

      {coupons.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {dict.admin.noCoupons}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.couponCode}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.couponValue}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.couponMinOrder}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.couponUsed}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.status}
                </th>
                <th className="px-4 py-3 text-end font-medium">
                  {dict.admin.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr
                  key={coupon.id}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold" dir="ltr">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="px-4 py-3" dir="ltr">
                    {coupon.discountType === "PERCENT" ? (
                      <span className="font-medium">
                        {coupon.discountValue}%
                      </span>
                    ) : (
                      <span className="font-medium">
                        {formatPrice(coupon.discountValue)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                    {(coupon.minOrderAmount ?? 0) > 0
                      ? formatPrice(coupon.minOrderAmount ?? 0)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {coupon.maxUses
                      ? `${coupon.usedCount}/${coupon.maxUses}`
                      : `${coupon.usedCount}/∞`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        coupon.isActive
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {coupon.isActive
                        ? dict.admin.active
                        : dict.admin.inactive}
                    </span>
                    {coupon.expiresAt && coupon.expiresAt < new Date() && (
                      <span className="ms-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        {dict.admin.expired}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <CouponActions
                      couponId={coupon.id}
                      isActive={coupon.isActive}
                      dict={dict}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
