import type { Metadata, Viewport } from "next";
import "@fontsource/alexandria/300.css";
import "@fontsource/alexandria/400.css";
import "@fontsource/alexandria/500.css";
import "@fontsource/alexandria/600.css";
import "@fontsource/alexandria/700.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import {
  getDictionary,
  isLocale,
  defaultLocale,
  type Locale,
} from "@/lib/i18n/dictionary";
import { siteUrl } from "@/lib/site-url";
import "../globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: dict.meta.title,
      template: `%s | ${dict.meta.title}`,
    },
    description: dict.meta.description,
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      siteName: "ADDICTIONX",
      locale: locale === "ar" ? "ar_EG" : "en_US",
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="dark h-full antialiased"
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
