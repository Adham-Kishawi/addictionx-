"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Locale, Dictionary } from "@/lib/i18n/dictionary";
import type { Product } from "@/features/catalog/data/products";
import { formatPrice } from "@/features/catalog/data/products";
import { AddToCartButton } from "./add-to-cart-button";

export function PurchaseBox({
  product,
  locale,
  dict,
}: {
  product: Product;
  locale: Locale;
  dict: Dictionary;
}) {
  const sizes = product.sizes ?? [];
  const hasVariants = sizes.length > 0;

  // Preselect the first size that is in stock so the button is always usable.
  const [selectedSizeMl, setSelectedSizeMl] = useState<number | undefined>(
    () => (sizes.find((s) => s.stock > 0) ?? sizes[0])?.sizeMl,
  );

  const selectedSize = sizes.find((s) => s.sizeMl === selectedSizeMl);
  const price =
    hasVariants && selectedSize ? selectedSize.price : product.price;
  const soldOut = hasVariants
    ? selectedSize
      ? selectedSize.stock === 0
      : true
    : product.isSoldOut;

  // Stock remaining for the low-stock warning
  const stockRemaining = hasVariants
    ? (selectedSize?.stock ?? 0)
    : (product.stock ?? 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Price — updates when the selected size changes */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-3xl font-bold tracking-tight">
          {formatPrice(price)}
        </span>
        <span className="text-sm text-muted-foreground">
          {dict.product.currency}
        </span>
        {product.compareAtPrice != null && product.compareAtPrice > price && (
          <span className="text-lg text-muted-foreground line-through">
            {formatPrice(product.compareAtPrice)}
            <span className="ms-1 text-xs">{dict.product.currency}</span>
          </span>
        )}
      </div>

      {/* Size selector — only when the product has variants */}
      {hasVariants && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">
            {dict.product.selectSize}
          </span>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const out = s.stock === 0;
              const active = selectedSizeMl === s.sizeMl;
              return (
                <button
                  key={s.sizeMl}
                  type="button"
                  disabled={out}
                  onClick={() => setSelectedSizeMl(s.sizeMl)}
                  className={cn(
                    "relative rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/50",
                    out && "cursor-not-allowed opacity-50",
                  )}
                >
                  {s.sizeMl}ml
                  {out && (
                    <span className="block text-[11px] font-normal opacity-90">
                      {dict.product.outOfStock}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AddToCartButton
        product={product}
        locale={locale}
        isSoldOut={soldOut}
        selectedSize={selectedSize}
      />

      {/* Low-stock warning — show when ≤5 units remain for selected size/product */}
      {!soldOut && stockRemaining > 0 && stockRemaining <= 5 && (
        <p className="text-sm font-medium text-amber-400">
          {dict.product.onlyLeft.replace("{{n}}", String(stockRemaining))}
        </p>
      )}
    </div>
  );
}
