import type { Metadata, Viewport } from "next";
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
import "../globals.css";

// Keep metadata static at the Worker edge. In this Next/OpenNext combination
// an async locale metadata function can reject after the route has rendered,
// causing the storefront error boundary to replace an otherwise valid page.
export const metadata: Metadata = {
  title: {
    default: "ADDICTIONX",
    template: "%s | ADDICTIONX",
  },
  description: "Egyptian youth fragrance brand.",
  openGraph: {
    siteName: "ADDICTIONX",
    type: "website",
  },
  robots: { index: true, follow: true },
};

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
