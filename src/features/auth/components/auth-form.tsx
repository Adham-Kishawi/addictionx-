"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { HeartbeatLine } from "@/components/motion/heartbeat-line";
import { Button } from "@/components/ui/button";
import { getDictionary, type Locale } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import { registerAction } from "@/features/auth/actions";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function AuthForm({
  mode,
  locale,
  callbackUrl,
  googleEnabled = true,
}: {
  mode: "login" | "register";
  locale: Locale;
  callbackUrl?: string;
  googleEnabled?: boolean;
}) {
  const dict = getDictionary(locale);
  const isLogin = mode === "login";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Only allow same-site relative callbacks — blocks open-redirect phishing
  // via ?callbackUrl=https://evil.example
  const safeCallbackUrl =
    callbackUrl &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//") &&
    !callbackUrl.startsWith("/\\")
      ? callbackUrl
      : undefined;
  const targetUrl = safeCallbackUrl || `/${locale}/account`;

  const passwordRule = (v: string) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(v);

  const schema = z
    .object({
      name: isLogin
        ? z.string().optional()
        : z.string().min(2, dict.account.fieldNameError).max(120),
      email: z
        .string()
        .min(1, dict.account.fieldRequired)
        .email(dict.account.fieldEmailError),
      password: isLogin
        ? z.string().min(1, dict.account.fieldRequired)
        : z
            .string()
            .min(8, dict.account.fieldPasswordError)
            .refine(passwordRule, dict.account.fieldPasswordStrength),
      confirmPassword: isLogin
        ? z.string().optional()
        : z.string().min(1, dict.account.fieldRequired),
    })
    .refine(
      (v) => isLogin || !v.confirmPassword || v.password === v.confirmPassword,
      {
        message: dict.account.fieldPasswordMismatch,
        path: ["confirmPassword"],
      },
    );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const signInAfterAuth = async (email: string, password: string) => {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: targetUrl,
    });

    if (res?.error) {
      setFormError(dict.account.errorInvalidCredentials);
      return false;
    }

    router.replace(targetUrl);
    return true;
  };

  const onSubmitLogin = handleSubmit(async (values) => {
    setFormError(null);
    setLoading(true);
    await signInAfterAuth(values.email, values.password);
    setLoading(false);
  });

  const onSubmitRegister = handleSubmit(async (values) => {
    setFormError(null);
    setLoading(true);

    const formData = new FormData();
    formData.set("name", values.name ?? "");
    formData.set("email", values.email);
    formData.set("password", values.password);

    const result = await registerAction({}, formData);
    if (result?.success) {
      await signInAfterAuth(values.email, values.password);
    } else {
      setFormError(
        result?.error === "EMAIL_EXISTS"
          ? dict.account.errorEmailExists
          : result?.error === "WEAK_PASSWORD"
            ? dict.account.fieldPasswordStrength
            : dict.account.errorGeneric,
      );
    }
    setLoading(false);
  });

  const onSubmit = isLogin ? onSubmitLogin : onSubmitRegister;

  const [googleLoading, setGoogleLoading] = useState(false);

  const onGoogle = async () => {
    setFormError(null);
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: targetUrl });
    } catch {
      setFormError(dict.account.googleError);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <HeartbeatLine className="h-8 w-16 text-primary" />
        <h1 className="font-display text-3xl font-bold">
          {isLogin ? dict.account.loginTitle : dict.account.registerTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLogin ? dict.account.loginSubtitle : dict.account.registerSubtitle}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-card/40 p-6"
        noValidate
      >
        {!isLogin && (
          <Field label={dict.account.name} error={errors.name?.message}>
            <input
              type="text"
              {...register("name")}
              className={inputClass(!!errors.name)}
              placeholder={dict.account.namePlaceholder}
            />
          </Field>
        )}

        <Field label={dict.account.email} error={errors.email?.message}>
          <input
            type="email"
            {...register("email")}
            className={inputClass(!!errors.email)}
            placeholder={dict.account.emailPlaceholder}
            dir="ltr"
          />
        </Field>

        <Field label={dict.account.password} error={errors.password?.message}>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className={cn(inputClass(!!errors.password), "pe-10")}
              placeholder="••••••••"
              dir="ltr"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </Field>

        {!isLogin && (
          <Field
            label={dict.account.confirmPassword}
            error={errors.confirmPassword?.message}
          >
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                className={cn(inputClass(!!errors.confirmPassword), "pe-10")}
                placeholder="••••••••"
                dir="ltr"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </Field>
        )}

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="mt-2 h-11 w-full rounded-full"
        >
          {loading
            ? dict.common.loading
            : isLogin
              ? dict.account.login
              : dict.account.register}
        </Button>
      </form>

      {googleEnabled && (
        <>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">
              {dict.account.or}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={googleLoading}
            onClick={onGoogle}
            className="mt-5 h-11 w-full rounded-full gap-2"
          >
            <GoogleIcon />
            {googleLoading
              ? dict.common.loading
              : dict.account.continueWithGoogle}
          </Button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isLogin ? dict.account.noAccount : dict.account.haveAccount}{" "}
        <Link
          href={
            isLogin
              ? `/${locale}/register`
              : `/${locale}/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`
          }
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {isLogin ? dict.account.createOne : dict.account.loginNow}
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
    hasError ? "border-destructive" : "border-border",
  );
}
