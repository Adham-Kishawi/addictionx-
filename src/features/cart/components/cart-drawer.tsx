"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductArt } from "@/features/catalog/components/product-art";
import { formatPrice } from "@/features/catalog/data/products";
import {
  useCartStore,
  getCartSubtotal,
  getCartItemCount,
  cartItemKey,
} from "@/stores/cart-store";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";

type ShippingConfig = {
  fee: number;
  freeThreshold: number;
  carrier: string;
};

export function CartDrawer({ locale }: { locale: Locale }) {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/shipping-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ShippingConfig | null) => {
        if (data) setShippingConfig(data);
      })
      .catch(() => {});
  }, []);

  const dict = getDictionary(locale);
  const subtotal = getCartSubtotal(items);
  const count = getCartItemCount(items);
  const revealThreshold = shippingConfig?.freeThreshold ?? 150000;
  const freeShippingRemaining = Math.max(0, revealThreshold - subtotal);
  const progress = Math.min(100, (subtotal / revealThreshold) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: locale === "ar" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: locale === "ar" ? "100%" : "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col border-s border-border bg-background"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold">
                {dict.cart.title}
                <span className="ms-2 text-sm font-normal text-muted-foreground">
                  ({count})
                </span>
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeCart}
                aria-label={dict.cart.close}
              >
                <X className="size-5" />
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="flex size-20 items-center justify-center rounded-full border border-border bg-muted/30">
                  <ShoppingBagEmpty />
                </div>
                <p className="text-lg font-medium">{dict.cart.empty}</p>
                <p className="text-sm text-muted-foreground">
                  {dict.cart.emptyHint}
                </p>
                <Button
                  render={<Link href={`/${locale}/catalog`} />}
                  onClick={closeCart}
                >
                  {dict.cart.startShopping}
                </Button>
              </div>
            ) : (
              <>
                {/* Free shipping bar */}
                <div className="border-b border-border px-5 py-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {freeShippingRemaining > 0
                        ? dict.cart.freeShippingProgress.replace(
                            "{amount}",
                            `${formatPrice(freeShippingRemaining)} ${dict.product.currency}`,
                          )
                        : dict.cart.shippingFree}
                    </span>
                    <span className="font-medium text-primary">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={false}
                      animate={{ width: `${progress}%` }}
                      transition={{ type: "spring", stiffness: 120 }}
                    />
                  </div>
                </div>

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <ul className="flex flex-col gap-4">
                    {items.map((item) => {
                      const name = locale === "ar" ? item.nameAr : item.nameEn;
                      return (
                        <li
                          key={cartItemKey(item)}
                          className="flex gap-3 rounded-xl border border-border bg-card p-3"
                        >
                          <ProductArt
                            product={item}
                            showName={false}
                            className="size-20 shrink-0 rounded-lg overflow-hidden"
                          />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold">
                                  {name}
                                </h3>
                                {item.sizeMl && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.sizeMl}ml
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => removeItem(cartItemKey(item))}
                                aria-label={dict.cart.remove}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                            <div className="mt-auto flex items-center justify-between pt-2">
                              {/* Quantity control */}
                              <div className="flex items-center gap-1 rounded-full border border-border px-1 py-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() =>
                                    updateQuantity(
                                      cartItemKey(item),
                                      item.quantity + 1,
                                    )
                                  }
                                  aria-label="+"
                                >
                                  <Plus className="size-3" />
                                </Button>
                                <span className="w-6 text-center text-sm font-medium tabular-nums">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() =>
                                    updateQuantity(
                                      cartItemKey(item),
                                      item.quantity - 1,
                                    )
                                  }
                                  aria-label="-"
                                >
                                  <Minus className="size-3" />
                                </Button>
                              </div>
                              <span className="text-sm font-bold">
                                {formatPrice(item.price * item.quantity)}
                                <span className="ms-1 text-xs font-normal text-muted-foreground">
                                  {dict.product.currency}
                                </span>
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Summary */}
                <div className="border-t border-border px-5 py-4">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {dict.cart.subtotal}
                    </span>
                    <span className="font-semibold">
                      {formatPrice(subtotal)} {dict.product.currency}
                    </span>
                  </div>
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {dict.cart.shipping}
                    </span>
                    <span className="font-medium text-emerald-400">
                      {dict.cart.shippingFree}
                    </span>
                  </div>
                  <Button
                    render={<Link href={`/${locale}/checkout`} />}
                    size="lg"
                    className="w-full"
                    onClick={closeCart}
                  >
                    {dict.cart.checkout}
                  </Button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ShoppingBagEmpty() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-9 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M6 7h12l1 13H5L6 7Z" strokeLinejoin="round" />
      <path d="M9 7a3 3 0 0 1 6 0" strokeLinecap="round" />
    </svg>
  );
}
