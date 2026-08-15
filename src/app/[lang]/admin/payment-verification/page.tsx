import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAnyPermission } from "@/lib/admin-permissions";
import { getDictionary, isLocale, defaultLocale } from "@/lib/i18n/dictionary";
import { PaymentVerificationList } from "@/components/admin/payment-verification-list";

export const dynamic = "force-dynamic";

export default async function PaymentVerificationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = getDictionary(locale);

  // Require "orders" permission (payment verification is part of order management)
  await requireAnyPermission(["payment-verification", "orders"], locale);

  // Fetch all pending payment proofs with their orders
  const pendingProofs = await prisma.paymentProof.findMany({
    where: { status: "PENDING" },
    include: {
      order: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch recently verified proofs (last 20)
  const verifiedProofs = await prisma.paymentProof.findMany({
    where: {
      status: { in: ["VERIFIED", "REJECTED"] },
    },
    include: {
      order: {
        include: {
          user: true,
        },
      },
      verifier: true,
    },
    orderBy: { verifiedAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">
          {dict.admin.paymentVerification}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dict.admin.paymentVerificationHint}
        </p>
      </div>

      <PaymentVerificationList
        pendingProofs={pendingProofs}
        verifiedProofs={verifiedProofs}
        locale={locale}
        dict={dict}
      />
    </div>
  );
}
