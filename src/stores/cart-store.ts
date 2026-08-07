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
  price: number; // in piasters — the added variant's price
  sizeMl: number;
  art: { from: string; to: string; glow: string };
  image?: string;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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
          const existing = state.items.find(
            (i) => i.productId === item.productId,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
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

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i,
                ),
        })),

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "addictionx-cart",
      version: 2,
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
