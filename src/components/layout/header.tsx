import Link from "next/link";
import { User } from "lucide-react";
import type { Session } from "next-auth";
import { HeartbeatLine } from "@/components/motion/heartbeat-line";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CartButton } from "@/features/cart/components/cart-button";
import { HeaderScroll } from "@/components/layout/header-scroll";
import { SearchBox } from "@/features/catalog/components/search-box";
import { MobileNav } from "@/components/layout/mobile-nav";
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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:gap-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="group flex items-center gap-2 text-foreground"
            aria-label="ADDICTIONX"
          >
            <HeartbeatLine className="h-4 w-8 text-primary transition-colors group-hover:text-primary/70 sm:h-5 sm:w-9" />
            <span
              className="font-display text-base font-bold tracking-wide sm:text-lg"
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
              href={`/${locale}/collections`}
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
          <div className="flex items-center gap-1.5 text-muted-foreground sm:gap-2">
            <MobileNav
              locale={locale}
              isAdmin={isAdmin}
              labels={{
                openMenu: dict.header.openMenu,
                closeMenu: dict.header.closeMenu,
                home: dict.nav.home,
                shop: dict.nav.shop,
                collection: dict.nav.collection,
                account: dict.header.account,
                admin: dict.header.admin,
              }}
              items={[
                { href: `/${locale}`, label: dict.nav.home },
                { href: `/${locale}/catalog`, label: dict.nav.shop },
                {
                  href: `/${locale}/collections`,
                  label: dict.nav.collection,
                },
              ]}
              search={
                <SearchBox
                  locale={locale}
                  labels={{ placeholder: dict.catalog.searchPlaceholder }}
                  fullWidth
                />
              }
            />
            <div className="hidden sm:block">
              <SearchBox
                locale={locale}
                labels={{ placeholder: dict.catalog.searchPlaceholder }}
              />
            </div>
            <LanguageSwitcher currentLocale={locale} />
            <ThemeToggle />
            <Link
              href={isAuthed ? `/${locale}/account` : `/${locale}/login`}
              aria-label={dict.header.account}
              className="hidden size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
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
