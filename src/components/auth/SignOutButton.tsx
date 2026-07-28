"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const { t } = useI18n();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="w-full justify-center"
      onClick={signOut}
    >
      {t.common.signOut}
    </Button>
  );
}
