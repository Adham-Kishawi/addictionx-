"use client";

import { useState } from "react";
import {
  ProductArt,
  type ProductArtSource,
} from "@/features/catalog/components/product-art";

// Interactive gallery — main visual + thumbnail strip. The main visual uses
// ProductArt with the active image injected, so products without real photos
// still render their gradient art as the visible fallback.
//
// Multi-angle: every product with a photo automatically gets the shared
// back/side studio shots appended (walid's back.png + side.png), so the
// customer sees the bottle from several angles. Real per-product uploads
// (product.images from the DB) come first and override the fallbacks.

const FALLBACK_VIEWS = ["/uploads/back.png", "/uploads/side.png"];

export function ProductGallery({
  product,
}: {
  product: ProductArtSource & { images?: string[] };
}) {
  const dbImages = product.images ?? [];
  const views = product.image
    ? Array.from(new Set([...dbImages, ...FALLBACK_VIEWS])).slice(0, 3)
    : dbImages;
  const [active, setActive] = useState(0);

  const activeProduct: ProductArtSource =
    views.length > 0 ? { ...product, image: views[active] } : product;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border">
        <ProductArt product={activeProduct} className="h-full w-full" />
      </div>
      {views.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {views.map((url, i) => (
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
