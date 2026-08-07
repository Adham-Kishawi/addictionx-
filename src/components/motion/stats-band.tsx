"use client";

import { RevealStagger, RevealItem } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { HeartbeatLine } from "@/components/motion/heartbeat-line";

export type StatItem = { label: string; value: number; suffix?: string };

// شريط أرقام يعدّ تصاعديًا عند الوصول — أرقام حقيقية من DB.

export function StatsBand({ stats }: { stats: StatItem[] }) {
  return (
    <RevealStagger className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 sm:grid-cols-3 sm:gap-4 sm:px-6">
      {stats.map((stat) => (
        <RevealItem
          key={stat.label}
          className="flex flex-col items-center gap-2 text-center"
        >
          <p
            className="font-display text-4xl font-bold text-metallic-shine sm:text-5xl"
            dir="ltr"
          >
            <CountUp to={stat.value} />
            {stat.suffix}
          </p>
          <HeartbeatLine className="h-4 w-12 text-primary" />
          <p className="text-sm text-muted-foreground">{stat.label}</p>
        </RevealItem>
      ))}
    </RevealStagger>
  );
}
