import type { SupabaseClient } from "@supabase/supabase-js";
import { parsePreferences } from "@/lib/profile/preferences";
import type { OnboardingData } from "@/lib/validations/onboarding";
import type { GeneratedRoutine } from "@/lib/validations/routine";
import type { Database, Json, Routine, RoutineWithDays } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function ensureProfile(
  supabase: Client,
  userId: string,
  displayName?: string | null,
) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return;

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    display_name: displayName ?? null,
  });

  if (error && !error.message.toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }
}

async function getActiveRoutineId(supabase: Client, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();
  const prefs = parsePreferences(data?.preferences);
  return prefs.activeRoutineId ?? null;
}

async function setActiveRoutineId(
  supabase: Client,
  userId: string,
  routineId: string,
) {
  const { data } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();
  const prefs = parsePreferences(data?.preferences);
  const { error } = await supabase
    .from("profiles")
    .update({
      preferences: {
        ...prefs,
        activeRoutineId: routineId,
      } as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

async function insertRoutineDays(
  supabase: Client,
  routineId: string,
  routine: GeneratedRoutine,
) {
  for (const day of routine.days) {
    const { data: dayRow, error: dayError } = await supabase
      .from("routine_days")
      .insert({
        routine_id: routineId,
        day_index: day.dayIndex,
        name: day.name,
        focus: day.focus,
      })
      .select()
      .single();

    if (dayError || !dayRow) {
      throw new Error(dayError?.message ?? "Could not save a day.");
    }

    const exercises = day.exercises.map((exercise, index) => ({
      day_id: dayRow.id,
      sort_order: index,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      rest_seconds: exercise.restSeconds,
      muscles: exercise.muscles,
      notes: exercise.notes ?? "",
      demo_url: exercise.demoUrl ?? null,
    }));

    const { error: exerciseError } = await supabase
      .from("exercises")
      .insert(exercises);

    if (exerciseError) {
      throw new Error(exerciseError.message);
    }
  }
}

export async function listUserRoutines(
  supabase: Client,
  userId: string,
): Promise<Routine[]> {
  const { data, error } = await supabase
    .from("routines")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listUserRoutinesWithDays(
  supabase: Client,
  userId: string,
) {
  const routines = await listUserRoutines(supabase, userId);
  if (!routines.length) return [];

  const { data: days, error } = await supabase
    .from("routine_days")
    .select("id, routine_id, day_index, name, focus")
    .in(
      "routine_id",
      routines.map((r) => r.id),
    )
    .order("day_index", { ascending: true });

  if (error) throw new Error(error.message);

  return routines.map((routine) => ({
    id: routine.id,
    title: routine.title,
    summary: routine.summary,
    updatedAt: routine.updated_at,
    days: (days ?? [])
      .filter((day) => day.routine_id === routine.id)
      .map((day) => ({
        id: day.id,
        name: day.name,
        dayIndex: day.day_index,
        focus: day.focus,
      })),
  }));
}

export async function fetchRoutineById(
  supabase: Client,
  userId: string,
  routineId: string,
): Promise<RoutineWithDays | null> {
  const { data: routine, error } = await supabase
    .from("routines")
    .select("*")
    .eq("id", routineId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!routine) return null;

  const { data: days, error: daysError } = await supabase
    .from("routine_days")
    .select("*")
    .eq("routine_id", routine.id)
    .order("day_index", { ascending: true });

  if (daysError) throw new Error(daysError.message);

  const dayIds = (days ?? []).map((d) => d.id);
  const { data: exercises, error: exercisesError } = dayIds.length
    ? await supabase
        .from("exercises")
        .select("*")
        .in("day_id", dayIds)
        .order("sort_order", { ascending: true })
    : { data: [], error: null };

  if (exercisesError) throw new Error(exercisesError.message);

  return {
    ...routine,
    days: (days ?? []).map((day) => ({
      ...day,
      exercises: (exercises ?? []).filter((e) => e.day_id === day.id),
    })),
  };
}

export async function fetchUserRoutine(
  supabase: Client,
  userId: string,
  routineId?: string | null,
): Promise<RoutineWithDays | null> {
  if (routineId) {
    return fetchRoutineById(supabase, userId, routineId);
  }

  const activeId = await getActiveRoutineId(supabase, userId);
  if (activeId) {
    const active = await fetchRoutineById(supabase, userId, activeId);
    if (active) return active;
  }

  const { data: latest, error } = await supabase
    .from("routines")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!latest) return null;
  return fetchRoutineById(supabase, userId, latest.id);
}

/** Create a new routine (keeps existing ones). */
export async function createGeneratedRoutine(
  supabase: Client,
  userId: string,
  routine: GeneratedRoutine,
  options?: { name?: string },
) {
  const title = options?.name?.trim() || routine.title;

  const { data: created, error } = await supabase
    .from("routines")
    .insert({
      user_id: userId,
      title,
      summary: routine.summary,
      ai_rationale: routine.aiRationale,
    })
    .select()
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Could not save the routine.");
  }

  await insertRoutineDays(supabase, created.id, routine);
  await setActiveRoutineId(supabase, userId, created.id);
  return created.id;
}

/** Replace content of an existing routine (coach / modify / edit datos). */
export async function replaceGeneratedRoutine(
  supabase: Client,
  userId: string,
  routineId: string,
  routine: GeneratedRoutine,
  options?: { name?: string },
) {
  const existing = await fetchRoutineById(supabase, userId, routineId);
  if (!existing) {
    throw new Error("Routine not found.");
  }

  const { error: deleteDaysError } = await supabase
    .from("routine_days")
    .delete()
    .eq("routine_id", routineId);

  if (deleteDaysError) throw new Error(deleteDaysError.message);

  const title = options?.name?.trim() || existing.title;

  const { error: updateError } = await supabase
    .from("routines")
    .update({
      title,
      summary: routine.summary,
      ai_rationale: routine.aiRationale,
      updated_at: new Date().toISOString(),
    })
    .eq("id", routineId)
    .eq("user_id", userId);

  if (updateError) throw new Error(updateError.message);

  await insertRoutineDays(supabase, routineId, routine);
  await setActiveRoutineId(supabase, userId, routineId);
  return routineId;
}

/** @deprecated Prefer createGeneratedRoutine / replaceGeneratedRoutine */
export async function saveGeneratedRoutine(
  supabase: Client,
  userId: string,
  routine: GeneratedRoutine,
  options?: { replaceId?: string; name?: string },
) {
  if (options?.replaceId) {
    return replaceGeneratedRoutine(
      supabase,
      userId,
      options.replaceId,
      routine,
    );
  }
  return createGeneratedRoutine(supabase, userId, routine, {
    name: options?.name,
  });
}

export async function renameRoutine(
  supabase: Client,
  userId: string,
  routineId: string,
  title: string,
) {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Name cannot be empty.");

  const { error } = await supabase
    .from("routines")
    .update({
      title: trimmed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", routineId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function activateRoutine(
  supabase: Client,
  userId: string,
  routineId: string,
) {
  const existing = await fetchRoutineById(supabase, userId, routineId);
  if (!existing) throw new Error("Routine not found.");
  await setActiveRoutineId(supabase, userId, routineId);
}

export async function deleteRoutine(
  supabase: Client,
  userId: string,
  routineId: string,
) {
  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", routineId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  const activeId = await getActiveRoutineId(supabase, userId);
  if (activeId === routineId) {
    const remaining = await listUserRoutines(supabase, userId);
    if (remaining[0]) {
      await setActiveRoutineId(supabase, userId, remaining[0].id);
    } else {
      const { data } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", userId)
        .maybeSingle();
      const prefs = parsePreferences(data?.preferences);
      const next = { ...prefs };
      delete next.activeRoutineId;
      await supabase
        .from("profiles")
        .update({
          preferences: next as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }
  }
}

export function routineToGenerated(routine: RoutineWithDays): GeneratedRoutine {
  return {
    title: routine.title,
    summary: routine.summary,
    aiRationale: routine.ai_rationale,
    days: routine.days.map((day) => ({
      dayIndex: day.day_index,
      name: day.name,
      focus: day.focus,
      exercises: day.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        restSeconds: exercise.rest_seconds,
        muscles: exercise.muscles,
        notes: exercise.notes,
        demoUrl: exercise.demo_url,
      })),
    })),
  };
}

export async function markOnboardingComplete(
  supabase: Client,
  userId: string,
  preferences: OnboardingData,
) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();

  const current = parsePreferences(existing?.preferences);

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      preferences: {
        ...current,
        ...preferences,
      } as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}
