"use client";

import { motion, useReducedMotion } from "framer-motion";

// حقل جسيمات صاعدة — يُستخدم في الـ hero وبقية الصفحة.
// كل الخيارات افتراضية تساوي السلوك الأصلي، وفي الـ hero السينمائي
// نمرّر نسخة مخفّفة (count أصغر + blend screen + opacityScale أخفّ)
// لتُقرأ كـ«غبار في شعاع الضوء» لا كـ«نويز» فوق الفيديو.
// blend: screen يضيف نورًا دون قلب الألوان (الأحمر يبقى أحمر).

export function ParticleField({
  count = 24,
  blend = "normal",
  opacityScale = 1,
}: {
  count?: number;
  blend?: "screen" | "exclusion" | "normal";
  opacityScale?: number;
}) {
  const reduce = useReducedMotion();

  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${(i * 41) % 100}%`,
    size: 2 + ((i * 7) % 4),
    duration: 6 + ((i * 13) % 8),
    delay: (i * 17) % 6,
    opacity: 0.25 + ((i * 11) % 5) / 10,
  }));

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ mixBlendMode: blend === "normal" ? undefined : blend }}
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-primary"
          style={{
            left: p.left,
            bottom: "-5%",
            width: p.size,
            height: p.size,
            opacity: p.opacity * opacityScale,
            boxShadow: "0 0 12px 2px oklch(0.6 0.22 22 / 0.5)",
          }}
          animate={
            reduce
              ? undefined
              : {
                  y: [0, "-110vh"],
                  x: [0, p.id % 2 === 0 ? 40 : -40, 0],
                }
          }
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
