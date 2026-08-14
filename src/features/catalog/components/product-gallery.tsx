"use client";

import { useCallback, useState } from "react";
import {
  ProductArt,
  type ProductArtSource,
} from "@/features/catalog/components/product-art";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Interactive gallery — main visual + thumbnail strip. The main visual uses
// ProductArt with the active image injected, so products without real photos
// still render their gradient art as the visible fallback.
//
// Multi-angle: every product automatically gets the studio set — front
// (prodact.png or the product's own photo) + back + side (walid's back.png
// + side.png) — so the customer sees the bottle from several angles.
// Real per-product uploads (product.images from the DB) come first and
// override the fallbacks.
//
// Prev/next arrows flip through the views and wrap around; keyboard
// ArrowLeft/ArrowRight works when the main visual is focused.

const FRONT_FALLBACK = "/uploads/prodact.png";
const FALLBACK_VIEWS = ["/uploads/back.png", "/uploads/side.png"];

export function ProductGallery({
  product,
  dict,
}: {
  product: ProductArtSource & { images?: string[]; id: string };
  dict: Dictionary;
}) {
  const views = Array.from(
    new Set([
      ...(product.images ?? []),
      product.image ?? FRONT_FALLBACK,
      ...FALLBACK_VIEWS,
    ]),
  ).slice(0, 3);
  const [active, setActive] = useState(0);
  const count = views.length;

  const goTo = useCallback(
    (i: number) => {
      setActive(((i % count) + count) % count);
    },
    [count],
  );

  const goPrev = useCallback(() => goTo(active - 1), [goTo, active]);
  const goNext = useCallback(() => goTo(active + 1), [goTo, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    }
  };

  const activeProduct: ProductArtSource =
    views.length > 0 ? { ...product, image: views[active] } : product;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border focus-visible:ring-2 focus-visible:ring-ring"
        tabIndex={count > 1 ? 0 : -1}
        role="group"
        aria-roledescription="image gallery"
        aria-label={`${product.nameEn} images`}
        onKeyDown={onKeyDown}
      >
        <ProductArt product={activeProduct} className="h-full w-full" />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label={dict.product.galleryPrev}
              className="absolute top-1/2 start-3 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/70 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5 rtl:rotate-180"
                aria-hidden
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label={dict.product.galleryNext}
              className="absolute top-1/2 end-3 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/70 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5 rtl:rotate-180"
                aria-hidden
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="flex flex-wrap gap-2">
          {views.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
              aria-current={i === active}
              className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                i === active
                  ? "border-primary"
                  : "border-border opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
