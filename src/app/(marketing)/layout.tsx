import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let appHref = "/routine";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.onboarding_completed) {
      appHref = "/onboarding";
    }
  }

  return (
    <MarketingShell>
      <div className="relative min-h-screen">
        <MarketingHeader
          isAuthenticated={Boolean(user)}
          appHref={appHref}
        />
        {children}
      </div>
    </MarketingShell>
  );
}
