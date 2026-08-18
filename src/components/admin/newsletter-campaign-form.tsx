"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle, Users } from "lucide-react";
import {
  sendNewsletterCampaign,
  type CampaignResult,
} from "@/features/newsletter/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Campaign form — admin writes a subject + body and broadcasts to all active subscribers.

export function NewsletterCampaignForm({
  dict,
  subscriberCount,
}: {
  dict: Dictionary;
  subscriberCount: number;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CampaignResult | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !window.confirm(
        dict.admin.newsletterCampaignConfirm.replace(
          "{count}",
          String(subscriberCount),
        ),
      )
    )
      return;

    setPending(true);
    setResult(null);
    try {
      const res = await sendNewsletterCampaign(subject, body);
      setResult(res);
      if (res.ok) {
        setSubject("");
        setBody("");
      }
    } catch {
      setResult({ ok: false, sent: 0, failed: 0, total: 0, error: "network" });
    } finally {
      setPending(false);
    }
  };

  if (subscriberCount === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Users className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">
          {dict.admin.newsletterCampaign}
        </h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {dict.admin.newsletterCampaignHint.replace(
          "{count}",
          String(subscriberCount),
        )}
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="campaign-subject"
            className="mb-1.5 block text-sm font-medium"
          >
            {dict.admin.newsletterCampaignSubject}
          </label>
          <input
            id="campaign-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={200}
            placeholder={dict.admin.newsletterCampaignSubjectPlaceholder}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <label
            htmlFor="campaign-body"
            className="mb-1.5 block text-sm font-medium"
          >
            {dict.admin.newsletterCampaignBody}
          </label>
          <textarea
            id="campaign-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
            maxLength={50000}
            placeholder={dict.admin.newsletterCampaignBodyPlaceholder}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending || !subject.trim() || !body.trim()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:shadow-lg disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {dict.admin.newsletterCampaignSend}
          </button>
          {!pending && (
            <span className="text-xs text-muted-foreground">
              {dict.admin.newsletterCampaignRecipients.replace(
                "{count}",
                String(subscriberCount),
              )}
            </span>
          )}
        </div>
      </form>

      {result && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${
            result.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="mt-px size-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-px size-4 shrink-0" />
          )}
          <div>
            {result.ok ? (
              <span>
                {dict.admin.newsletterCampaignSuccess
                  .replace("{sent}", String(result.sent))
                  .replace("{total}", String(result.total))}
              </span>
            ) : (
              <span>
                {result.error === "validation"
                  ? dict.admin.newsletterCampaignErrorValidation
                  : result.error === "rate_limited"
                    ? dict.admin.newsletterCampaignErrorRateLimit
                    : dict.admin.newsletterCampaignErrorGeneric}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
