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

// Wave 41 (The Shelf): walid's freshly generated bottle renders (1086×1448,
// black background keyed out to transparency). Object-contain inside the glass
// cards; the reflection uses the same asset flipped.
export const SHELF_BOTTLES: Record<string, string> = {
  rush: "/shelf/rush.png",
  noir: "/shelf/noir.png",
  gold: "/shelf/gold.png",
};

// Dominant color sampled from each generated bottle — drives the shelf's
// per-collection lighting so the card + background glow match the bottle.
export const SHELF_TINTS: Record<string, string> = {
  rush: "#9a221c",
  noir: "#514c82",
  gold: "#925414",
};

export function shelfTint(slug: string): string | null {
  return SHELF_TINTS[slug] ?? null;
}

export function shelfBottle(slug: string): string | null {
  return SHELF_BOTTLES[slug] ?? null;
}
