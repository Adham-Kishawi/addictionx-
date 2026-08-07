import Link from "next/link";
import { User } from "lucide-react";
import type { Session } from "next-auth";
import { HeartbeatLine } from "@/components/motion/heartbeat-line";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CartButton } from "@/features/cart/components/cart-button";
import { HeaderScroll } from "@/components/layout/header-scroll";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";

export function Header({
  locale,
  session,
}: {
  locale: Locale;
  session: Session | null;
}) {
  const dict = getDictionary(locale);
  const isAuthed = !!session?.user;
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <>
      <HeaderScroll />
      <header
        id="site-header"
        className="site-header fixed inset-x-0 top-0 z-30"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="group flex items-center gap-2 text-foreground"
            aria-label="ADDICTIONX"
          >
            <HeartbeatLine className="h-5 w-9 text-primary transition-colors group-hover:text-primary/70" />
            <span
              className="font-display text-lg font-bold tracking-wide"
              dir="ltr"
            >
              ADDICTION<span className="text-primary">X</span>
            </span>
          </Link>

          {/* Nav — hidden on mobile */}
          <nav
            className="hidden items-center gap-6 text-sm text-muted-foreground md:flex"
            aria-label="Main"
          >
            <Link
              href={`/${locale}`}
              className="transition-colors hover:text-foreground"
            >
              {dict.nav.home}
            </Link>
            <Link
              href={`/${locale}/catalog`}
              className="transition-colors hover:text-foreground"
            >
              {dict.nav.shop}
            </Link>
            <Link
              href={`/${locale}/catalog`}
              className="transition-colors hover:text-foreground"
            >
              {dict.nav.collection}
            </Link>
            {isAdmin && (
              <Link
                href={`/${locale}/admin`}
                className="font-medium text-primary transition-colors hover:text-primary/70"
              >
                {dict.header.admin}
              </Link>
            )}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <LanguageSwitcher currentLocale={locale} />
            <ThemeToggle />
            <Link
              href={isAuthed ? `/${locale}/account` : `/${locale}/login`}
              aria-label={dict.header.account}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <User className="size-5" />
            </Link>
            <CartButton locale={locale} />
          </div>
        </div>
      </header>
    </>
  );
}
