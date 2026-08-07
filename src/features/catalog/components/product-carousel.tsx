"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/layout/section-heading";
import { ProductArt } from "@/features/catalog/components/product-art";
import { WishlistButton } from "@/components/wishlist-button";
import { cn } from "@/lib/utils";
import { formatPrice, type Product } from "@/features/catalog/data/products";
import type { Locale, Dictionary } from "@/lib/i18n/dictionary";

// ============================================================
// كاروسيل الأدوار — منتج واحد عن كل مجموعة.
//
// الفكرة الجوهرية: لا نحرّك أي عنصر من مكان إلى مكان — كل عنصر
// يسأل «ما دوري الآن؟» ويطبّق ستايله. عند تغيّر activeIndex تتبادل
// الأدوار و الـ CSS transition هو من يرى الفرق وينفّذ الحركة.
// لذلك هنا **CSS transitions لا Framer Motion** — استثناء مقصود
// من قاعدة المشروع وسببه الأداء (مسجّل في CLAUDE.md).
// مع 3 عناصر يُلغى دور back حتى لا يقع تعارض left == back.
// ============================================================

type Role = "center" | "left" | "right" | "back";

const ROLE_STYLES: Record<
  Role,
  {
    scale: number;
    blur: number;
    opacity: number;
    z: number;
    left: number;
    height: number;
  }
> = {
  center: { scale: 1, blur: 0, opacity: 1, z: 20, left: 50, height: 100 },
  left: { scale: 0.58, blur: 2, opacity: 0.8, z: 10, left: 22, height: 62 },
  right: { scale: 0.58, blur: 2, opacity: 0.8, z: 10, left: 78, height: 62 },
  back: { scale: 0.5, blur: 4, opacity: 0.55, z: 5, left: 50, height: 54 },
};

const ANIM_MS = 650;
const SWIPE_THRESHOLD = 50;
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

function slideLabel(product: Product) {
  return `${product.nameAr} — ${product.nameEn}`;
}

