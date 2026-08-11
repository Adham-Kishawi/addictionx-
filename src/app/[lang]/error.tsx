"use client";

import { useParams } from "next/navigation";
import { isLocale, defaultLocale } from "@/lib/i18n/dictionary";

// Client error boundary — instead of the dead-end "Oops" screen,
// offer a retry (resets the route) and a home link, in the
// page's language. Server-side errors still stream through.

export default function RouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ lang: string }>();
  const locale = isLocale(params?.lang) ? params.lang : defaultLocale;

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
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
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
