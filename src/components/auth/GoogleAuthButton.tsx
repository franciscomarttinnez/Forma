"use client";

import { useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function GoogleAuthButton({
  next = "/onboarding",
}: {
  next?: string;
}) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        className="w-full gap-2"
        disabled={loading}
        onClick={() => void signInWithGoogle()}
      >
        <GoogleIcon />
        {loading ? t.common.loading : t.auth.continueWithGoogle}
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.5.4-2.4 1.9C5.5 19.1 8.5 21 12 21c2.4 0 4.4-.8 5.9-2.1l-3.1-2.4c-.8.5-1.9.9-2.8.9-2.2 0-4-1.5-4.7-3.5z"
      />
      <path
        fill="#4A90E2"
        d="M3.7 7.4C3.3 8.3 3 9.4 3 10.5s.3 2.2.7 3.1c0 .1 2.9-2.3 2.9-2.3-.2-.5-.3-1.1-.3-1.6 0-.6.1-1.1.3-1.6L3.7 7.4z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.1c1.3 0 2.5.5 3.4 1.3l2.6-2.6C16.4 2.4 14.4 1.5 12 1.5 8.5 1.5 5.5 3.4 3.7 6.4l2.9 2.3C7.9 6.6 9.8 5.1 12 5.1z"
      />
    </svg>
  );
}
