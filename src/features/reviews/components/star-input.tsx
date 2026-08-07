"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Read-only star display (reviews lists).

export function StarDisplay({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${value}/5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "size-3.5",
            star <= value
              ? "fill-primary text-primary"
              : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}

// Star picker 1..5 with a hover preview.

export function StarInput({
  value,
  onChange,
  disabled,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="radiogroup"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          disabled={disabled}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-125 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Star
            className={cn(
              "size-6 transition-colors",
              star <= value
                ? "fill-primary text-primary"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}
