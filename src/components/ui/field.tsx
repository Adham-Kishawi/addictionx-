"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function fieldInputClass(hasError?: boolean) {
  return cn(
    "h-12 w-full rounded-xl border bg-background px-3.5 text-sm text-foreground shadow-sm outline-none transition-all placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20",
    hasError ? "border-destructive" : "border-border",
  );
}

export function fieldTextareaClass(hasError?: boolean) {
  return cn(
    fieldInputClass(hasError),
    "min-h-24 resize-y py-2.5 leading-relaxed",
  );
}

export function Field({
  label,
  error,
  hint,
  required,
  htmlFor,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-muted-foreground"
      >
        <span>{label}</span>
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && (
        <span className="text-xs text-muted-foreground">{hint}</span>
      )}
      {error && (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium text-destructive"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function ErrorBanner({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={cn(
        "flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive",
        className,
      )}
    >
      <AlertCircle className="size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
