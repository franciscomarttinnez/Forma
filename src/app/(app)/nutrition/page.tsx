import { redirect } from "next/navigation";
import { NutritionListView } from "@/components/nutrition/NutritionListView";
import { listNutritionPlans } from "@/lib/nutrition/store";
import { parsePreferences } from "@/lib/profile/preferences";
import { createClient } from "@/lib/supabase/server";

export default async function NutritionPage() {
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
  if (plans.length === 0) {
    redirect("/nutrition/new");
  }

  const prefs = parsePreferences(profile.preferences);
  const activeId = prefs.activeNutritionId ?? plans[0]?.id ?? null;

  return (
    <NutritionListView
      plans={plans.map((item) => ({
        ...item,
        active: item.id === activeId,
      }))}
    />
  );
}
