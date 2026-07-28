import { redirect } from "next/navigation";
import { NutritionForm } from "@/components/nutrition/NutritionForm";
import { listNutritionPlans } from "@/lib/nutrition/store";
import { parsePreferences } from "@/lib/profile/preferences";
import { createClient } from "@/lib/supabase/server";

export default async function NewNutritionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, preferences")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const plans = await listNutritionPlans(supabase, user.id);
  const prefs = parsePreferences(profile.preferences);

  return (
    <NutritionForm
      isFirst={plans.length === 0}
      defaults={{
        weightKg: prefs.weightKg,
        heightCm: prefs.heightCm,
        goal: prefs.goal,
      }}
    />
  );
}
