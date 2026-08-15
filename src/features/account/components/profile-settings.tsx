"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  changePassword,
  removeAvatar,
  updateProfile,
} from "@/features/account/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Customer settings tab: profile picture + basic info + password change.

export function ProfileSettings({
  dict,
  user,
}: {
  dict: Dictionary;
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
    image: string | null;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [avatar, setAvatar] = useState<string | null>(user.image);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [profileMsg, setProfileMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [pwMsg, setPwMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);

  const saveProfile = async () => {
    setProfileMsg(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("phone", phone);
    const res = await updateProfile(undefined, fd);
    if (res?.success) {
      setProfileMsg({ type: "ok", text: dict.account.profileUpdated });
      router.refresh();
    } else {
      setProfileMsg({
        type: "err",
        text:
          res?.error === "PHONE"
            ? dict.account.fieldPhone
            : dict.account.updateProfileError,
      });
    }
  };

  const onPick = async (file?: File) => {
    if (!file) return;
    setAvatarError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setAvatarError(dict.account.pictureBadType);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(dict.account.pictureTooLarge);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setAvatarError(dict.account.pictureError);
        return;
      }
      setAvatar(data.url);
      router.refresh();
    } catch {
      setAvatarError(dict.account.pictureError);
    } finally {
      setUploading(false);
    }
  };

  const onRemoveAvatar = async () => {
    setAvatarError(null);
    setRemoving(true);
    await removeAvatar();
    setAvatar(null);
    setRemoving(false);
    router.refresh();
  };

  const savePassword = async (form: FormData) => {
    setPwMsg(null);
    const next = String(form.get("next") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (next !== confirm) {
      setPwMsg({ type: "err", text: dict.account.fieldPasswordMismatch });
      return;
    }
    const res = await changePassword(undefined, form);
    if (res?.success) {
      setPwMsg({ type: "ok", text: dict.account.passwordChanged });
      form.set("current", "");
      form.set("next", "");
      form.set("confirm", "");
    } else {
      setPwMsg({
        type: "err",
        text:
          res?.error === "WRONG_PASSWORD"
            ? dict.account.wrongCurrentPassword
            : res?.error === "WEAK"
              ? dict.account.fieldPasswordStrength
              : res?.error === "TOO_MANY_ATTEMPTS"
                ? dict.account.passwordRateLimited
                : dict.account.passwordChangeError,
      });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card/40 p-6">
        <h2 className="mb-5 font-display text-lg font-semibold">
          {dict.account.profileSettings}
        </h2>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={dict.account.profilePicture}
                className="size-20 rounded-full border border-border object-cover"
              />
            ) : (
              <span className="flex size-20 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
                <UserRound className="size-9" />
              </span>
            )}
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                <Loader2 className="size-5 animate-spin" />
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            >
              <Camera className="size-4" />
              {avatar ? dict.account.changePicture : dict.account.uploadPicture}
            </button>
            {avatar && (
              <button
                type="button"
                onClick={onRemoveAvatar}
                disabled={removing}
                className="inline-flex w-fit items-center gap-1.5 text-sm text-destructive hover:underline disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
                {dict.account.removePicture}
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
            {avatarError && (
              <p className="text-xs text-destructive">{avatarError}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">{dict.account.name}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">{dict.account.email}</span>
            <input
              type="email"
              value={user.email ?? ""}
              disabled
              className="h-11 w-full cursor-not-allowed rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground"
              dir="ltr"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">
              {dict.account.fieldPhone}
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+20 1XXXXXXXXX"
              dir="ltr"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          {profileMsg && (
            <p
              className={cn(
                "text-sm",
                profileMsg.type === "ok" ? "text-primary" : "text-destructive",
              )}
            >
              {profileMsg.text}
            </p>
          )}

          <button
            type="button"
            onClick={saveProfile}
            className="mt-1 h-11 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {dict.account.updateProfile}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/40 p-6">
        <h2 className="mb-5 font-display text-lg font-semibold">
          {dict.account.changePassword}
        </h2>

        <form action={savePassword} className="flex flex-col gap-4">
          <PasswordField name="current" label={dict.account.currentPassword} />
          <PasswordField name="next" label={dict.account.newPassword} />
          <PasswordField
            name="confirm"
            label={dict.account.confirmNewPassword}
          />

          {pwMsg && (
            <p
              className={cn(
                "text-sm",
                pwMsg.type === "ok" ? "text-primary" : "text-destructive",
              )}
            >
              {pwMsg.text}
            </p>
          )}

          <button
            type="submit"
            className="mt-1 h-11 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {dict.account.changePassword}
          </button>
        </form>
      </section>
    </div>
  );
}

function PasswordField({ label, name }: { label: string; name: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="password"
        name={name}
        autoComplete={name === "current" ? "current-password" : "new-password"}
        dir="ltr"
        className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}
