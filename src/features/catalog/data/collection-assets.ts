// Wave 10: walid's per-collection ambient backdrops (public/collections/*.jpg,
// 2400×1350 generations). Used by the carousel identity layer, the DepthStack
// covers and the collections hub — anywhere a collection's "mood" is shown.

export const COLLECTION_BACKDROPS: Record<string, string> = {
  rush: "/collections/rush.jpg",
  noir: "/collections/noir.jpg",
  gold: "/collections/gold.jpg",
};

export function collectionBackdrop(slug: string): string | undefined {
  return COLLECTION_BACKDROPS[slug];
}

// Wave 41 (The Shelf): walid's freshly generated bottle renders go in
// public/shelf/*.png (pure black background, product shots, no text on
// bottle). Empty until the generation is delivered — the shelf then falls
// back to the mood backdrops so the section still ships clean.
export const SHELF_BOTTLES: Record<string, string> = {};

export function shelfBottle(slug: string): string | null {
  return SHELF_BOTTLES[slug] ?? null;
}
