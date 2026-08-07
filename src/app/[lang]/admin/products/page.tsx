import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { formatPrice } from "@/features/catalog/data/products";
import { ProductArt } from "@/features/catalog/components/product-art";
import { toStorefrontProduct } from "@/features/admin/mappers";
import { ProductActions } from "@/components/admin/product-actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string; sale?: string }>;
}) {
  const [{ lang }, st] = await Promise.all([params, searchParams]);
  const { q, sale } = st;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);
  const query = (q ?? "").trim();
  const saleOnly = sale === "1" || sale === "true";

  const products = await prisma.product.findMany({
    where: {
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { nameEn: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(saleOnly ? { NOT: { compareAtPrice: null } } : {}),
    },
    include: { variants: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">
          {dict.admin.products}
        </h1>
        <Link
          href={`/${locale}/admin/products/new`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <Plus className="size-4" />
          {dict.admin.addProduct}
        </Link>
      </div>

      <form className="mb-6">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={dict.admin.searchProducts}
            className="h-10 w-full rounded-lg border border-border bg-background ps-9 pe-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          href={`/${locale}/admin/products`}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
            !saleOnly
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {dict.catalog.all}
        </Link>
        <Link
          href={`/${locale}/admin/products?sale=1`}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
            saleOnly
              ? "border-destructive bg-destructive text-destructive-foreground"
              : "border-border text-muted-foreground hover:border-destructive/40 hover:text-foreground"
          }`}
        >
          {dict.admin.onSale}
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {dict.admin.noProducts}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.name}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.price}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {dict.admin.stock}
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
              {products.map((product) => {
                const totalStock = product.variants.reduce(
                  (sum, v) => sum + v.stock,
                  0,
                );
                const minPrice =
                  product.variants[0]?.price ?? product.basePrice;
                return (
                  <tr
                    key={product.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-border">
                          <ProductArt
                            product={toStorefrontProduct(product)}
                            showName={false}
                            className="size-12"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          <p
                            className="truncate text-xs text-muted-foreground"
                            dir="ltr"
                          >
                            {product.nameEn || product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium" dir="ltr">
                      <div className="flex items-center gap-2">
                        {formatPrice(minPrice)} {dict.product.currency}
                        {product.compareAtPrice &&
                          product.compareAtPrice > minPrice && (
                            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[0.65rem] font-semibold text-destructive">
                              {dict.admin.onSale}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          totalStock === 0
                            ? "text-destructive"
                            : totalStock <= 10
                              ? "text-amber-500"
                              : "text-muted-foreground"
                        }
                      >
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.isActive
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {product.isActive
                          ? dict.admin.active
                          : dict.admin.inactive}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <ProductActions
                        id={product.id}
                        isActive={product.isActive}
                        locale={locale}
                        dict={dict}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
