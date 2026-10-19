"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { isLocale, defaultLocale } from "@/lib/i18n/dictionary";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ lang: string }>();
  const locale = isLocale(params?.lang) ? params.lang : defaultLocale;

  useEffect(() => {
    console.error("[Storefront RouteError Caught]:", error?.message, error?.stack, error?.digest);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-metallic-shine font-display text-6xl font-bold">
        {locale === "ar" ? "آه!" : "Oops"}
      </span>
      <p className="max-w-md text-muted-foreground">
        {locale === "ar"
          ? "حصل خطأ غير متوقع أثناء تحميل الصفحة. جرّب مرة تانية."
          : "An unexpected error occurred while loading this page. Please try again."}
      </p>

      {error?.message ? (
        <div className="my-2 max-w-2xl text-left" dir="ltr">
          <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 font-mono text-xs text-red-300">
            <p className="font-bold text-red-200 mb-1">Error Details:</p>
            <p className="break-all">{error.message}</p>
            {error.digest ? (
              <p className="mt-2 text-red-400/80 text-[10px]">Digest: {error.digest}</p>
            ) : null}
            {error.stack ? (
              <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-[10px] text-red-400/60">
                {error.stack}
              </pre>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => reset()}
          className="h-11 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_0_30px_-8px_theme(colors.red.600)] transition-shadow hover:shadow-[0_0_40px_-6px_theme(colors.red.500)]"
        >
          {locale === "ar" ? "إعادة المحاولة" : "Try again"}
        </button>
        <a
          href={`/${locale}`}
          className="flex h-11 items-center rounded-full border border-border bg-card px-7 text-sm font-medium transition-colors hover:border-primary/40"
        >
          {locale === "ar" ? "الرئيسية" : "Home"}
        </a>
      </div>
    </main>
  );
}