export function ProductCarousel({
  products,
  locale,
  wishlistIds,
  dict,
}: {
  products: Product[];
  locale: Locale;
  wishlistIds: string[] | null;
  dict: Dictionary;
}) {
  const reduce = useReducedMotion();

  const total = products.length;
  const isRtl = locale === "ar";

  const [active, setActive] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const inViewRef = useRef(true);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  const center = active;
  const right = (active + 1) % total;
  const left = (active + total - 1) % total;
  const back = total > 3 ? (active + 2) % total : null;

  const roleOf = useCallback(
    (i: number): Role => {
      if (i === center) return "center";
      if (i === right) return "right";
      if (i === left) return "left";
      if (back !== null && i === back) return "back";
      return "center";
    },
    [center, right, left, back],
  );

  const goTo = useCallback(
    (i: number) => {
      if (!inViewRef.current || isAnimating) return;
      const target = ((i % total) + total) % total;
      if (target === active) return;
      setIsAnimating(true);
      setActive(target);
    },
    [isAnimating, active, total],
  );

  const goPrev = useCallback(() => goTo(left), [goTo, left]);
  const goNext = useCallback(() => goTo(right), [goTo, right]);

  // إطلاق القفل بعد انتهاء الـ transition بالضبط (يُطابق ANIM_MS)
  useEffect(() => {
    if (!isAnimating) return;
    const t = window.setTimeout(() => setIsAnimating(false), ANIM_MS);
    return () => window.clearTimeout(t);
  }, [isAnimating]);

  // ============ السحب باللمس (swipe) ============
  const onPointerDown = (e: React.PointerEvent) => {
    pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const p = pointerRef.current;
    if (!p.active) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    // السحب الرأسي = تمرير الصفحة — لا نعترضه إطلاقًا
    if (Math.abs(dy) > Math.abs(dx)) {
      p.active = false;
      return;
    }
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      p.active = false;
      // في RTL عكس الاتجاهات المنطقية
      const dir = dx < 0 ? 1 : -1;
      goTo(active + dir * (isRtl ? -1 : 1));
    }
  };
  const onPointerUp = () => {
    pointerRef.current.active = false;
  };

  // ============ الإيقاف عند الخروج من الشاشة ============
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry?.isIntersecting ?? false;
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ============ الكيبورد (احترام RTL) ============
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(active + (isRtl ? -1 : 1));
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(active + (isRtl ? 1 : -1));
    }
  };

  const activeProduct = products[active];
  if (!activeProduct) return null;
  const glow = activeProduct.art.glow ?? "#ef4444";

  const transition = reduce
    ? "none"
    : `transform ${ANIM_MS}ms ${EASE}, filter ${ANIM_MS}ms ${EASE}, opacity ${ANIM_MS}ms ${EASE}, left ${ANIM_MS}ms ${EASE}`;

  return (
    <section className="relative overflow-hidden border-y border-border bg-card/40 py-14">
      {/* توهج يتغيّر لونه مع المنتج النشط — الخلفية تبقى ثابتة */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 50% at 50% 55%, ${glow}26, transparent 70%)`,
          transition: "background 650ms cubic-bezier(0.4,0,0.2,1)",
        }}
      />

      {/* النص العملاق — لاتيني دائمًا بلا قراءة من القاموس */}
      <div
        aria-hidden
        dir="ltr"
        className="pointer-events-none absolute inset-x-0 bottom-[-2%] z-0 flex select-none justify-center overflow-hidden whitespace-nowrap"
      >
        <span
          className="font-display text-[26vw] font-bold leading-none lg:text-[20vw]"
          style={{
            color: "transparent",
            WebkitTextStroke: "1px rgba(255,255,255,0.07)",
          }}
        >
          ADDICTIONX
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Feel the Rush"
          title={dict.home.carouselTitle}
          subtitle={dict.home.carouselSubtitle}
        />

        <Reveal delay={0.12}>
          <div className="mt-8 flex flex-col items-center gap-6">
            {/* ===== المسرح ===== */}
            <div
              ref={stageRef}
              role="region"
              aria-roledescription="carousel"
              aria-label={dict.home.carouselTitle}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className="relative aspect-[0.7/1] w-full max-w-sm touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {products.map((product, i) => {
                const role = roleOf(i);
                const s = ROLE_STYLES[role];
                const isCenter = role === "center";
                return (
                  <div
                    key={product.id}
                    className="absolute"
                    style={{
                      bottom: 0,
                      left: `${s.left}%`,
                      width: "62%",
                      aspectRatio: "0.6 / 1",
                      transform: `translateX(-50%) scale(${s.scale})`,
                      opacity: s.opacity,
                      zIndex: s.z,
                      filter: reduce ? "none" : `blur(${s.blur}px)`,
                      transition,
                      willChange: isAnimating
                        ? "transform, filter, opacity"
                        : "auto",
                    }}
                  >
                    {isCenter ? (
                      <Link
                        href={`/${locale}/product/${product.slug}`}
                        aria-label={slideLabel(product)}
                        className="block h-full w-full focus-visible:outline-none"
                        draggable={false}
                      >
                        <SlideImage product={product} priority />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        tabIndex={-1}
                        aria-hidden="true"
                        className="block h-full w-full cursor-pointer focus-visible:outline-none"
                      >
                        <SlideImage product={product} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ===== معلومات المنتج النشط ===== */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h3 className="font-display text-xl font-bold sm:text-2xl">
                {locale === "ar" ? activeProduct.nameAr : activeProduct.nameEn}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatPrice(activeProduct.price)} {dict.product.currency}
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                <WishlistButton
                  productId={activeProduct.id}
                  initial={wishlistIds?.includes(activeProduct.id) ?? false}
                  labels={{
                    add: dict.account.addToWishlist,
                    remove: dict.account.removeFromWishlist,
                  }}
                  className="size-9"
                />
                <Button
                  render={
                    <Link href={`/${locale}/product/${activeProduct.slug}`} />
                  }
                  size="lg"
                  className="h-10 rounded-full px-6"
                >
                  {dict.home.carouselExplore}
                </Button>
              </div>
            </div>

            {/* ===== أزرار التنقّل ===== */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goPrev}
                aria-label={dict.home.carouselPrev}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <ArrowLeft className="size-4 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label={dict.home.carouselNext}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <ArrowRight className="size-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </Reveal>

        {/* معلن قارئ الشاشة — خارج الـ Reveal كي لا يهتز مع الأدوار */}
        <div className="sr-only" aria-live="polite">
          {dict.home.carouselItem} {active + 1} {dict.home.carouselOf} {total} —{" "}
          {locale === "ar" ? activeProduct.nameAr : activeProduct.nameEn}
        </div>
      </div>
    </section>
  );
}

function SlideImage({
  product,
  priority,
}: {
  product: Product;
  priority?: boolean;
}) {
  if (product.image) {
    return (
      <Image
        src={product.image}
        alt=""
        fill
        sizes="(min-width:1024px) 420px, (min-width:640px) 320px, 260px"
        className="object-contain object-bottom"
        priority={priority}
        draggable={false}
      />
    );
  }
  return (
    <ProductArt product={product} className="h-full w-full" showName={false} />
  );
}
