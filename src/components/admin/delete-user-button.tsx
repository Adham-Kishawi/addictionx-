"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteUser } from "@/features/admin/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function DeleteUserButton({
  userId,
  self,
  dict,
}: {
  userId: string;
  self: boolean;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  if (self) return null;

  const onClick = async () => {
    if (!window.confirm(dict.admin.deleteConfirm)) return;
    setPending(true);
    setError(false);
    try {
      await deleteUser(userId);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label={dict.admin.deleteUser}
        title={dict.admin.deleteUser}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </button>
      {error && (
        <span className="text-[0.65rem] text-destructive">
          {dict.admin.userDeleteError}
        </span>
      )}
    </span>
  );
}
