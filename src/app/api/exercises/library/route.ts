import { NextResponse } from "next/server";
import { z } from "zod";
import { PRIMARY_MUSCLES } from "@/lib/exercises/muscles";
import {
  browseLibrary,
  getLibraryExerciseById,
} from "@/lib/exercises/search";
import { createClient } from "@/lib/supabase/server";

const MUSCLE_FILTERS = [...PRIMARY_MUSCLES, "Cardio"] as const;

const querySchema = z.object({
  q: z.string().max(80).optional().default(""),
  muscle: z.string().max(40).optional(),
  cursor: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(48).optional().default(24),
  id: z.string().max(120).optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      q: searchParams.get("q") ?? "",
      muscle: searchParams.get("muscle") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      id: searchParams.get("id") ?? undefined,
    });

    if (parsed.id) {
      const exercise = await getLibraryExerciseById(parsed.id);
      if (!exercise) {
        return NextResponse.json(
          { error: "Exercise not found." },
          { status: 404 },
        );
      }
      return NextResponse.json({
        exercise,
        attribution: "Exercise media by AscendAPI / ExerciseDB V1 (free)",
      });
    }

    const resolvedMuscle =
      parsed.muscle &&
      (MUSCLE_FILTERS as readonly string[]).includes(parsed.muscle)
        ? parsed.muscle
        : null;

    const result = await browseLibrary({
      query: parsed.q,
      muscle: resolvedMuscle,
      cursor: parsed.cursor ?? null,
      limit: parsed.limit,
    });

    return NextResponse.json({
      ...result,
      attribution: "Exercise media by AscendAPI / ExerciseDB V1 (free)",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not load the library.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
