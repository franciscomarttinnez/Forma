import { NextResponse } from "next/server";
import { modifyRoutineWithInstruction } from "@/lib/ai/routines";
import { enrichRoutineWithExerciseDb } from "@/lib/exercisedb/enrich";
import { parsePreferences } from "@/lib/profile/preferences";
import { toOnboardingData } from "@/lib/profile/to-onboarding";
import {
  fetchRoutineById,
  replaceGeneratedRoutine,
  routineToGenerated,
} from "@/lib/routines/store";
import { createClient } from "@/lib/supabase/server";
import { modifyRoutineRequestSchema } from "@/lib/validations/routine";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = modifyRoutineRequestSchema.parse(await request.json());
    const current = await fetchRoutineById(supabase, user.id, body.routineId);

    if (!current) {
      return NextResponse.json(
        { error: "Routine not found." },
        { status: 404 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle();

    const preferences = parsePreferences(profile?.preferences);
    const updated = await modifyRoutineWithInstruction({
      instruction: body.instruction,
      current: routineToGenerated(current),
      preferences: toOnboardingData(preferences),
    });

    const enriched = await enrichRoutineWithExerciseDb(updated);
    const routineId = await replaceGeneratedRoutine(
      supabase,
      user.id,
      body.routineId,
      enriched,
    );

    return NextResponse.json({
      routineId,
      aiRationale: enriched.aiRationale,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to modify routine.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
