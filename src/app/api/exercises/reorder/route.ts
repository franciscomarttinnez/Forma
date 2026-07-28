import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const reorderSchema = z.object({
  dayId: z.string().uuid(),
  exerciseIds: z.array(z.string().uuid()).min(1).max(40),
});

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = reorderSchema.parse(await request.json());

    const { data: day, error: dayError } = await supabase
      .from("routine_days")
      .select("id, routine_id")
      .eq("id", body.dayId)
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

    const { data: existing, error: existingError } = await supabase
      .from("exercises")
      .select("id")
      .eq("day_id", body.dayId);

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 400 });
    }

    const existingIds = new Set((existing ?? []).map((item) => item.id));
    if (
      body.exerciseIds.length !== existingIds.size ||
      body.exerciseIds.some((id) => !existingIds.has(id))
    ) {
      return NextResponse.json(
        { error: "The exercise list does not match the day." },
        { status: 400 },
      );
    }

    const updates = await Promise.all(
      body.exerciseIds.map((id, index) =>
        supabase
          .from("exercises")
          .update({ sort_order: index })
          .eq("id", id)
          .eq("day_id", body.dayId),
      ),
    );

    const failed = updates.find((item) => item.error);
    if (failed?.error) {
      return NextResponse.json({ error: failed.error.message }, { status: 400 });
    }

    await supabase
      .from("routines")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", routine.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not reorder exercises.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
