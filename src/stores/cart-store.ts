"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Each item carries a full snapshot from the moment it was added to the cart —
// name/price/size/shade — so the client doesn't need to query the DB
// and the UI and server validate the same price when the order is created.
export type CartItem = {
  productId: string;
  quantity: number;
  nameAr: string;
  nameEn: string;
  price: number; // in piasters — the selected size's price (or base price)
  // Selected size in ml — undefined for variant-less products
  sizeMl?: number;
  art: { from: string; to: string; glow: string };
  image?: string;
};

// Cart lines are keyed by product + size: the same perfume in 100ml and 50ml
// are two separate lines (each with its own price/quantity).
export function cartItemKey(item: Pick<CartItem, "productId" | "sizeMl">) {
  return item.sizeMl ? `${item.productId}:${item.sizeMl}` : item.productId;
}

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (item) =>
        set((state) => {
          const key = cartItemKey(item);
          const existing = state.items.find((i) => cartItemKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartItemKey(i) === key
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, item],
            isOpen: true,
          };
        }),

      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((i) => cartItemKey(i) !== key),
        })),

      updateQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => cartItemKey(i) !== key)
              : state.items.map((i) =>
                  cartItemKey(i) === key ? { ...i, quantity } : i,
                ),
        })),

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "addictionx-cart",
      version: 3,
      // Old-version carts (without snapshot) are safely discarded
      migrate: () => ({ items: [], isOpen: false }),
    },
  ),
);

// Helpers (outside the store so they can be used anywhere)
export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
