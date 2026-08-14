"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/features/catalog/data/products";
import {
  verifyPaymentProof,
  rejectPaymentProof,
} from "@/features/admin/payment-actions";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/dictionary";

type PaymentProofWithOrder = {
  id: string;
  orderId: string;
  receiptUrl: string | null;
  transactionRef: string | null;
  paymentMethod: string;
  status: string;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  rejectionNote: string | null;
  createdAt: Date;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    } | null;
  };
  verifier?: {
    name: string | null;
  } | null;
};

type Props = {
  pendingProofs: PaymentProofWithOrder[];
  verifiedProofs: PaymentProofWithOrder[];
  locale: Locale;
  dict: {
    admin: {
      pendingPayments: string;
      noPendingPayments: string;
      customer: string;
      guest: string;
      submittedAt: string;
      approve: string;
      reject: string;
      rejectionReason: string;
      recentVerifications: string;
      orderNumber: string;
      paymentMethod: string;
      status: string;
      verifiedBy: string;
      verifiedAt: string;
      verified: string;
      rejected: string;
    };
    checkout: {
      instapay: string;
      vodafoneCash: string;
      transactionRef: string;
    };
    cart: {
      total: string;
    };
    product: {
      currency: string;
    };
  };
};

export function PaymentVerificationList({
  pendingProofs,
  verifiedProofs,
  locale,
  dict,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [expandedProof, setExpandedProof] = useState<string | null>(null);

  const handleVerify = (proofId: string, orderId: string) => {
    startTransition(async () => {
      await verifyPaymentProof(proofId, orderId, locale);
    });
  };

  const handleReject = (proofId: string, note: string) => {
    startTransition(async () => {
      await rejectPaymentProof(proofId, note, locale);
    });
  };

  return (
    <div className="space-y-8">
      {/* Pending proofs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          {dict.admin.pendingPayments} ({pendingProofs.length})
        </h2>

        {pendingProofs.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
            <Clock className="mx-auto mb-2 size-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {dict.admin.noPendingPayments}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingProofs.map((proof) => (
              <div
                key={proof.id}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Left: Order info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/${locale}/admin/orders/${proof.order.id}`}
                        className="font-mono text-lg font-semibold hover:text-primary"
                      >
                        {proof.order.orderNumber}
                      </Link>
                      <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-600">
                        {proof.paymentMethod === "INSTAPAY"
                          ? dict.checkout.instapay
                          : dict.checkout.vodafoneCash}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>
                        {dict.admin.customer}:{" "}
                        {proof.order.user?.name || dict.admin.guest}
                      </p>
                      <p>
                        {dict.cart.total}: {formatPrice(proof.order.total)}{" "}
                        {dict.product.currency}
                      </p>
                      <p>
                        {dict.admin.submittedAt}:{" "}
                        {new Date(proof.createdAt).toLocaleString(locale)}
                      </p>
                      {proof.transactionRef && (
                        <p className="font-mono">
                          {dict.checkout.transactionRef}: {proof.transactionRef}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle: Receipt image */}
                  {proof.receiptUrl && (
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedProof(
                            expandedProof === proof.id ? null : proof.id,
                          )
                        }
                        className="group relative overflow-hidden rounded-lg border border-border"
                      >
                        <Image
                          src={proof.receiptUrl}
                          alt="Payment receipt"
                          width={200}
                          height={200}
                          className="h-40 w-40 object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <ExternalLink className="size-6 text-white" />
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Right: Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleVerify(proof.id, proof.orderId)}
                      disabled={isPending}
                      size="sm"
                      className="gap-2"
                    >
                      <CheckCircle className="size-4" />
                      {dict.admin.approve}
                    </Button>
                    <Button
                      onClick={() => {
                        const note = prompt(dict.admin.rejectionReason);
                        if (note) handleReject(proof.id, note);
                      }}
                      disabled={isPending}
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                    >
                      <XCircle className="size-4" />
                      {dict.admin.reject}
                    </Button>
                  </div>
                </div>

                {/* Expanded receipt view */}
                {expandedProof === proof.id && proof.receiptUrl && (
                  <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
                    <Image
                      src={proof.receiptUrl}
                      alt="Payment receipt (full)"
                      width={800}
                      height={600}
                      className="mx-auto max-h-96 w-auto rounded-lg"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Verified/Rejected history */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          {dict.admin.recentVerifications}
        </h2>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-sm">
                <th className="p-3 font-medium">{dict.admin.orderNumber}</th>
                <th className="p-3 font-medium">{dict.admin.paymentMethod}</th>
                <th className="p-3 font-medium">{dict.admin.status}</th>
                <th className="p-3 font-medium">{dict.admin.verifiedBy}</th>
                <th className="p-3 font-medium">{dict.admin.verifiedAt}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {verifiedProofs.map((proof) => (
                <tr key={proof.id} className="text-sm">
                  <td className="p-3">
                    <Link
                      href={`/${locale}/admin/orders/${proof.order.id}`}
                      className="font-mono hover:text-primary"
                    >
                      {proof.order.orderNumber}
                    </Link>
                  </td>
                  <td className="p-3">
                    {proof.paymentMethod === "INSTAPAY"
                      ? dict.checkout.instapay
                      : dict.checkout.vodafoneCash}
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        proof.status === "VERIFIED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-600",
                      )}
                    >
                      {proof.status === "VERIFIED" ? (
                        <>
                          <CheckCircle className="size-3" />
                          {dict.admin.verified}
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3" />
                          {dict.admin.rejected}
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {proof.verifier?.name || "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {proof.verifiedAt
                      ? new Date(proof.verifiedAt).toLocaleString(locale)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
