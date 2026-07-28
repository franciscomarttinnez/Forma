import { notFound, redirect } from "next/navigation";
import { RoutineEditForm } from "@/components/routine/RoutineEditForm";
import { parsePreferences } from "@/lib/profile/preferences";
import { toOnboardingData } from "@/lib/profile/to-onboarding";
import { fetchRoutineById } from "@/lib/routines/store";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function EditRoutinePage({ params }: Props) {
  const { id } = await params;
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

  const routine = await fetchRoutineById(supabase, user.id, id);
  if (!routine) notFound();

  const prefs = parsePreferences(profile.preferences);

  return (
    <RoutineEditForm
      routineId={routine.id}
      routineTitle={routine.title}
      initial={toOnboardingData(prefs)}
    />
  );
}
