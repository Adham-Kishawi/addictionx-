"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Header state over the cinematic hero:
// - On the home page and above the first 80% of the screen → the header is completely transparent
//   (no borders/blur) and the CursorGlow opacity drops via --cursor-glow-opacity.
// - After scrolling down or on any other page → it returns to normal.
// It changes no React state — just a class on #site-header + a CSS variable on <html>.

export function HeaderScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const isHome = pathname.split("/").filter(Boolean).length === 1;
    const root = document.documentElement;
    const header = document.getElementById("site-header");

    const apply = () => {
      if (!header) return;
      if (!isHome) {
        header.classList.remove("header-over-hero");
        root.style.setProperty("--cursor-glow-opacity", "1");
        return;
      }
      const overHero = window.scrollY < window.innerHeight * 0.8;
      header.classList.toggle("header-over-hero", overHero);
      root.style.setProperty("--cursor-glow-opacity", overHero ? "0.25" : "1");
    };

    apply();
    window.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
    };
  }, [pathname]);

  return null;
}
