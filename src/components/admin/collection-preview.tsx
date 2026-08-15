"use client";

import Image from "next/image";
import { Monitor } from "lucide-react";
import {
  collectionBackdrop,
  shelfTint,
} from "@/features/catalog/data/collection-assets";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { imageAdjustStyle, type ImageAdjust } from "@/lib/image-adjust";

// Live preview of the home "Our Collections" section — mirrors the storefront
// CollectionShelf: one card per collection shown in the section (showInHome and
// site-active), with the collection image (falling back to the fixed backdrop),
// the localized name and the caption from the description. The card frame is
// 3/4 (same as the shelf card) so the admin sees the real crop.

export type PreviewCollectionCard = {
  slug: string;
  nameAr: string;
  nameEn: string;
  image: string | null;
  imageAdjust?: ImageAdjust | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  showInHome: boolean;
  isActive: boolean;
};

export function CollectionPreview({
  collections,
  locale,
  dict,
}: {
  collections: PreviewCollectionCard[];
  locale: string;
  dict: Dictionary;
}) {
  const isRtl = locale === "ar";
  const visible = collections.filter((c) => c.showInHome && c.isActive);

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-base font-bold">
          <Monitor className="size-4 text-primary" />
          {dict.admin.homeCollectionsPreview}
        </h3>
        <span className="text-xs text-muted-foreground">
          {dict.admin.homeCollectionsPreviewHint}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {dict.admin.homeCollectionsEmpty}
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {visible.map((collection) => {
            const image =
              collection.image ?? collectionBackdrop(collection.slug) ?? null;
            const tint = shelfTint(collection.slug) ?? "#ef4444";
            const name = isRtl ? collection.nameAr : collection.nameEn;
            const tagline = isRtl
              ? (collection.descriptionAr ?? "")
              : (collection.descriptionEn ?? collection.descriptionAr ?? "");
            return (
              <div
                key={collection.slug}
                className="flex min-w-0 shrink-0 flex-1 basis-48 flex-col rounded-2xl border border-border/60 bg-background p-4"
              >
                <div
                  className="relative mb-3 flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${tint}33, ${tint}11)`,
                  }}
                >
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 288px, 192px"
                      className="object-cover"
                      style={
                        collection.imageAdjust
                          ? imageAdjustStyle(collection.imageAdjust)
                          : undefined
                      }
                    />
                  ) : (
                    <span
                      className="font-display text-3xl font-bold"
                      style={{ color: tint }}
                    >
                      {name.slice(0, 1)}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm font-semibold">{name}</p>
                {tagline ? (
                  <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-tight text-muted-foreground">
                    {tagline}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {dict.admin.homeCollectionsPreviewTag}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    /{collection.slug}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
