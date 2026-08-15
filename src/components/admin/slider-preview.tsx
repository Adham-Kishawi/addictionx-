"use client";

import { useState } from "react";
import { Play, Images } from "lucide-react";
import { formatPrice } from "@/features/catalog/data/products";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";

// Live preview of the home slider, mirroring the storefront logic:
// visible slides only, slide image overrides the product image, and the
// slide caption (AR/EN) beats the collection description fallback.

export type PreviewSlide = {
  id: string;
  image: string | null;
  captionAr: string | null;
  captionEn: string | null;
  product: {
    name: string;
    nameEn: string | null;
    image: string | null;
    collection: string | null;
    price: number;
  };
};

export type PreviewCollection = {
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
};

export function SliderPreview({
  slides,
  collections,
  locale,
  dict,
}: {
  slides: PreviewSlide[];
  collections: PreviewCollection[];
  locale: string;
  dict: Dictionary;
}) {
  const isRtl = locale === "ar";
  // Only slides the storefront actually renders.
  const visible = slides.filter((s) => s.product.image || s.image);
  const [index, setIndex] = useState(0);
  const current = visible[Math.min(index, visible.length - 1)] ?? null;

  const collectionName = (slug: string | null) => {
    const c = collections.find((col) => col.slug === slug);
    if (!c) return "";
    return isRtl ? c.nameAr : c.nameEn;
  };

  const caption = (slide: PreviewSlide) => {
    const direct = isRtl ? slide.captionAr : slide.captionEn;
    if (direct) return direct;
    const c = collections.find((col) => col.slug === slide.product.collection);
    return isRtl
      ? (c?.descriptionAr ?? "")
      : (c?.descriptionEn ?? c?.descriptionAr ?? "");
  };

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Play className="size-4 text-primary" />
        <h3 className="font-display text-lg font-bold">
          {dict.admin.sliderPreview}
        </h3>
        <span className="text-xs text-muted-foreground">
          {dict.admin.sliderPreviewHint}
        </span>
      </div>

      {!current ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-background py-14 text-center">
          <Images className="size-8 text-muted-foreground/50" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {dict.admin.sliderEmpty}
          </p>
        </div>
      ) : (
        <>
          {/* Main preview panel */}
          <div className="flex flex-col gap-5 rounded-xl border border-border/60 bg-background p-5 sm:flex-row sm:items-center">
            <div className="relative mx-auto aspect-[0.9/1] w-44 shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-muted/60 to-muted sm:w-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.image ?? current.product.image ?? ""}
                alt=""
                className="h-full w-full object-contain object-bottom"
              />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-start">
              {current.product.collection && (
                <p className="mb-1 flex items-center justify-center gap-2 text-xs font-medium text-primary sm:justify-start">
                  <span
                    className="size-1.5 rounded-full bg-primary"
                    aria-hidden
                  />
                  {collectionName(current.product.collection)}
                </p>
              )}
              <h4 className="font-display text-xl font-bold">
                {isRtl
                  ? current.product.name
                  : current.product.nameEn || current.product.name}
              </h4>
              {caption(current) && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {caption(current)}
                </p>
              )}
              <p className="mt-2 text-sm font-semibold">
                {formatPrice(current.product.price)} {dict.product.currency}
              </p>
            </div>
          </div>

          {/* Thumbnails */}
          {visible.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {visible.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  title={
                    isRtl
                      ? slide.product.name
                      : slide.product.nameEn || slide.product.name
                  }
                  className={cn(
                    "relative h-14 w-14 overflow-hidden rounded-lg border bg-muted transition-colors",
                    i === index
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border/60 opacity-70 hover:opacity-100",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.image ?? slide.product.image ?? ""}
                    alt=""
                    className="h-full w-full object-contain object-bottom"
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
