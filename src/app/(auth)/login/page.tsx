"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/routine";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <LanguageToggle />
      </div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {t.auth.welcomeBack}
      </h1>
      <p className="mt-2 text-sm text-muted">{t.auth.loginSub}</p>

      <div className="mt-8 space-y-4">
        <GoogleAuthButton next={next === "/routine" ? "/routine" : next} />

        <div className="relative py-1 text-center">
          <span className="relative z-10 bg-card px-3 text-xs uppercase tracking-[0.12em] text-muted">
            {t.auth.orEmail}
          </span>
          <span
            aria-hidden
            className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"
          />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t.auth.loggingIn : t.auth.login}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {t.auth.noAccount}{" "}
        <Link href="/signup" className="font-medium text-accent">
          {t.auth.createOne}
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<p className="text-sm text-muted">{t.common.loading}</p>}>
      <LoginForm />
    </Suspense>
  );
}
