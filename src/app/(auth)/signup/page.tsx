"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const origin = window.location.origin;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.replace("/onboarding");
      router.refresh();
      return;
    }

    setMessage(t.auth.checkEmail);
    setLoading(false);
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <LanguageToggle />
      </div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {t.auth.createAccount}
      </h1>
      <p className="mt-2 text-sm text-muted">{t.auth.signupSub}</p>

      <div className="mt-8 space-y-4">
        <GoogleAuthButton next="/onboarding" />

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
            <Label htmlFor="name">{t.auth.name}</Label>
            <Input
              id="name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
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
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {message ? <p className="text-sm text-success">{message}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t.auth.creating : t.common.continue}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-medium text-accent">
          {t.auth.login}
        </Link>
      </p>
    </>
  );
}
