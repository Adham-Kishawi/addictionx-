"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// كل عنصر يحمل snapshot كامل من لحظة إضافته للسلة —
// اسم/سعر/حجم/tدرجات اللون — حتى لا يحتاج الـ client للاستعلام عن الـ DB
// ولتتحقق الواجهة والـ server من نفس السعر وقت إنشاء الطلب.
export type CartItem = {
  productId: string;
  quantity: number;
  nameAr: string;
  nameEn: string;
  price: number; // بالقروش — سعر الـ variant المضاف
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
      // سلات الإصدار القديم (بلا snapshot) تُهجر بأمان
      migrate: () => ({ items: [], isOpen: false }),
    },
  ),
);

// أدوات مساعدة (خارج الـ store حتى تستخدم في أي مكان)
export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
