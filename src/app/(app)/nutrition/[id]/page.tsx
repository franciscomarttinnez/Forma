import { notFound, redirect } from "next/navigation";
import { NutritionPlanView } from "@/components/nutrition/NutritionPlanView";
import { activateNutritionPlan, getNutritionPlan } from "@/lib/nutrition/store";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function NutritionDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const plan = await getNutritionPlan(supabase, user.id, id);
  if (!plan) notFound();

  await activateNutritionPlan(supabase, user.id, id);

  return <NutritionPlanView plan={plan} />;
}
