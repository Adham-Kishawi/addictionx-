"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import {
  subscribeNewsletter,
  type NewsletterState,
} from "@/features/newsletter/actions";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionary";

// نموذج الاشتراك في النشرة البريدية (الفوتر) — يعمل بلا تسجيل دخول.

export function NewsletterForm({ dict }: { dict: Dictionary }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<NewsletterState>({});

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setState({});
    const fd = new FormData();
    fd.set("email", email);
    const res = await subscribeNewsletter(undefined, fd);
    setState(res);
    setPending(false);
    if (res.success) setEmail("");
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col items-center gap-3"
    >
      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={dict.newsletter.placeholder}
          aria-label={dict.newsletter.placeholder}
          dir="ltr"
          className="h-11 w-full rounded-full border border-border bg-background px-5 text-start text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          type="submit"
          disabled={pending}
          className="h-11 shrink-0 rounded-full px-7"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {dict.newsletter.submit}
        </Button>
      </div>
      <div className="text-center text-sm">
        {state.success && (
          <span className="flex items-center justify-center gap-1.5 text-emerald-500">
            <CheckCircle2 className="size-4" />
            {dict.newsletter.success}
          </span>
        )}
        {state.error && (
          <span className="flex items-center justify-center gap-1.5 text-destructive">
            <AlertCircle className="size-4" />
            {dict.newsletter.error}
          </span>
        )}
      </div>
    </form>
  );
}
