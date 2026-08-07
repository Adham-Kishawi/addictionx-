"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

// Mobile menu drawer — replaces the desktop nav on small screens.
// Same visual pattern as CartDrawer: fixed panel, dimmed backdrop.
export function MobileNav({
  locale,
  isAdmin,
  labels,
  items,
}: {
  locale: string;
  isAdmin: boolean;
  labels: {
    openMenu: string;
    closeMenu: string;
    home: string;
    shop: string;
    collection: string;
    account: string;
    admin: string;
  };
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const link =
    "flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3 text-foreground transition-colors hover:border-primary/40 hover:text-primary";

  return (
    <>
      {/* Hamburger — visible on mobile only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.openMenu}
        aria-expanded={open}
        className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={labels.openMenu}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label={labels.closeMenu}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          {/* Drawer */}
          <div className="absolute inset-y-0 end-0 flex w-80 max-w-[85vw] flex-col gap-2 overflow-y-auto border-s border-border bg-card p-4 pt-5 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-lg font-bold tracking-wide">
                ADDICTION<span className="text-primary">X</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.closeMenu}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={link}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href={isAdmin ? `/${locale}/admin` : `/${locale}/account`}
              onClick={() => setOpen(false)}
              className={link}
            >
              {isAdmin ? labels.admin : labels.account}
            </Link>

            <span className="mt-auto pt-4 text-center text-xs text-muted-foreground">
              ADDICTIONX ©
            </span>
          </div>
        </div>
      )}
    </>
  );
}
