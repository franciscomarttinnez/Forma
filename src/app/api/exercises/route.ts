import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createExerciseSchema = z.object({
  dayId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  muscles: z.array(z.string().min(1)).min(1).max(8),
  demo_url: z.string().max(500).nullable().optional(),
  sets: z.number().int().min(1).max(10).optional().default(3),
  reps: z.string().min(1).max(40).optional().default("8-12"),
  rest_seconds: z.number().int().min(0).max(600).optional().default(90),
  notes: z.string().max(500).optional().default(""),
});

const updateExerciseSchema = z.object({
  id: z.string().uuid(),
  sets: z.number().int().min(1).max(10).optional(),
  reps: z.string().min(1).max(40).optional(),
  rest_seconds: z.number().int().min(0).max(600).optional(),
  notes: z.string().max(500).optional(),
  name: z.string().min(1).max(120).optional(),
  muscles: z.array(z.string().min(1)).min(1).max(8).optional(),
  demo_url: z.string().max(500).nullable().optional(),
});

const deleteExerciseSchema = z.object({
  id: z.string().uuid(),
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

    const payload = createExerciseSchema.parse(await request.json());

    const { data: day, error: dayError } = await supabase
      .from("routine_days")
      .select("id, routine_id")
      .eq("id", payload.dayId)
      .maybeSingle();

    if (dayError) {
      return NextResponse.json({ error: dayError.message }, { status: 400 });
    }
    if (!day) {
      return NextResponse.json({ error: "Day not found." }, { status: 404 });
    }

    const { data: routine, error: routineError } = await supabase
      .from("routines")
      .select("id")
      .eq("id", day.routine_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (routineError) {
      return NextResponse.json({ error: routineError.message }, { status: 400 });
    }
    if (!routine) {
      return NextResponse.json({ error: "Routine not found." }, { status: 404 });
    }

    const { data: existing, error: sortError } = await supabase
      .from("exercises")
      .select("sort_order")
      .eq("day_id", payload.dayId)
      .order("sort_order", { ascending: false })
      .limit(1);

    if (sortError) {
      return NextResponse.json({ error: sortError.message }, { status: 400 });
    }

    const nextSort = (existing?.[0]?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("exercises")
      .insert({
        day_id: payload.dayId,
        sort_order: nextSort,
        name: payload.name,
        muscles: payload.muscles,
        demo_url: payload.demo_url ?? null,
        sets: payload.sets,
        reps: payload.reps,
        rest_seconds: payload.rest_seconds,
        notes: payload.notes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase
      .from("routines")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", routine.id);

    return NextResponse.json({ exercise: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not add the exercise.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const payload = updateExerciseSchema.parse(await request.json());
    const { id, ...updates } = payload;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No changes to save." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("exercises")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ exercise: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save the exercise.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const payload = deleteExerciseSchema.parse(await request.json());

    const { data: exercise, error: fetchError } = await supabase
      .from("exercises")
      .select("id, day_id")
      .eq("id", payload.id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }
    if (!exercise) {
      return NextResponse.json(
        { error: "Exercise not found." },
        { status: 404 },
      );
    }

    const { count, error: countError } = await supabase
      .from("exercises")
      .select("id", { count: "exact", head: true })
      .eq("day_id", exercise.day_id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 400 });
    }

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "The day needs at least one exercise." },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("exercises")
      .delete()
      .eq("id", payload.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not delete the exercise.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
