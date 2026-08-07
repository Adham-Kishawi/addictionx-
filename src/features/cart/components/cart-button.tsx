"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, getCartItemCount } from "@/stores/cart-store";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";
import { AnimatePresence, motion } from "framer-motion";

export function CartButton({ locale }: { locale: Locale }) {
  const items = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.openCart);
  const count = getCartItemCount(items);
  const dict = getDictionary(locale);
  const [bump, setBump] = useState(0);

  // نبضة عند وصول جرعة "طيران المنتج للسلة"
  useEffect(() => {
    const onBump = () => setBump((b) => b + 1);
    window.addEventListener("addictionx:cart-bump", onBump);
    return () => window.removeEventListener("addictionx:cart-bump", onBump);
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openCart}
      aria-label={dict.header.cart}
      className="relative"
      data-cart-target
    >
      <motion.span
        key={bump}
        initial={false}
        animate={bump > 0 ? { scale: [1, 1.35, 1], rotate: [0, -8, 8, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="inline-flex"
      >
        <ShoppingBag className="size-5" />
      </motion.span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            className="absolute -top-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-foreground"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
