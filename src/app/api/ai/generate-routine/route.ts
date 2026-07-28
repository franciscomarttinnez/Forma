import { NextResponse } from "next/server";
import { z } from "zod";
import { generateRoutineFromOnboarding } from "@/lib/ai/routines";
import { enrichRoutineWithExerciseDb } from "@/lib/exercisedb/enrich";
import { parseLocale } from "@/lib/i18n/locale";
import {
  createGeneratedRoutine,
  ensureProfile,
  markOnboardingComplete,
  replaceGeneratedRoutine,
} from "@/lib/routines/store";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validations/onboarding";

const bodySchema = onboardingSchema.extend({
  name: z.string().trim().min(1).max(80).optional(),
  replaceRoutineId: z.string().uuid().optional(),
  locale: z.enum(["en", "es"]).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    await ensureProfile(
      supabase,
      user.id,
      (user.user_metadata?.display_name as string | undefined) ??
        user.email?.split("@")[0] ??
        null,
    );

    const body = bodySchema.parse(await request.json());
    const { name, replaceRoutineId, locale: localeRaw, ...preferences } = body;
    const locale = parseLocale(localeRaw);
    const routine = await generateRoutineFromOnboarding(preferences, locale);
    const enriched = await enrichRoutineWithExerciseDb(routine);

    let routineId: string;
    if (replaceRoutineId) {
      await replaceGeneratedRoutine(
        supabase,
        user.id,
        replaceRoutineId,
        enriched,
        { name },
      );
      routineId = replaceRoutineId;
    } else {
      routineId = await createGeneratedRoutine(
        supabase,
        user.id,
        enriched,
        { name },
      );
    }

    await markOnboardingComplete(supabase, user.id, preferences);

    return NextResponse.json({ routineId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate routine.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
