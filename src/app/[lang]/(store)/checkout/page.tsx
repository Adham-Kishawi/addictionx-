import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  // Autofill from the signed-in profile: name / phone from the account, and the
  // most recent saved address so returning customers don't retype everything.
  const session = await auth();
  const [userRow, lastAddress] = await Promise.all([
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, phone: true, email: true },
        })
      : Promise.resolve(null),
    session?.user?.id
      ? prisma.address.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  const initialValues = {
    name: userRow?.name ?? "",
    phone: userRow?.phone ?? "",
    email: userRow?.email ?? "",
    governorateName: lastAddress?.governorate ?? "",
    regionName: lastAddress?.city ?? "",
    address: lastAddress?.street ?? "",
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-4xl font-bold">
        {dict.checkout.title}
      </h1>
      <p className="mb-10 text-muted-foreground">{dict.cart.shippingNotice}</p>
      <CheckoutForm
        locale={locale}
        initialValues={initialValues}
        isLoggedIn={Boolean(session?.user?.id)}
      />
    </main>
  );
}
