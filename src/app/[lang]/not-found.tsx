import Link from "next/link";
import { HeartbeatLine } from "@/components/motion/heartbeat-line";
import { Button } from "@/components/ui/button";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";

export default async function NotFound({
  params,
}: {
  params?: Promise<{ lang: string }>;
}) {
  // HARDENED (hotfix): Next.js renders this not-found OUTSIDE the [lang]
  // route context for some unmatched paths — params can be undefined,
  // which previously crashed into the generic "Oops" 500 page instead of
  // a clean 404. Fall back to the default locale, never crash.
  const { lang } = params ? await params : { lang: undefined };
  const locale = lang && isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 px-6 text-center">
      <HeartbeatLine className="h-10 w-56 text-primary/70" />
      <div className="flex flex-col gap-2">
        <p className="font-display text-7xl font-bold text-primary">404</p>
        <h1 className="font-display text-2xl font-bold">
          {dict.common.notFound}
        </h1>
        <p className="text-sm text-muted-foreground">
          {locale === "ar"
            ? "الصفحة التي تبحث عنها غير موجودة — تفقّد الرابط أو عد للرئيسية."
            : "The page you're looking for doesn't exist — check the link or go back home."}
        </p>
      </div>
      <Button render={<Link href={`/${locale}`} />}>
        {dict.common.backHome}
      </Button>
    </main>
  );
}
