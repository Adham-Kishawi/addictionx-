import type { Metadata, Viewport } from "next";
import { Cairo, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/features/cart/components/cart-drawer";
import { CartFlyProvider } from "@/components/motion/fly-to-cart";
import { CursorGlow } from "@/components/motion/cursor-glow";
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
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
      className={`${cairo.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider>
          <CursorGlow />
          <CartFlyProvider>
            <Header locale={locale} session={session} />
            <CartDrawer locale={locale} />
            <PageTransition>{children}</PageTransition>
            <Footer locale={locale} />
          </CartFlyProvider>
          <script
            id="theme-init"
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light"){document.documentElement.classList.remove("dark");}else{document.documentElement.classList.add("dark");}}catch(e){}})();`,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
