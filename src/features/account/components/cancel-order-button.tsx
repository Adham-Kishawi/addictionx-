"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cancelOrder } from "@/features/account/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Customer-side cancel order button — only shown in PENDING status.

export function CancelOrderButton({
  orderId,
  dict,
}: {
  orderId: string;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<{
    error?: string;
    success?: boolean;
  }>({});

  const onClick = async () => {
    if (pending) return;
    if (!window.confirm(dict.account.cancelConfirm)) return;
    setPending(true);
    setState({});
    const res = await cancelOrder(orderId);
    setPending(false);
    if (res.error === "NOT_CANCELLABLE") {
      setState({ error: dict.account.cancelUnavailable });
      return;
    }
    if (res.error) {
      setState({ error: dict.account.cancelError });
      return;
    }
    router.refresh();
    setState({ success: true });
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <XCircle className="size-4" />
        )}
        {dict.account.cancelOrder}
      </button>
      {state.success && (
        <span className="flex items-center gap-1.5 text-xs text-emerald-500">
          <CheckCircle2 className="size-3.5" />
          {dict.account.orderCancelled}
        </span>
      )}
      {state.error && (
        <span className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5" />
          {state.error}
        </span>
      )}
    </div>
  );
}
