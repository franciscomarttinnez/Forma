import { NextResponse } from "next/server";
import { z } from "zod";
import { coachActionSchema, runCoachAction } from "@/lib/ai/coach-chat";
import { enrichRoutineWithExerciseDb } from "@/lib/exercisedb/enrich";
import { parseLocale } from "@/lib/i18n/locale";
import {
  parsePreferences,
  type CoachMessage,
} from "@/lib/profile/preferences";
import { toOnboardingData } from "@/lib/profile/to-onboarding";
import {
  fetchRoutineById,
  replaceGeneratedRoutine,
  routineToGenerated,
} from "@/lib/routines/store";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const bodySchema = z.object({
  routineId: z.string().uuid(),
  action: coachActionSchema,
  locale: z.enum(["en", "es"]).optional(),
});

const MAX_CHAT = 40;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = bodySchema.parse(await request.json());
    const locale = parseLocale(body.locale);
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
    const result = runCoachAction({
      action: body.action,
      current: routineToGenerated(current),
      preferences: toOnboardingData(preferences),
      locale,
    });

    const now = new Date().toISOString();
    const userMsg: CoachMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: result.label,
      createdAt: now,
    };
    const coachMsg: CoachMessage = {
      id: crypto.randomUUID(),
      role: "coach",
      content: result.reply,
      createdAt: now,
    };

    const nextPrefs = {
      ...preferences,
      coachChat: [...preferences.coachChat, userMsg, coachMsg].slice(-MAX_CHAT),
      daysPerWeek: result.routine?.days.length ?? preferences.daysPerWeek,
      activeRoutineId: body.routineId,
    };

    if (result.modified && result.routine) {
      const enriched = await enrichRoutineWithExerciseDb(result.routine);
      await replaceGeneratedRoutine(
        supabase,
        user.id,
        body.routineId,
        enriched,
      );
      nextPrefs.daysPerWeek = enriched.days.length;

      await supabase
        .from("profiles")
        .update({
          preferences: nextPrefs as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      return NextResponse.json({
        reply: result.reply,
        modified: true,
        aiRationale: enriched.aiRationale,
        messages: [userMsg, coachMsg],
      });
    }

    await supabase
      .from("profiles")
      .update({
        preferences: nextPrefs as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({
      reply: result.reply,
      modified: false,
      messages: [userMsg, coachMsg],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Coach error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
