"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";

export function SignOutButton({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signOut({ redirectTo: `/${locale}` })}
    >
      <LogOut className="size-4" />
      {dict.account.logout}
    </Button>
  );
}
