"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// ============================================================
// طيران المنتج للسلة — جرعة ضوء تتطاير من زر الإضافة إلى أيقونة
// السلة في الهيدر، ثم نبضة على العدّاد.
// الاستخدام: استدعي flyToCart(e.currentTarget.getBoundingClientRect())
// من أي زر إضافة، وارفع <CartFlyProvider/> في الـ layout الجذري.
// ============================================================

export function flyToCart(rect: DOMRect) {
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  window.dispatchEvent(
    new CustomEvent("addictionx:fly-to-cart", { detail: { x, y } }),
  );
}

type FlyParticle = { id: number; x: number; y: number; tx: number; ty: number };

export function CartFlyProvider({ children }: { children: ReactNode }) {
  const [particles, setParticles] = useState<FlyParticle[]>([]);
  const idRef = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onFly = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      const cartEl = document.querySelector("[data-cart-target]");
      let tx = x;
      let ty = y;
      if (cartEl) {
        const r = cartEl.getBoundingClientRect();
        tx = r.left + r.width / 2;
        ty = r.top + r.height / 2;
      }
      const id = ++idRef.current;
      setParticles((p) => [...p, { id, x, y, tx, ty }]);
      window.setTimeout(() => {
        setParticles((p) => p.filter((part) => part.id !== id));
        window.dispatchEvent(new CustomEvent("addictionx:cart-bump"));
      }, 850);
    };
    window.addEventListener("addictionx:fly-to-cart", onFly);
    return () => window.removeEventListener("addictionx:fly-to-cart", onFly);
  }, []);

  if (reduce) return <>{children}</>;

  return (
    <>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[100]">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              aria-hidden
              className="absolute size-3 rounded-full bg-primary"
              style={{
                left: p.x,
                top: p.y,
                boxShadow: "0 0 14px 2px oklch(0.6 0.22 22 / 0.9)",
              }}
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                left: p.tx,
                top: [p.y, p.y - 110, p.ty],
                scale: [1, 1.3, 0.25],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
                times: [0, 0.5, 1],
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
