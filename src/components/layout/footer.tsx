import type { Locale } from "@/lib/i18n/dictionary";

export async function Footer({ locale: _locale }: { locale: Locale }) {
  return (
    <footer className="border-t border-border/60 bg-card/40 py-5">
      <p className="text-center text-xs text-muted-foreground/70">
        All rights reserved to{" "}
        <a
          href="https://craft-crew.com"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          Craft Crew
        </a>
      </p>
    </footer>
  );
}
