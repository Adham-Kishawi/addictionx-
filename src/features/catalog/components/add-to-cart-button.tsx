"use client";

import { useState, type MouseEvent } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { flyToCart } from "@/components/motion/fly-to-cart";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";
import type { Product } from "@/features/catalog/data/products";

export function AddToCartButton({
  product,
  locale,
  isSoldOut,
}: {
  product: Product;
  locale: Locale;
  isSoldOut?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const dict = getDictionary(locale);

  const handleAdd = (e: MouseEvent<HTMLButtonElement>) => {
    addItem({
      productId: product.id,
      quantity,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      price: product.price,
      sizeMl: product.sizeMl ?? 100,
      art: product.art,
      image: product.image,
    });
    flyToCart(e.currentTarget.getBoundingClientRect());
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Quantity control */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {dict.cart.quantity}
        </span>
        <div className="flex items-center gap-1 rounded-full border border-border px-1 py-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            aria-label="+"
          >
            +
          </Button>
          <span className="w-8 text-center text-sm font-bold tabular-nums">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="-"
          >
            -
          </Button>
        </div>
      </div>

      <motion.div whileTap={{ scale: 0.97 }}>
        <Button
          size="lg"
          disabled={isSoldOut || added}
          onClick={handleAdd}
          className="h-12 w-full rounded-full text-base"
        >
          <motion.span
            key={added ? "yes" : "no"}
            initial={added ? { scale: 0.6, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2"
          >
            {added ? (
              <>
                <Check className="size-5" />
                {dict.product.added}
              </>
            ) : (
              <>
                <ShoppingBag className="size-5" />
                {isSoldOut ? dict.product.outOfStock : dict.product.addToCart}
              </>
            )}
          </motion.span>
        </Button>
      </motion.div>
    </div>
  );
}
