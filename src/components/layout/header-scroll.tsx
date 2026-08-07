"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// حالة الهيدر فوق الـ hero السينمائي:
// - على الصفحة الرئيسية وفوق أول 80% من الشاشة → الهيدر شفاف تمامًا
//   (بلا حدود/blur) وتنخفض شفافية CursorGlow عبر --cursor-glow-opacity.
// - عند التمرير للأسفل أو على أي صفحة أخرى → يعود لطبيعته.
// لا يغيّر أي حالة React — مجرد class على #site-header + متغير CSS على <html>.

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
