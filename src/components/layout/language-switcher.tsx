"use client";

import { usePathname, useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLocale, type Locale } from "@/lib/i18n/dictionary";

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchTo: Locale = currentLocale === "ar" ? "en" : "ar";

  const handleSwitch = () => {
    // Replace the locale segment in the current path: /en/... ← /ar/...
    const segments = pathname.split("/");
    const index = segments.findIndex((seg) => isLocale(seg));
    if (index !== -1) {
      segments[index] = switchTo;
    } else {
      segments.splice(1, 0, switchTo);
    }
    router.push(segments.join("/"));
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSwitch}
      aria-label={switchTo === "en" ? "English" : "العربية"}
      className="gap-1.5 text-sm"
    >
      <Languages className="size-4" />
      <span className="hidden sm:inline">
        {switchTo === "en" ? "English" : "عربي"}
      </span>
    </Button>
  );
}
