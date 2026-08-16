"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notifyStuckOrders } from "@/features/admin/actions";
import type { Locale } from "@/lib/i18n/dictionary";

type StuckOrder = {
  id: string;
  orderNumber: string;
  status: string;
  stuckHours: number;
};

type Props = {
  locale: Locale;
  stuck: StuckOrder[];
  dict: {
    admin: {
      stuckOrdersTitle: string;
      stuckOrdersHint: string;
      stuckOrdersNotify: string;
      stuckOrdersNotified: string;
      stuckOrderHours: string;
    };
  };
};

export function StuckOrdersBanner({ locale, stuck, dict }: Props) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const worst = stuck.reduce((m, o) => Math.max(m, o.stuckHours), 0);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
        <AlertTriangle className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {dict.admin.stuckOrdersTitle} — {stuck.length}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {dict.admin.stuckOrdersHint} ({Math.round(worst)}{" "}
          {dict.admin.stuckOrderHours})
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {stuck.slice(0, 5).map((o) => (
          <Link
            key={o.id}
            href={`/${locale}/admin/orders/${o.id}`}
            className="rounded-full border border-destructive/30 bg-background/60 px-3 py-1 text-xs font-medium text-destructive hover:bg-background"
            dir="ltr"
          >
            #{o.orderNumber} · {Math.round(o.stuckHours)}h
          </Link>
        ))}
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="gap-1.5"
        disabled={isPending || sent}
        onClick={() =>
          startTransition(async () => {
            await notifyStuckOrders(locale);
            setSent(true);
          })
        }
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        {sent ? dict.admin.stuckOrdersNotified : dict.admin.stuckOrdersNotify}
      </Button>
    </div>
  );
}
