import type { OnboardingData } from "@/lib/validations/onboarding";

type Equipment = OnboardingData["equipment"][number];

export type ExerciseTemplate = {
  nameEn: string;
  nameEs: string;
  muscles: string[];
  tags: string[];
  equipment: Equipment[];
  avoidKeywords: string[];
};

export const EXERCISE_LIBRARY: ExerciseTemplate[] = [
  {
    nameEn: "Barbell squat",
    nameEs: "Sentadilla con barra",
    muscles: ["Quads", "Glutes"],
    tags: ["lower", "push", "compound"],
    equipment: ["full_gym"],
    avoidKeywords: ["sentadilla", "squat", "rodilla", "knee", "lumbar"],
  },
  {
    nameEn: "Leg press",
    nameEs: "Prensa de piernas",
    muscles: ["Quads", "Glutes"],
    tags: ["lower", "push", "compound"],
    equipment: ["full_gym", "machines_only"],
    avoidKeywords: ["prensa", "leg press", "rodilla", "knee"],
  },
  {
    nameEn: "Goblet squat",
    nameEs: "Sentadilla goblet",
    muscles: ["Quads", "Glutes", "Core"],
    tags: ["lower", "push", "compound"],
    equipment: ["home_dumbbells", "full_gym"],
    avoidKeywords: ["sentadilla", "goblet", "squat", "rodilla", "knee"],
  },
  {
    nameEn: "Dumbbell lunges",
    nameEs: "Zancadas con mancuernas",
    muscles: ["Quads", "Glutes"],
    tags: ["lower", "unilateral"],
    equipment: ["home_dumbbells", "full_gym"],
    avoidKeywords: ["zancada", "lunges", "rodilla", "knee"],
  },
  {
    nameEn: "Glute bridge",
    nameEs: "Puente de glúteos",
    muscles: ["Glutes", "Hamstrings"],
    tags: ["lower", "posterior"],
    equipment: ["bodyweight", "home_dumbbells", "bands", "full_gym"],
    avoidKeywords: ["puente", "glute", "bridge", "lumbar"],
  },
  {
    nameEn: "Romanian deadlift",
    nameEs: "Peso muerto rumano",
    muscles: ["Hamstrings", "Glutes", "Lower back"],
    tags: ["lower", "pull", "posterior"],
    equipment: ["full_gym", "home_dumbbells"],
    avoidKeywords: ["peso muerto", "deadlift", "lumbar", "espalda baja", "lower back"],
  },
  {
    nameEn: "Machine leg curl",
    nameEs: "Curl femoral en máquina",
    muscles: ["Hamstrings"],
    tags: ["lower", "isolation"],
    equipment: ["full_gym", "machines_only"],
    avoidKeywords: ["femoral", "isquio", "leg curl", "hamstring"],
  },
  {
    nameEn: "Calf raise",
    nameEs: "Elevación de gemelos",
    muscles: ["Calves"],
    tags: ["lower", "isolation"],
    equipment: ["full_gym", "machines_only", "home_dumbbells", "bodyweight"],
    avoidKeywords: ["gemelo", "calf", "pantorrilla"],
  },
  {
    nameEn: "Bench press",
    nameEs: "Press de banca",
    muscles: ["Chest", "Triceps", "Shoulders"],
    tags: ["upper", "push", "chest", "compound"],
    equipment: ["full_gym"],
    avoidKeywords: ["press banca", "bench", "hombro", "shoulder", "manguito"],
  },
  {
    nameEn: "Dumbbell bench press",
    nameEs: "Press con mancuernas en banco",
    muscles: ["Chest", "Triceps", "Shoulders"],
    tags: ["upper", "push", "chest", "compound"],
    equipment: ["home_dumbbells", "full_gym"],
    avoidKeywords: ["press", "bench", "hombro", "shoulder", "manguito"],
  },
  {
    nameEn: "Push-ups",
    nameEs: "Flexiones",
    muscles: ["Chest", "Triceps", "Core"],
    tags: ["upper", "push", "chest", "compound"],
    equipment: ["bodyweight", "bands", "home_dumbbells", "full_gym"],
    avoidKeywords: ["flexion", "push up", "push-up", "muñeca", "wrist", "hombro", "shoulder"],
  },
  {
    nameEn: "Band chest fly",
    nameEs: "Aperturas con bandas",
    muscles: ["Chest"],
    tags: ["upper", "push", "chest", "isolation"],
    equipment: ["bands"],
    avoidKeywords: ["apertura", "fly", "hombro", "shoulder"],
  },
  {
    nameEn: "Machine chest press",
    nameEs: "Press de pecho en máquina",
    muscles: ["Chest", "Triceps"],
    tags: ["upper", "push", "chest", "compound"],
    equipment: ["machines_only", "full_gym"],
    avoidKeywords: ["press pecho", "chest press", "hombro", "shoulder"],
  },
  {
    nameEn: "Parallel bar dips",
    nameEs: "Fondos en paralelas",
    muscles: ["Chest", "Triceps"],
    tags: ["upper", "push", "chest", "compound"],
    equipment: ["full_gym", "bodyweight"],
    avoidKeywords: ["fondo", "dip", "hombro", "shoulder"],
  },
  {
    nameEn: "Cable crossover",
    nameEs: "Cruces en polea",
    muscles: ["Chest"],
    tags: ["upper", "push", "chest", "isolation"],
    equipment: ["full_gym"],
    avoidKeywords: ["cruce", "crossover", "polea", "cable", "hombro", "shoulder"],
  },
  {
    nameEn: "Incline dumbbell press",
    nameEs: "Press inclinado con mancuernas",
    muscles: ["Chest", "Shoulders", "Triceps"],
    tags: ["upper", "push", "chest", "compound"],
    equipment: ["full_gym", "home_dumbbells"],
    avoidKeywords: ["press inclinado", "incline", "hombro", "shoulder"],
  },
  {
    nameEn: "Dumbbell pullover",
    nameEs: "Pull-over con mancuerna",
    muscles: ["Chest", "Back"],
    tags: ["upper", "pull", "chest"],
    equipment: ["full_gym", "home_dumbbells"],
    avoidKeywords: ["pullover", "hombro", "shoulder"],
  },
  {
    nameEn: "Machine row",
    nameEs: "Remo en máquina",
    muscles: ["Back", "Biceps"],
    tags: ["upper", "pull", "back", "compound"],
    equipment: ["full_gym", "machines_only"],
    avoidKeywords: ["remo", "row"],
  },
  {
    nameEn: "Hip thrust",
    nameEs: "Hip thrust",
    muscles: ["Glutes", "Hamstrings"],
    tags: ["lower", "posterior", "compound"],
    equipment: ["full_gym", "home_dumbbells"],
    avoidKeywords: ["hip thrust", "gluteo", "glute", "lumbar"],
  },
  {
    nameEn: "Hack squat",
    nameEs: "Hack squat",
    muscles: ["Quads", "Glutes"],
    tags: ["lower", "push", "compound"],
    equipment: ["full_gym", "machines_only"],
    avoidKeywords: ["hack", "sentadilla", "squat", "rodilla", "knee"],
  },
  {
    nameEn: "Hammer curl",
    nameEs: "Curl martillo",
    muscles: ["Biceps", "Forearms"],
    tags: ["upper", "isolation", "arms"],
    equipment: ["full_gym", "home_dumbbells"],
    avoidKeywords: ["curl", "codo", "elbow"],
  },
  {
    nameEn: "Skull crusher",
    nameEs: "Press francés",
    muscles: ["Triceps"],
    tags: ["upper", "isolation", "arms"],
    equipment: ["full_gym", "home_dumbbells"],
    avoidKeywords: ["triceps", "codo", "elbow", "frances", "skull"],
  },
  {
    nameEn: "Rear delt fly",
    nameEs: "Pájaros (rear delt)",
    muscles: ["Shoulders", "Upper back"],
    tags: ["upper", "pull", "shoulders", "isolation"],
    equipment: ["full_gym", "home_dumbbells"],
    avoidKeywords: ["pajaro", "rear delt", "hombro", "shoulder"],
  },
  {
    nameEn: "Barbell row",
    nameEs: "Remo con barra",
    muscles: ["Back", "Biceps"],
    tags: ["upper", "pull", "back", "compound"],
    equipment: ["full_gym"],
    avoidKeywords: ["remo", "row", "lumbar"],
  },
  {
    nameEn: "Dumbbell row",
    nameEs: "Remo con mancuerna",
    muscles: ["Back", "Biceps"],
    tags: ["upper", "pull", "back", "compound"],
    equipment: ["home_dumbbells", "full_gym"],
    avoidKeywords: ["remo", "row", "lumbar"],
  },
  {
    nameEn: "Lat pulldown",
    nameEs: "Jalón al pecho",
    muscles: ["Back", "Biceps"],
    tags: ["upper", "pull", "back", "compound"],
    equipment: ["full_gym", "machines_only"],
    avoidKeywords: ["jalon", "pull down", "pulldown", "hombro", "shoulder"],
  },
  {
    nameEn: "Band row",
    nameEs: "Remo con banda",
    muscles: ["Back", "Biceps"],
    tags: ["upper", "pull", "back", "compound"],
    equipment: ["bands", "bodyweight"],
    avoidKeywords: ["remo", "row"],
  },
  {
    nameEn: "Assisted / negative pull-ups",
    nameEs: "Dominadas asistidas / negativas",
    muscles: ["Back", "Biceps"],
    tags: ["upper", "pull", "back", "compound"],
    equipment: ["full_gym", "bodyweight"],
    avoidKeywords: ["dominada", "pull up", "pull-up", "hombro", "shoulder", "codo", "elbow"],
  },
  {
    nameEn: "Dumbbell shoulder press",
    nameEs: "Press militar con mancuernas",
    muscles: ["Shoulders", "Triceps"],
    tags: ["upper", "push", "shoulders"],
    equipment: ["home_dumbbells", "full_gym"],
    avoidKeywords: ["press militar", "overhead", "hombro", "shoulder", "manguito"],
  },
  {
    nameEn: "Lateral raises",
    nameEs: "Elevaciones laterales",
    muscles: ["Shoulders"],
    tags: ["upper", "isolation", "shoulders"],
    equipment: ["home_dumbbells", "full_gym", "bands"],
    avoidKeywords: ["elevacion lateral", "lateral raise", "hombro", "shoulder"],
  },
  {
    nameEn: "Band face pull",
    nameEs: "Face pull con banda",
    muscles: ["Shoulders", "Upper back"],
    tags: ["upper", "pull", "shoulders", "prehab"],
    equipment: ["bands", "full_gym"],
    avoidKeywords: ["face pull"],
  },
  {
    nameEn: "Biceps curl",
    nameEs: "Curl de bíceps",
    muscles: ["Biceps"],
    tags: ["upper", "isolation", "arms"],
    equipment: ["home_dumbbells", "full_gym", "bands"],
    avoidKeywords: ["curl", "biceps", "codo", "elbow"],
  },
  {
    nameEn: "Triceps extensions",
    nameEs: "Extensiones de tríceps",
    muscles: ["Triceps"],
    tags: ["upper", "isolation", "arms"],
    equipment: ["home_dumbbells", "full_gym", "bands", "machines_only"],
    avoidKeywords: ["triceps", "codo", "elbow"],
  },
  {
    nameEn: "Plank",
    nameEs: "Plancha",
    muscles: ["Core"],
    tags: ["core", "stability"],
    equipment: ["bodyweight", "home_dumbbells", "bands", "full_gym", "machines_only"],
    avoidKeywords: ["plancha", "plank", "lumbar"],
  },
  {
    nameEn: "Dead bug",
    nameEs: "Dead bug",
    muscles: ["Core"],
    tags: ["core", "stability", "prehab"],
    equipment: ["bodyweight", "home_dumbbells", "bands", "full_gym", "machines_only"],
    avoidKeywords: ["dead bug", "lumbar"],
  },
  {
    nameEn: "Bird dog",
    nameEs: "Bird dog",
    muscles: ["Core", "Lower back"],
    tags: ["core", "stability", "prehab"],
    equipment: ["bodyweight", "bands", "full_gym", "home_dumbbells", "machines_only"],
    avoidKeywords: ["bird dog", "lumbar"],
  },
  {
    nameEn: "Mountain climbers",
    nameEs: "Mountain climbers",
    muscles: ["Core", "Cardio"],
    tags: ["conditioning", "core"],
    equipment: ["bodyweight", "bands", "home_dumbbells", "full_gym"],
    avoidKeywords: ["mountain", "muñeca", "wrist", "hombro", "shoulder"],
  },
  {
    nameEn: "Jumping jacks",
    nameEs: "Jumping jacks",
    muscles: ["Cardio", "Full body"],
    tags: ["conditioning"],
    equipment: ["bodyweight", "bands", "home_dumbbells", "full_gym"],
    avoidKeywords: ["jumping", "rodilla", "knee", "tobillo", "ankle"],
  },
  {
    nameEn: "Farmer walk",
    nameEs: "Farmer walk",
    muscles: ["Core", "Forearms", "Traps"],
    tags: ["conditioning", "carry"],
    equipment: ["home_dumbbells", "full_gym"],
    avoidKeywords: ["farmer", "lumbar"],
  },
  {
    nameEn: "Smith machine squat",
    nameEs: "Sentadilla en máquina Smith",
    muscles: ["Quads", "Glutes"],
    tags: ["lower", "push", "compound"],
    equipment: ["machines_only", "full_gym"],
    avoidKeywords: ["sentadilla", "smith", "squat", "rodilla", "knee"],
  },
  {
    nameEn: "Step-up",
    nameEs: "Step-up",
    muscles: ["Quads", "Glutes"],
    tags: ["lower", "unilateral"],
    equipment: ["bodyweight", "home_dumbbells", "full_gym"],
    avoidKeywords: ["step", "rodilla", "knee"],
  },
];

export function exerciseName(
  item: Pick<ExerciseTemplate, "nameEn" | "nameEs">,
  locale: "en" | "es" = "en",
) {
  return locale === "es" ? item.nameEs : item.nameEn;
}

export function findExerciseTemplate(name: string) {
  const n = name.trim();
  return (
    EXERCISE_LIBRARY.find(
      (item) => item.nameEn === n || item.nameEs === n,
    ) ?? null
  );
}

/** Stable key for media / identity (Spanish catalog key used by ExerciseDB map). */
export function exerciseMediaKey(item: Pick<ExerciseTemplate, "nameEs">) {
  return item.nameEs;
}
