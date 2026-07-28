import { localMediaForName } from "@/lib/exercisedb/client";
import type { GeneratedRoutine } from "@/lib/validations/routine";

/**
 * Adjunta GIF solo si hay match verificado 1:1.
 * Si no hay certeza, deja demoUrl en null (mejor vacío que incorrecto).
 */
export async function enrichRoutineWithExerciseDb(
  routine: GeneratedRoutine,
): Promise<GeneratedRoutine> {
  return {
    ...routine,
    days: routine.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => {
        const local = localMediaForName(exercise.name);
        return {
          ...exercise,
          demoUrl: local?.gifUrl ?? null,
        };
      }),
    })),
  };
}
