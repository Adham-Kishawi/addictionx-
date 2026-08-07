import { HeartbeatLine } from "@/components/motion/heartbeat-line";

// Branded loading screen — rendered automatically by Next.js while any page under
// /[lang] streams its Server Component data (the storefront reads from the DB).
// It covers slow queries and network stalls, then Next swaps it out for the page.
// The skeleton mirrors the real card grid (home / catalog) so navigation feels instant.

const CardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
    <div className="aspect-[4/5] animate-pulse bg-black/25" />
    <div className="flex flex-col gap-2 p-4">
      <div className="h-4 w-2/3 animate-pulse rounded-full bg-black/25" />
      <div className="h-3 w-1/3 animate-pulse rounded-full bg-black/25" />
    </div>
  </div>
);

export default function RootLoading() {
  return (
    <main className="min-h-[70dvh]">
      <section className="flex flex-col items-center gap-5 py-20 text-center">
        <HeartbeatLine className="h-10 w-56 text-primary/80 [filter:drop-shadow(0_0_18px_theme(colors.red.600/0.45))]" />
        <p className="text-xs font-medium tracking-[0.35em] text-muted-foreground uppercase">
          Loading
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </section>
    </main>
  );
}
