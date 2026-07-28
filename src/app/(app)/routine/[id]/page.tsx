import { redirect, notFound } from "next/navigation";
import { RoutineView } from "@/components/routine/RoutineView";
import { fetchRoutineById } from "@/lib/routines/store";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RoutineDetailPage({ params }: Props) {
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

  const { id } = await params;
  const routine = await fetchRoutineById(supabase, user.id, id);

  if (!routine) {
    notFound();
  }

  return <RoutineView routine={routine} />;
}
