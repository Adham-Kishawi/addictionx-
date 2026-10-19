import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const getWishlistIds = cache(async (): Promise<string[] | null> => {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    const items = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      select: { productId: true },
    });
    return items.map((i) => i.productId);
  } catch (error) {
    console.error("[wishlist] getWishlistIds lookup failed:", error);
    return null;
  }
});
