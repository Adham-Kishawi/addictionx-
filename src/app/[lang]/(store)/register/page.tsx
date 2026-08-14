import { AuthForm } from "@/features/auth/components/auth-form";
import { isLocale, defaultLocale } from "@/lib/i18n/dictionary";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 pb-24 pt-28">
      <AuthForm mode="register" locale={locale} googleEnabled={googleEnabled} />
    </main>
  );
}
