import Link from "next/link";
import { HeartbeatLine } from "@/components/motion/heartbeat-line";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { siteConfig } from "@/config/site";
import { getCollections } from "@/features/catalog/data/products-db";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";

export async function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const year = new Date().getFullYear();
  const collections = await getCollections();

  return (
    <footer className="border-t border-border bg-card/40">
      {/* النشرة — أول شريط جوه الفوتر، فوق كل الأعمدة */}
      <div className="border-b border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-12 text-center sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-2xl font-bold sm:text-3xl">
              {dict.newsletter.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {dict.newsletter.subtitle}
            </p>
          </div>
          <NewsletterForm dict={dict} />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* عن العلامة */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <HeartbeatLine className="h-5 w-9 text-primary" />
            <span className="font-display text-lg font-bold" dir="ltr">
              ADDICTION<span className="text-primary">X</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {dict.footer.aboutText}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {dict.footer.madeWith}
          </p>
        </div>

        {/* روابط سريعة */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{dict.footer.quickLinks}</h3>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li>
              <Link
                href={`/${locale}`}
                className="transition-colors hover:text-foreground"
              >
                {dict.nav.home}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/catalog`}
                className="transition-colors hover:text-foreground"
              >
                {dict.nav.shop}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/login`}
                className="transition-colors hover:text-foreground"
              >
                {dict.account.title}
              </Link>
            </li>
          </ul>
        </div>

        {/* المجموعات */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{dict.footer.collections}</h3>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {collections.map((collection) => (
              <li key={collection.slug}>
                <Link
                  href={`/${locale}/catalog?collection=${collection.slug}`}
                  className="transition-colors hover:text-foreground"
                >
                  {locale === "ar" ? collection.nameAr : collection.nameEn}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* تواصل */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{dict.footer.contact}</h3>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li>
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
                dir="ltr"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href={siteConfig.social.tiktok}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
                dir="ltr"
              >
                TikTok
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-center text-xs text-muted-foreground/70 sm:flex-row sm:px-6 lg:px-8">
          <p>{dict.footer.rights.replace("{year}", String(year))}</p>
          <p dir="ltr" className="tracking-widest">
            ADDICTIONX — {siteConfig.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
