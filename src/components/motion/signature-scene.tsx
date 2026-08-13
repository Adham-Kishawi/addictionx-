"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollWordReveal } from "@/components/motion/scroll-word-reveal";
import { FadeIn } from "@/components/motion/fade-in";
import { Magnetic } from "@/components/motion/magnetic";
import { SectionGlow } from "@/components/motion/section-glow";

// ============================================================
// SignatureScene — wave 34e: replaces the generic perk-card
// strip (truck/shield/sparkles — the "generic e-commerce"
// look the brief bans) with the brand's SIGNATURE moment:
// the flagship bottle floats over a drifting glow, its dark
// studio portrait wrapped in depth-of-light, while the brand
// promise word-reveals next to it and the ghost wordmark
// parallaxes behind. A continuation of the story — perfume
// atmosphere, not trust badges.
//
// Layers: z-0 ghost wordmark (scroll parallax, far) · z-1 glow
// drift · z-2 the bottle (counter-parallax + slow float) ·
// z-10 the copy (word reveal + fade-ins) + CTA.
// Reduced motion → static, no scroll transforms, no float.
// ============================================================

export function SignatureScene({
  image,
  glow = "#ef4444",
  eyebrow,
  title,
  text,
  ctaLabel,
  ctaHref,
}: {
  image?: string | null;
  glow?: string;
  eyebrow: string;
  title: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ["start end", "end start"],
  });

  const ghostY = useTransform(scrollYProgress, [0, 1], ["22%", "-22%"]);
  const bottleY = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  return (
    <section ref={ref} className="relative overflow-hidden py-28">
      <SectionGlow
        background={`radial-gradient(55% 75% at 50% 40%, ${glow}14, transparent 70%)`}
      />

      {/* L0 — ghost wordmark drifting behind everything */}
      <motion.span
        aria-hidden
        dir="ltr"
        className="text-metallic-shine pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center overflow-hidden whitespace-nowrap font-display text-[24vw] font-bold leading-none opacity-[0.05] lg:text-[16vw]"
        style={reduce ? undefined : { y: ghostY }}
      >
        ADDICTION
      </motion.span>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-12 px-4 sm:px-6 lg:flex-row lg:justify-between lg:gap-16 lg:px-8">
        {/* L2 — the signature bottle: counter-parallax float */}
        {image ? (
          <motion.div
            aria-hidden
            className="relative order-1 w-full max-w-[300px] shrink-0 lg:order-2 lg:max-w-[420px]"
            style={reduce ? undefined : { y: bottleY }}
          >
            <div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{
                background: `radial-gradient(50% 50% at 50% 55%, ${glow}40, transparent 70%)`,
              }}
            />
            <motion.img
              src={image}
              alt=""
              draggable={false}
              className="relative mx-auto w-full object-contain [filter:drop-shadow(0_0_60px_oklch(0.6_0.22_22/0.4))_drop-shadow(0_40px_60px_rgba(0,0,0,0.6))]"
              animate={reduce ? undefined : { y: [0, -12, 0] }}
              transition={
                reduce
                  ? undefined
                  : { duration: 7, ease: "easeInOut", repeat: Infinity }
              }
            />
          </motion.div>
        ) : null}

        {/* L10 — the copy */}
        <div className="order-2 flex w-full max-w-xl flex-col items-center gap-6 text-center lg:order-1 lg:items-start lg:text-left">
          <FadeIn y={20}>
            <span className="inline-flex items-center gap-3 text-xs tracking-[0.35em] text-primary">
              <span className="h-px w-10 bg-primary/60" />
              {eyebrow}
              <span className="h-px w-10 bg-primary/60" />
            </span>
          </FadeIn>

          <ScrollWordReveal
            text={title}
            className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl"
          />

          <FadeIn delay={0.15} y={20}>
            <p className="max-w-lg leading-relaxed text-muted-foreground">
              {text}
            </p>
          </FadeIn>

          <FadeIn delay={0.3} y={20}>
            <Magnetic strength={0.25}>
              <Button
                render={<Link href={ctaHref} />}
                size="lg"
                variant="outline"
                className="group h-12 rounded-full border-white/25 bg-white/5 px-8 text-base hover:bg-white/10"
              >
                {ctaLabel}
                <ArrowRight className="ms-2 size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </Button>
            </Magnetic>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
