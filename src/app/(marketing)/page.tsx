import { LandingPage } from "@/components/marketing/LandingPage";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
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
    <LandingPage isAuthenticated={Boolean(user)} appHref={appHref} />
  );
}
