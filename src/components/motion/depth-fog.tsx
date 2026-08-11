"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

// ============================================================
// DEPTH FOG — atmospheric perspective (wave plan #7). Two fixed
// gradient washes: a top fog fading into the theme background
// (content "up ahead" reads distant) and a bottom fog into deep
// black (content still approaching). Opacity is scroll-driven
// across the whole page — far sections melt, near sections read
// crisp. Sits below header/marquee (z-3). Theme-aware via CSS
// vars. Reduced motion → static subtle fog.
// ============================================================

export function DepthFog() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const top = useTransform(scrollYProgress, [0, 0.4, 0.75], [0, 0.45, 0.26]);
  const bottom = useTransform(scrollYProgress, [0.15, 0.55, 1], [0, 0.32, 0.5]);

  return (
    <>
      <motion.div
        aria-hidden
        className="depth-fog depth-fog-top"
        style={reduce ? undefined : { opacity: top }}
      />
      <motion.div
        aria-hidden
        className="depth-fog depth-fog-bottom"
        style={reduce ? undefined : { opacity: bottom }}
      />
    </>
  );
}
