import { NextResponse } from "next/server";
import { z } from "zod";
import {
  localMediaForName,
  resolveExerciseMedia,
} from "@/lib/exercisedb/client";

const querySchema = z.object({
  name: z.string().min(1).max(120),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { name } = querySchema.parse({
      name: searchParams.get("name") ?? "",
    });

    // Strict: verified map first, otherwise only exact English name matches.
    const local = localMediaForName(name);
    const match = local
      ? await resolveExerciseMedia({ name })
      : await resolveExerciseMedia({ name, query: name });

    if (!match?.gifUrl) {
      return NextResponse.json({ exercise: null });
    }

    return NextResponse.json({
      exercise: {
        id: match.exerciseId,
        name: match.name,
        gifUrl: match.gifUrl,
        muscles: match.targetMuscles,
        secondaryMuscles: match.secondaryMuscles,
        bodyParts: match.bodyParts,
        equipment: match.equipments,
        instructions: match.instructions,
        attribution: "Exercise media by AscendAPI / ExerciseDB V1 (free)",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not look up the exercise.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
