"use client";

import { useState } from "react";
import {
  ProductArt,
  type ProductArtSource,
} from "@/features/catalog/components/product-art";

// Interactive gallery — main visual + thumbnail strip. The main visual uses
// ProductArt with the active image injected, so products without real photos
// still render their gradient art as the visible fallback.

export function ProductGallery({
  product,
}: {
  product: ProductArtSource & { images?: string[] };
}) {
  const images = product.images ?? [];
  const [active, setActive] = useState(0);

  const activeProduct: ProductArtSource =
    images.length > 0 ? { ...product, image: images[active] } : product;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border">
        <ProductArt product={activeProduct} className="h-full w-full" />
      </div>
      {images.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
              className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === active
                  ? "border-primary"
                  : "border-border opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
