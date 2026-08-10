import { Reveal } from "@/components/motion/reveal";
import { WordReveal } from "@/components/motion/word-reveal";
import { HeartbeatLine } from "@/components/motion/heartbeat-line";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Reveal className="flex flex-col items-center gap-2 text-center">
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {eyebrow}
        </span>
      )}
      <WordReveal
        as="h2"
        text={title}
        className="text-metallic-shine font-display text-3xl font-bold sm:text-4xl"
      />
      <HeartbeatLine className="h-5 w-24 text-primary" />
      {subtitle && <p className="max-w-xl text-muted-foreground">{subtitle}</p>}
    </Reveal>
  );
}
