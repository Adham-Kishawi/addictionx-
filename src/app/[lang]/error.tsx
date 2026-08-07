"use client";

import { useEffect } from "react";
import { HeartbeatLine } from "@/components/motion/heartbeat-line";
import { Button } from "@/components/ui/button";

// Route-level error boundary — branded recovery UI with a retry button.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 px-6 text-center">
      <HeartbeatLine className="h-10 w-56 text-destructive/70" />
      <div className="flex flex-col gap-2">
        <p className="font-display text-6xl font-bold text-destructive">Oops</p>
        <h1 className="font-display text-2xl font-bold">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred while loading this page. Try again, and
          if it persists check back shortly.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
