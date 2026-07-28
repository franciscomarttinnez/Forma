import { NextResponse } from "next/server";
import { z } from "zod";
import {
  computeStreaks,
  isTodayDate,
  logsForRoutine,
  todayKey,
} from "@/lib/calendar/streaks";
import {
  parsePreferences,
  type ProfilePreferences,
  workoutLogSchema,
  workoutStatusOptions,
} from "@/lib/profile/preferences";
import {
  fetchRoutineById,
  listUserRoutinesWithDays,
} from "@/lib/routines/store";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

async function readPrefs(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { supabase, preferences: parsePreferences(data?.preferences) };
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

function summarizeRoutine(
  routine: NonNullable<Awaited<ReturnType<typeof fetchRoutineById>>>,
) {
  return {
    id: routine.id,
    title: routine.title,
    days: routine.days
      .slice()
      .sort((a, b) => a.day_index - b.day_index)
      .map((d) => ({
        id: d.id,
        dayIndex: d.day_index,
        name: d.name,
        focus: d.focus,
      })),
  };
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { preferences } = await readPrefs(user.id);
    const routines = await listUserRoutinesWithDays(supabase, user.id);
    const routineList = routines.map((r) => ({
      id: r.id,
      title: r.title,
    }));

    const url = new URL(request.url);
    const requestedId = url.searchParams.get("routineId");
    const pickId =
      (requestedId && routineList.some((r) => r.id === requestedId)
        ? requestedId
        : null) ??
      (preferences.calendarRoutineId &&
      routineList.some((r) => r.id === preferences.calendarRoutineId)
        ? preferences.calendarRoutineId
        : null) ??
      preferences.activeRoutineId ??
      routineList[0]?.id ??
      null;

    if (
      pickId &&
      preferences.calendarRoutineId !== pickId
    ) {
      await writePrefs(user.id, {
        ...preferences,
        calendarRoutineId: pickId,
      });
    }

    let selectedRoutine = null;
    if (pickId) {
      const full = await fetchRoutineById(supabase, user.id, pickId);
      if (full) selectedRoutine = summarizeRoutine(full);
    }

    const logs = pickId
      ? logsForRoutine(preferences.workoutLogs, pickId)
      : [];
    const streaks = computeStreaks(logs);

    return NextResponse.json({
      routines: routineList,
      routineId: pickId,
      selectedRoutine,
      logs,
      streaks,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not load the calendar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const upsertSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  routineId: z.string().uuid(),
  status: z.enum(workoutStatusOptions),
  dayName: z.string().trim().max(80).optional(),
  note: z.string().trim().max(400).optional(),
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

    const body = upsertSchema.parse(await request.json());
    if (!isTodayDate(body.date, todayKey())) {
      return NextResponse.json(
        { error: "You can only check in for today." },
        { status: 400 },
      );
    }
    if (body.status === "trained" && !body.dayName?.trim()) {
      return NextResponse.json(
        { error: "Choose which routine day you completed." },
        { status: 400 },
      );
    }

    const { preferences } = await readPrefs(user.id);
    const existing = preferences.workoutLogs.find(
      (l) => l.date === body.date && l.routineId === body.routineId,
    );

    const entry = workoutLogSchema.parse({
      id: existing?.id ?? crypto.randomUUID(),
      date: body.date,
      status: body.status,
      routineId: body.routineId,
      dayName:
        body.status === "trained" ? body.dayName?.trim() : undefined,
      note: body.note?.trim() || undefined,
    });

    const without = preferences.workoutLogs.filter(
      (l) => !(l.date === body.date && l.routineId === body.routineId),
    );
    const workoutLogs = [...without, entry].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const next: ProfilePreferences = {
      ...preferences,
      workoutLogs,
      calendarRoutineId: body.routineId,
    };
    await writePrefs(user.id, next);

    const planLogs = logsForRoutine(workoutLogs, body.routineId);
    const streaks = computeStreaks(planLogs);
    return NextResponse.json({
      logs: planLogs,
      streaks,
      log: entry,
      routineId: body.routineId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not check in that day.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const deleteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  routineId: z.string().uuid(),
});

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = deleteSchema.parse(await request.json());
    if (!isTodayDate(body.date, todayKey())) {
      return NextResponse.json(
        { error: "You can only edit today's check-in." },
        { status: 400 },
      );
    }
    const { preferences } = await readPrefs(user.id);
    const workoutLogs = preferences.workoutLogs.filter(
      (l) => !(l.date === body.date && l.routineId === body.routineId),
    );
    const next: ProfilePreferences = { ...preferences, workoutLogs };
    await writePrefs(user.id, next);

    const planLogs = logsForRoutine(workoutLogs, body.routineId);
    const streaks = computeStreaks(planLogs);
    return NextResponse.json({
      logs: planLogs,
      streaks,
      routineId: body.routineId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not remove the check-in.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const selectSchema = z.object({
  calendarRoutineId: z.string().uuid(),
});

/** Persist which routine calendar the user is viewing. */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = selectSchema.parse(await request.json());
    const { preferences } = await readPrefs(user.id);
    await writePrefs(user.id, {
      ...preferences,
      calendarRoutineId: body.calendarRoutineId,
    });
    return NextResponse.json({ calendarRoutineId: body.calendarRoutineId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not change the plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
