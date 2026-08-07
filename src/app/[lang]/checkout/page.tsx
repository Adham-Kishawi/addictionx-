import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-4xl font-bold">
        {dict.checkout.title}
      </h1>
      <p className="mb-10 text-muted-foreground">{dict.cart.shippingNotice}</p>
      <CheckoutForm locale={locale} />
    </main>
  );
}
