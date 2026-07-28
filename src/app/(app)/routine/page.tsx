import { redirect } from "next/navigation";
import { RoutinesListView } from "@/components/routine/RoutinesListView";
import { parsePreferences } from "@/lib/profile/preferences";
import { listUserRoutines } from "@/lib/routines/store";
import { createClient } from "@/lib/supabase/server";

export default async function RoutinesPage() {
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

  const routines = await listUserRoutines(supabase, user.id);
  const prefs = parsePreferences(profile.preferences);
  const activeId = prefs.activeRoutineId ?? routines[0]?.id ?? null;

  return (
    <RoutinesListView
      routines={routines.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.summary,
        updatedAt: item.updated_at,
        active: item.id === activeId,
      }))}
    />
  );
}
