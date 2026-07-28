import type { AppLocale } from "@/lib/i18n/locale";
import { parseLocale } from "@/lib/i18n/locale";
import { LOCALE_COOKIE } from "@/lib/i18n/config";

export const apiErrors = {
  unauthenticated: {
    en: "Not authenticated.",
    es: "No autenticado.",
  },
  routineNotFound: {
    en: "Routine not found.",
    es: "Routine not found.",
  },
  dayNotFound: {
    en: "Day not found.",
    es: "Día no encontrado.",
  },
  exerciseNotFound: {
    en: "Exercise not found.",
    es: "Ejercicio no encontrado.",
  },
  planNotFound: {
    en: "Plan not found.",
    es: "Plan no encontrado.",
  },
  planNameRequired: {
    en: "Plan name is required.",
    es: "Falta el nombre del plan.",
  },
  routineNameRequired: {
    en: "Routine name is required.",
    es: "Falta el nombre de la rutina.",
  },
  nameEmpty: {
    en: "Name cannot be empty.",
    es: "Name cannot be empty.",
  },
  noChanges: {
    en: "No changes to save.",
    es: "No hay cambios para guardar.",
  },
  dayNeedsExercise: {
    en: "The day needs at least one exercise.",
    es: "El día necesita al menos un ejercicio.",
  },
  exerciseListMismatch: {
    en: "The exercise list doesn't match the day.",
    es: "La lista de ejercicios no coincide con el día.",
  },
  calendarPastOnly: {
    en: "You can only check in for today.",
    es: "Solo podés fichar el día de hoy.",
  },
  calendarTodayOnlyEdit: {
    en: "You can only edit today's check-in.",
    es: "Solo podés editar la ficha de hoy.",
  },
  calendarPickDay: {
    en: "Choose which routine day you completed.",
    es: "Elegí qué día de la rutina hiciste.",
  },
  calendarCheckInFailed: {
    en: "Couldn't check in that day.",
    es: "No se pudo fichar el día.",
  },
  calendarLoadFailed: {
    en: "Couldn't load the calendar.",
    es: "Could not load the calendar.",
  },
  calendarRemoveFailed: {
    en: "Couldn't remove the check-in.",
    es: "Could not remove the check-in.",
  },
  calendarPlanFailed: {
    en: "Couldn't change the plan.",
    es: "Could not change the plan.",
  },
  gifUnavailable: {
    en: "GIF unavailable.",
    es: "GIF no disponible.",
  },
  gifLoadFailed: {
    en: "Couldn't load the GIF.",
    es: "Could not load the GIF.",
  },
  libraryLoadFailed: {
    en: "Couldn't load the library.",
    es: "Could not load the library.",
  },
  searchExercisesFailed: {
    en: "Couldn't search exercises.",
    es: "Could not search exercises.",
  },
  lookupExerciseFailed: {
    en: "Couldn't look up the exercise.",
    es: "Could not look up the exercise.",
  },
  addExerciseFailed: {
    en: "Couldn't add the exercise.",
    es: "No se pudo agregar el ejercicio.",
  },
  saveExerciseFailed: {
    en: "Couldn't save the exercise.",
    es: "No se pudo guardar el ejercicio.",
  },
  deleteExerciseFailed: {
    en: "Couldn't delete the exercise.",
    es: "No se pudo eliminar el ejercicio.",
  },
  reorderFailed: {
    en: "Couldn't reorder exercises.",
    es: "Could not reorder exercises.",
  },
  saveDayFailed: {
    en: "Couldn't save a day.",
    es: "Could not save a day.",
  },
  saveRoutineFailed: {
    en: "Couldn't save the routine.",
    es: "Could not save the routine.",
  },
  listPlansFailed: {
    en: "Couldn't list plans.",
    es: "No se pudieron listar los planes.",
  },
  createPlanFailed: {
    en: "Couldn't create the plan.",
    es: "No se pudo crear el plan.",
  },
  updatePlanFailed: {
    en: "Couldn't update the plan.",
    es: "No se pudo actualizar el plan.",
  },
  deletePlanFailed: {
    en: "Couldn't delete the plan.",
    es: "No se pudo eliminar el plan.",
  },
  loadPlanFailed: {
    en: "Couldn't load the plan.",
    es: "No se pudo cargar el plan.",
  },
  waterFailed: {
    en: "Couldn't log water.",
    es: "Could not log water.",
  },
  nutritionPlanRequired: {
    en: "Create a nutrition plan first.",
    es: "Create a nutrition plan first.",
  },
  profileLoadFailed: {
    en: "Couldn't load the profile.",
    es: "Could not load the profile.",
  },
  profileSaveFailed: {
    en: "Couldn't save the profile.",
    es: "Could not save the profile.",
  },
  listRoutinesFailed: {
    en: "Couldn't list routines.",
    es: "No se pudieron listar las rutinas.",
  },
  updateRoutineFailed: {
    en: "Couldn't update the routine.",
    es: "No se pudo actualizar la rutina.",
  },
  deleteRoutineFailed: {
    en: "Couldn't delete the routine.",
    es: "No se pudo eliminar la rutina.",
  },
  missingSupabaseEnv: {
    en: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    es: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  },
  generic: {
    en: "Something went wrong.",
    es: "Algo salió mal.",
  },
} as const;

export type ApiErrorKey = keyof typeof apiErrors;

/** Default English message for API/store throws (locale-aware UI can map later). */
export function apiErrorMessage(
  locale: AppLocale,
  key: ApiErrorKey,
): string {
  return apiErrors[key][locale];
}

export function enError(key: ApiErrorKey): string {
  return apiErrors[key].en;
}

export async function localeFromCookies(): Promise<AppLocale> {
  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    return parseLocale(jar.get(LOCALE_COOKIE)?.value);
  } catch {
    return "en";
  }
}

export function localeFromBody(value: unknown): AppLocale {
  return parseLocale(value);
}
