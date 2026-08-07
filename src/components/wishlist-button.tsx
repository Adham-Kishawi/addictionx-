"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toggleWishlist } from "@/features/account/actions";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  initial,
  labels,
  className,
}: {
  productId: string;
  initial: boolean;
  labels: { add: string; remove: string };
  className?: string;
}) {
  const [active, setActive] = useState(initial);
  const [pending, setPending] = useState(false);

  const onClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    setActive((v) => !v);
    try {
      await toggleWishlist(productId);
    } catch {
      setActive((v) => !v);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? labels.remove : labels.add}
      title={active ? labels.remove : labels.add}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border transition-colors disabled:opacity-50",
        active
          ? "border-destructive bg-destructive text-white"
          : "border-border bg-card/90 text-muted-foreground hover:text-destructive",
        className,
      )}
    >
      {/* انفجار قلب عند التفعيل */}
      <AnimatePresence>
        {active && (
          <motion.span
            key="burst"
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-destructive/60"
          />
        )}
      </AnimatePresence>

      <motion.span
        key={active ? "on" : "off"}
        animate={{
          scale: [0.7, 1.25, 1],
          rotate: active ? [0, -14, 10, 0] : 0,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative inline-flex"
      >
        <Heart className={cn("size-4", active && "fill-current")} />
      </motion.span>
    </button>
  );
}
