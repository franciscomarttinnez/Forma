import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ new?: string }>;
};

export default async function OnboardingPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const creatingNew = params.new === "1" || params.new === "true";

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed && !creatingNew) {
    redirect("/routine");
  }

  return <OnboardingWizard mode={creatingNew ? "new" : "first"} />;
}
