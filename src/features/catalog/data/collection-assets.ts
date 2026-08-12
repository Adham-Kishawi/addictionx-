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
