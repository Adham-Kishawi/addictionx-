import type { Metadata, Viewport } from "next";
import { Cairo, Playfair_Display } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/features/cart/components/cart-drawer";
import { CartFlyProvider } from "@/components/motion/fly-to-cart";
import { CursorGlow } from "@/components/motion/cursor-glow";
import { CursorRing } from "@/components/motion/cursor-ring";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { DepthBackdrop } from "@/components/motion/depth-backdrop";
import { DepthFog } from "@/components/motion/depth-fog";
import { NoiseOverlay } from "@/components/motion/noise-overlay";
import { PageTransition } from "@/components/motion/page-transition";
import { auth } from "@/lib/auth";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n/dictionary";
import "../globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "ar";
  const dict = getDictionary(locale);

  return {
    title: {
      default: dict.meta.title,
      template: `%s | ${dict.meta.title}`,
    },
    description: dict.meta.description,
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : "ar";
  const session = await auth();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`dark ${cairo.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* isolate = stacking context: the fixed DepthBackdrop (-z-10) stays
            behind all page content of every route — the site-wide depth layer */}
        <div className="relative isolate">
          <DepthBackdrop />
          <DepthFog />
          <CursorGlow />
          <CursorRing />
          <SmoothScroll />
          <CartFlyProvider>
            <Header locale={locale} session={session} />
            <CartDrawer locale={locale} />
            <PageTransition>{children}</PageTransition>
            <Footer locale={locale} />
          </CartFlyProvider>
          <NoiseOverlay />
        </div>
      </body>
    </html>
  );
}
