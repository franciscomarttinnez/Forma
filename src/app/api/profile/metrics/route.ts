import { NextResponse } from "next/server";
import { z } from "zod";
import {
  parsePreferences,
  type ProfilePreferences,
} from "@/lib/profile/preferences";
import { createClient } from "@/lib/supabase/server";
import {
  equipmentOptions,
  goalOptions,
  levelOptions,
} from "@/lib/validations/onboarding";
import type { Json } from "@/types/database";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function readPrefs(userId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, preferences")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return {
    profile: data,
    preferences: parsePreferences(data?.preferences),
  };
}

async function writePrefs(userId: string, preferences: ProfilePreferences) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      preferences: preferences as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

export async function GET() {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const { profile, preferences } = await readPrefs(user.id);
    return NextResponse.json({
      displayName: profile?.display_name ?? null,
      preferences,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load the profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const updateSchema = z.object({
  goal: z.enum(goalOptions).optional(),
  level: z.enum(levelOptions).optional(),
  daysPerWeek: z.number().int().min(2).max(6).optional(),
  sessionMinutes: z.number().int().min(20).max(120).optional(),
  equipment: z.array(z.enum(equipmentOptions)).min(1).optional(),
  injuries: z.string().max(500).optional(),
  avoidExercises: z.string().max(500).optional(),
  preferences: z.string().max(500).optional(),
  heightCm: z.number().min(100).max(250).nullable().optional(),
  weightKg: z.number().positive().max(400).nullable().optional(),
  logWeightKg: z.number().positive().max(400).optional(),
  clearCoachChat: z.boolean().optional(),
  clearNutritionCoachChat: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const { user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const body = updateSchema.parse(await request.json());
    const { preferences } = await readPrefs(user.id);
    const next: ProfilePreferences = { ...preferences };

    if (body.goal) next.goal = body.goal;
    if (body.level) next.level = body.level;
    if (body.daysPerWeek) next.daysPerWeek = body.daysPerWeek;
    if (body.sessionMinutes) next.sessionMinutes = body.sessionMinutes;
    if (body.equipment) next.equipment = body.equipment;
    if (body.injuries !== undefined) next.injuries = body.injuries;
    if (body.avoidExercises !== undefined) next.avoidExercises = body.avoidExercises;
    if (body.preferences !== undefined) next.preferences = body.preferences;

    if (body.heightCm === null) delete next.heightCm;
    else if (typeof body.heightCm === "number") next.heightCm = body.heightCm;

    if (body.weightKg === null) delete next.weightKg;
    else if (typeof body.weightKg === "number") next.weightKg = body.weightKg;

    if (typeof body.logWeightKg === "number") {
      next.weightKg = body.logWeightKg;
      next.weightLogs = [
        ...next.weightLogs,
        {
          id: crypto.randomUUID(),
          weightKg: body.logWeightKg,
          recordedAt: new Date().toISOString().slice(0, 10),
        },
      ].slice(-60);
    }

    if (body.clearCoachChat) {
      next.coachChat = [];
    }

    if (body.clearNutritionCoachChat) {
      next.nutritionCoachChat = [];
    }

    await writePrefs(user.id, next);
    return NextResponse.json({ preferences: next });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save the profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
