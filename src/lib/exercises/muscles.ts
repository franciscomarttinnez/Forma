import type { AppLocale } from "@/lib/i18n/locale";

/** Primary muscle groups (English canonical). */
export const PRIMARY_MUSCLES = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Glutes",
  "Hamstrings",
  "Calves",
  "Core",
  "Lower back",
  "Upper back",
  "Forearms",
  "Traps",
] as const;

export type PrimaryMuscle = (typeof PRIMARY_MUSCLES)[number];

const MUSCLE_LABELS_ES: Record<string, string> = {
  Chest: "Pecho",
  Back: "Espalda",
  Shoulders: "Hombros",
  Biceps: "Bíceps",
  Triceps: "Tríceps",
  Quads: "Cuádriceps",
  Glutes: "Glúteos",
  Hamstrings: "Isquiotibiales",
  Calves: "Gemelos",
  Core: "Core",
  "Lower back": "Espalda baja",
  "Upper back": "Espalda alta",
  Forearms: "Antebrazos",
  Traps: "Trapecios",
  Cardio: "Cardio",
  General: "General",
  "Full body": "Cuerpo completo",
};

/** Legacy Spanish (and variants) → English canonical */
const TO_ENGLISH: Record<string, string> = {
  Pecho: "Chest",
  Espalda: "Back",
  Hombros: "Shoulders",
  Bíceps: "Biceps",
  Biceps: "Biceps",
  Tríceps: "Triceps",
  Triceps: "Triceps",
  Cuádriceps: "Quads",
  Cuadriceps: "Quads",
  Glúteos: "Glutes",
  Gluteos: "Glutes",
  Isquiotibiales: "Hamstrings",
  Gemelos: "Calves",
  Core: "Core",
  "Espalda baja": "Lower back",
  "Espalda alta": "Upper back",
  Antebrazos: "Forearms",
  Trapecios: "Traps",
  Cardio: "Cardio",
  General: "General",
  "Cuerpo completo": "Full body",
  "Full body": "Full body",
};

/** English primary → ExerciseDB `targetMuscles` values */
export const MUSCLE_TO_EDB_TARGETS: Record<string, string[]> = {
  Chest: ["pectorals"],
  Back: ["lats", "upper back"],
  "Upper back": ["upper back", "traps"],
  "Lower back": ["spine"],
  Shoulders: ["delts"],
  Biceps: ["biceps"],
  Triceps: ["triceps"],
  Quads: ["quads"],
  Glutes: ["glutes"],
  Hamstrings: ["hamstrings"],
  Calves: ["calves"],
  Core: ["abs"],
  Forearms: ["forearms"],
  Traps: ["traps"],
  Cardio: ["cardiovascular system"],
};

/** @deprecated Use MUSCLE_TO_EDB_TARGETS */
export const SPANISH_TO_EDB_TARGETS: Record<string, string[]> = {
  Pecho: MUSCLE_TO_EDB_TARGETS.Chest,
  Espalda: MUSCLE_TO_EDB_TARGETS.Back,
  "Espalda alta": MUSCLE_TO_EDB_TARGETS["Upper back"],
  "Espalda baja": MUSCLE_TO_EDB_TARGETS["Lower back"],
  Hombros: MUSCLE_TO_EDB_TARGETS.Shoulders,
  Bíceps: MUSCLE_TO_EDB_TARGETS.Biceps,
  Tríceps: MUSCLE_TO_EDB_TARGETS.Triceps,
  Cuádriceps: MUSCLE_TO_EDB_TARGETS.Quads,
  Glúteos: MUSCLE_TO_EDB_TARGETS.Glutes,
  Isquiotibiales: MUSCLE_TO_EDB_TARGETS.Hamstrings,
  Gemelos: MUSCLE_TO_EDB_TARGETS.Calves,
  Core: MUSCLE_TO_EDB_TARGETS.Core,
  Antebrazos: MUSCLE_TO_EDB_TARGETS.Forearms,
  Trapecios: MUSCLE_TO_EDB_TARGETS.Traps,
  Cardio: MUSCLE_TO_EDB_TARGETS.Cardio,
};

/** ExerciseDB target → English label */
export const EDB_TARGET_TO_MUSCLE: Record<string, string> = {
  pectorals: "Chest",
  lats: "Back",
  "upper back": "Back",
  spine: "Lower back",
  delts: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  quads: "Quads",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  calves: "Calves",
  abs: "Core",
  forearms: "Forearms",
  traps: "Traps",
  "cardiovascular system": "Cardio",
  "hip flexors": "Core",
  adductors: "Quads",
  abductors: "Glutes",
  serratus: "Chest",
};

/** @deprecated Use EDB_TARGET_TO_MUSCLE */
export const EDB_TARGET_TO_SPANISH: Record<string, string> = {
  pectorals: "Pecho",
  lats: "Espalda",
  "upper back": "Espalda",
  spine: "Espalda baja",
  delts: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  quads: "Cuádriceps",
  glutes: "Glúteos",
  hamstrings: "Isquiotibiales",
  calves: "Gemelos",
  abs: "Core",
  forearms: "Antebrazos",
  traps: "Trapecios",
  "cardiovascular system": "Cardio",
  "hip flexors": "Core",
  adductors: "Cuádriceps",
  abductors: "Glúteos",
  serratus: "Pecho",
};

export function canonicalizeMuscle(muscle: string): string {
  if (TO_ENGLISH[muscle]) return TO_ENGLISH[muscle];
  if (MUSCLE_LABELS_ES[muscle] || MUSCLE_TO_EDB_TARGETS[muscle]) return muscle;
  return muscle;
}

export function muscleLabel(muscle: string, locale: AppLocale = "en"): string {
  const en = canonicalizeMuscle(muscle);
  if (locale === "es") return MUSCLE_LABELS_ES[en] ?? muscle;
  return en;
}

export function formatMuscles(
  muscles: string[],
  locale: AppLocale = "en",
  separator = " · ",
): string {
  return muscles.map((m) => muscleLabel(m, locale)).join(separator);
}

export function primaryMuscleOf(muscles: string[]): string | null {
  if (!muscles.length) return null;
  return canonicalizeMuscle(muscles[0] ?? "");
}

export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function musclesFromEdbTargets(targets: string[]): string[] {
  const mapped = targets
    .map((target) => EDB_TARGET_TO_MUSCLE[target.toLowerCase()] ?? null)
    .filter((item): item is string => Boolean(item));
  return mapped.length ? [...new Set(mapped)] : ["General"];
}

export function edbTargetsForMuscle(muscle: string): string[] {
  const en = canonicalizeMuscle(muscle);
  return MUSCLE_TO_EDB_TARGETS[en] ?? SPANISH_TO_EDB_TARGETS[muscle] ?? [];
}

/** @deprecated Use edbTargetsForMuscle */
export function edbTargetsForSpanishMuscle(muscle: string): string[] {
  return edbTargetsForMuscle(muscle);
}

/** Focus tags that must match for a “same group” recommendation. */
export function focusTagsForMuscles(muscles: string[]): string[] {
  const primary = primaryMuscleOf(muscles);
  switch (primary) {
    case "Chest":
      return ["chest"];
    case "Back":
    case "Upper back":
      return ["back"];
    case "Shoulders":
      return ["shoulders"];
    case "Biceps":
    case "Triceps":
      return ["arms"];
    case "Quads":
    case "Glutes":
    case "Hamstrings":
    case "Calves":
      return ["lower"];
    case "Core":
    case "Lower back":
      return ["core"];
    default:
      return [];
  }
}
