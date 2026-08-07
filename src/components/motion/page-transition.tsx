"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// انتقال ناعم بين الصفحات — يُركَّب حول {children} في الlayout الجذري.
// التغيير في الـ pathname يغيّر الـ key فيُعيد التمثيل بحركة دخول.
//
// ملاحظة حرجة: نتحرك بـ opacity فقط — أي transform أو filter على هذا
// العنصر يُنشئ containing block جديدًا يجعل أي position:fixed بداخله
// (مثل فيديو الـ hero السينمائي) يتحرك مع التمرير بدل الثبات على الشاشة.
// opacity يُنشئ stacking context لكنه لا يمسّ الـ fixed — فهو آمن.

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduce ? { opacity: 0 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "opacity" }}
    >
      {children}
    </motion.div>
  );
}
