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
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/dictionary";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  // Authentication must not take down the public storefront if an optional
  // identity provider is unavailable. Protected routes still enforce auth.
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("[auth] storefront session lookup failed", error);
  }

  return (
    /* isolate = stacking context: the fixed DepthBackdrop (-z-10) stays
        behind all storefront content — the site-wide depth layer */
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
  );
}
