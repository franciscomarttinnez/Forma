import { canonicalizeMuscle } from "@/lib/exercises/muscles";
import type { AppLocale } from "@/lib/i18n/locale";
import {
  EXERCISE_LIBRARY,
  exerciseMediaKey,
  exerciseName,
  findExerciseTemplate,
  type ExerciseTemplate,
} from "@/lib/ai/exercise-library";
import type { OnboardingData } from "@/lib/validations/onboarding";
import {
  equipmentLabels,
  goalLabels,
  levelLabels,
} from "@/lib/validations/onboarding";
import type {
  GeneratedExercise,
  GeneratedRoutine,
  GeneratedRoutineDay,
} from "@/lib/validations/routine";
import { generatedRoutineSchema } from "@/lib/validations/routine";
import { localMediaForName, VERIFIED_MEDIA } from "@/lib/exercisedb/client";
import { muscleLabel } from "@/lib/exercises/muscles";

type Equipment = OnboardingData["equipment"][number];
type Goal = OnboardingData["goal"];
type Level = OnboardingData["level"];

const LIBRARY = EXERCISE_LIBRARY;

const goalLabelsEs: Record<Goal, string> = {
  muscle: "Ganar músculo",
  strength: "Ganar fuerza",
  fat_loss: "Perder grasa",
  endurance: "Mejorar resistencia",
  general: "Estar en forma",
};

const levelLabelsEs: Record<Level, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

const equipmentLabelsEs: Record<Equipment, string> = {
  full_gym: "Gimnasio completo",
  home_dumbbells: "Mancuernas en casa",
  bodyweight: "Peso corporal",
  bands: "Bandas elásticas",
  machines_only: "Solo máquinas",
};

function goalLabel(goal: Goal, locale: AppLocale) {
  return locale === "es" ? goalLabelsEs[goal] : goalLabels[goal];
}

function levelLabel(level: Level, locale: AppLocale) {
  return locale === "es" ? levelLabelsEs[level] : levelLabels[level];
}

function equipmentLabel(item: Equipment, locale: AppLocale) {
  return locale === "es" ? equipmentLabelsEs[item] : equipmentLabels[item];
}

function templateKey(item: ExerciseTemplate) {
  return item.nameEn;
}

function localizedMuscles(muscles: string[], locale: AppLocale) {
  return muscles.map((m) => muscleLabel(m, locale));
}

type SplitDay = { name: string; focus: string; tags: string[] };

function splitsForDays(days: number, locale: AppLocale = "en"): SplitDay[] {
  const es = locale === "es";
  if (days <= 2) {
    return [
      {
        name: es ? "Día A · Full body" : "Day A · Full body",
        focus: es ? "Fuerza completa" : "Full-body strength",
        tags: ["upper", "lower", "core"],
      },
      {
        name: es ? "Día B · Full body" : "Day B · Full body",
        focus: es ? "Variación y control" : "Variation and control",
        tags: ["upper", "lower", "core"],
      },
    ].slice(0, days);
  }
  if (days === 3) {
    return [
      {
        name: es ? "Día 1 · Empuje" : "Day 1 · Push",
        focus: es ? "Pecho, hombros y tríceps" : "Chest, shoulders, and triceps",
        tags: ["push", "chest", "shoulders", "core"],
      },
      {
        name: es ? "Día 2 · Tirón" : "Day 2 · Pull",
        focus: es ? "Espalda y bíceps" : "Back and biceps",
        tags: ["pull", "back", "arms", "core"],
      },
      {
        name: es ? "Día 3 · Piernas" : "Day 3 · Legs",
        focus: es
          ? "Cuádriceps, glúteos y posterior"
          : "Quads, glutes, and posterior chain",
        tags: ["lower", "posterior", "core"],
      },
    ];
  }
  if (days === 4) {
    return [
      {
        name: es ? "Día 1 · Tren superior A" : "Day 1 · Upper A",
        focus: es ? "Empuje y pecho" : "Push and chest",
        tags: ["upper", "push", "chest", "shoulders"],
      },
      {
        name: es ? "Día 2 · Tren inferior A" : "Day 2 · Lower A",
        focus: es ? "Cuádriceps y glúteos" : "Quads and glutes",
        tags: ["lower", "push", "core"],
      },
      {
        name: es ? "Día 3 · Tren superior B" : "Day 3 · Upper B",
        focus: es ? "Tirón y espalda" : "Pull and back",
        tags: ["upper", "pull", "back", "arms"],
      },
      {
        name: es ? "Día 4 · Tren inferior B" : "Day 4 · Lower B",
        focus: es ? "Posterior y unilateral" : "Posterior and unilateral",
        tags: ["lower", "posterior", "unilateral", "core"],
      },
    ];
  }
  if (days === 5) {
    return [
      {
        name: es ? "Día 1 · Pecho" : "Day 1 · Chest",
        focus: es ? "Empuje horizontal" : "Horizontal push",
        tags: ["chest", "push", "arms"],
      },
      {
        name: es ? "Día 2 · Espalda" : "Day 2 · Back",
        focus: es ? "Tirón vertical y horizontal" : "Vertical and horizontal pull",
        tags: ["back", "pull", "arms"],
      },
      {
        name: es ? "Día 3 · Piernas" : "Day 3 · Legs",
        focus: es ? "Cuádriceps y glúteos" : "Quads and glutes",
        tags: ["lower", "push"],
      },
      {
        name: es ? "Día 4 · Hombros y core" : "Day 4 · Shoulders and core",
        focus: es ? "Estabilidad y deltoides" : "Stability and delts",
        tags: ["shoulders", "core", "prehab"],
      },
      {
        name: es ? "Día 5 · Full body ligero" : "Day 5 · Light full body",
        focus: es ? "Compounds + conditioning" : "Compounds + conditioning",
        tags: ["upper", "lower", "conditioning", "core"],
      },
    ];
  }
  return [
    {
      name: es ? "Día 1 · Empuje" : "Day 1 · Push",
      focus: es ? "Pecho y hombros" : "Chest and shoulders",
      tags: ["push", "chest", "shoulders"],
    },
    {
      name: es ? "Día 2 · Tirón" : "Day 2 · Pull",
      focus: es ? "Espalda" : "Back",
      tags: ["pull", "back"],
    },
    {
      name: es ? "Día 3 · Piernas" : "Day 3 · Legs",
      focus: es ? "Cuádriceps" : "Quads",
      tags: ["lower", "push"],
    },
    {
      name: es ? "Día 4 · Empuje B" : "Day 4 · Push B",
      focus: es ? "Volumen de empuje" : "Push volume",
      tags: ["push", "chest", "arms"],
    },
    {
      name: es ? "Día 5 · Tirón B" : "Day 5 · Pull B",
      focus: es ? "Volumen de tirón" : "Pull volume",
      tags: ["pull", "back", "arms"],
    },
    {
      name: es ? "Día 6 · Posterior + core" : "Day 6 · Posterior + core",
      focus: es
        ? "Isquios, glúteos y estabilidad"
        : "Hamstrings, glutes, and stability",
      tags: ["posterior", "core", "prehab"],
    },
  ];
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function isBlocked(template: ExerciseTemplate, data: OnboardingData) {
  const avoid = normalize(`${data.avoidExercises} ${data.injuries}`);
  if (!avoid.trim()) return false;
  return (
    template.avoidKeywords.some((keyword) =>
      avoid.includes(normalize(keyword)),
    ) ||
    avoid.includes(normalize(template.nameEn)) ||
    avoid.includes(normalize(template.nameEs))
  );
}

function matchesEquipment(template: ExerciseTemplate, equipment: Equipment[]) {
  return template.equipment.some((item) => equipment.includes(item));
}

function prescription(goal: Goal, level: Level, sessionMinutes: number) {
  const sets =
    level === "beginner" ? 3 : level === "intermediate" ? 3 : 4;
  const restSeconds =
    goal === "strength" ? 150 : goal === "endurance" || goal === "fat_loss" ? 60 : 90;
  const reps =
    goal === "strength"
      ? level === "beginner"
        ? "5-8"
        : "4-6"
      : goal === "endurance" || goal === "fat_loss"
        ? "12-15"
        : "8-12";
  const perDay =
    sessionMinutes <= 30 ? 4 : sessionMinutes <= 45 ? 5 : sessionMinutes <= 60 ? 6 : 7;
  return { sets, restSeconds, reps, perDay };
}

function pickExercises(
  candidates: ExerciseTemplate[],
  tags: string[],
  count: number,
  used: Set<string>,
) {
  const scored = candidates
    .filter((item) => !used.has(templateKey(item)))
    .map((item) => ({
      item,
      score:
        item.tags.reduce((acc, tag) => acc + (tags.includes(tag) ? 2 : 0), 0) +
        (item.tags.includes("compound") ? 1 : 0) +
        (exerciseMediaKey(item) in VERIFIED_MEDIA ? 4 : 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const selected: ExerciseTemplate[] = [];
  for (const entry of scored) {
    if (selected.length >= count) break;
    selected.push(entry.item);
    used.add(templateKey(entry.item));
  }

  if (selected.length < count) {
    for (const item of candidates) {
      if (selected.length >= count) break;
      if (used.has(templateKey(item))) continue;
      selected.push(item);
      used.add(templateKey(item));
    }
  }

  // If the pool is exhausted (e.g. 6-day plans), allow reuse so no day is empty.
  if (selected.length < Math.max(1, Math.min(count, 3))) {
    const scoredReuse = candidates
      .map((item) => ({
        item,
        score:
          item.tags.reduce((acc, tag) => acc + (tags.includes(tag) ? 2 : 0), 0) +
          (item.tags.includes("compound") ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score);

    for (const entry of scoredReuse) {
      if (selected.length >= count) break;
      if (selected.some((item) => templateKey(item) === templateKey(entry.item)))
        continue;
      selected.push(entry.item);
      used.add(templateKey(entry.item));
    }
  }

  if (selected.length === 0 && candidates[0]) {
    selected.push(candidates[0]);
    used.add(templateKey(candidates[0]));
  }

  return selected;
}

function toExercise(
  template: ExerciseTemplate,
  sets: number,
  reps: string,
  restSeconds: number,
  notes: string,
  locale: AppLocale = "en",
): GeneratedExercise {
  return {
    name: exerciseName(template, locale),
    sets,
    reps,
    restSeconds,
    muscles: localizedMuscles(template.muscles, locale),
    notes,
    demoUrl: localMediaForName(exerciseMediaKey(template))?.gifUrl ?? null,
  };
}

export type CatalogExercise = {
  name: string;
  muscles: string[];
  demoUrl: string | null;
};

export function listCatalogExercises(
  locale: AppLocale = "en",
): CatalogExercise[] {
  return LIBRARY.map((item) => ({
    name: exerciseName(item, locale),
    muscles: localizedMuscles(item.muscles, locale),
    demoUrl: localMediaForName(exerciseMediaKey(item))?.gifUrl ?? null,
  }));
}

export function listSwapAlternatives(params: {
  currentName: string;
  muscles?: string[];
  excludeNames?: string[];
  limit?: number;
  locale?: AppLocale;
}): CatalogExercise[] {
  const locale = params.locale ?? "en";
  const current = findExerciseTemplate(params.currentName);
  const muscles = params.muscles?.length
    ? params.muscles
    : (current?.muscles ?? []);
  const primary = muscles[0] ?? null;
  const exclude = new Set([
    params.currentName,
    ...(params.excludeNames ?? []),
  ]);
  const limit = params.limit ?? 12;

  const toCatalog = (item: ExerciseTemplate): CatalogExercise => ({
    name: exerciseName(item, locale),
    muscles: localizedMuscles(item.muscles, locale),
    demoUrl: localMediaForName(exerciseMediaKey(item))?.gifUrl ?? null,
  });

  const isExcluded = (item: ExerciseTemplate) =>
    exclude.has(item.nameEn) ||
    exclude.has(item.nameEs) ||
    exclude.has(exerciseName(item, locale));

  if (!primary) {
    return LIBRARY.filter((item) => !isExcluded(item))
      .slice(0, limit)
      .map(toCatalog);
  }

  const sameGroup = LIBRARY.filter((item) => {
    if (isExcluded(item)) return false;
    const itemPrimary = canonicalizeMuscle(item.muscles[0] ?? "");
    const target = canonicalizeMuscle(primary);
    return (
      itemPrimary === target ||
      item.muscles.some((m) =>
        muscles.some((mm) => canonicalizeMuscle(m) === canonicalizeMuscle(mm)),
      )
    );
  });

  const scored = sameGroup
    .map((item) => {
      const tagOverlap = current
        ? item.tags.filter((tag) => current.tags.includes(tag)).length
        : 0;
      const muscleOverlap = item.muscles.filter((muscle) =>
        muscles.includes(muscle),
      ).length;
      return {
        item,
        score:
          tagOverlap * 3 +
          muscleOverlap * 2 +
          (exerciseMediaKey(item) in VERIFIED_MEDIA ? 1 : 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ item }) => toCatalog(item));
}

export function buildLocalRoutine(
  data: OnboardingData,
  locale: AppLocale = "en",
): GeneratedRoutine {
  const es = locale === "es";
  const { sets, restSeconds, reps, perDay } = prescription(
    data.goal,
    data.level,
    data.sessionMinutes,
  );
  const pool = LIBRARY.filter(
    (item) => matchesEquipment(item, data.equipment) && !isBlocked(item, data),
  );
  const fallback = LIBRARY.filter((item) => !isBlocked(item, data));
  const source = pool.length >= 8 ? pool : fallback.length ? fallback : LIBRARY;

  const split = splitsForDays(data.daysPerWeek, locale);
  const used = new Set<string>();
  const injuryNote = data.injuries.trim()
    ? es
      ? `Respetá molestia/lesión: ${data.injuries.trim()}.`
      : `Respect discomfort/injury: ${data.injuries.trim()}.`
    : es
      ? "Priorizá técnica limpia y rango controlado."
      : "Prioritize clean technique and controlled range.";

  const days: GeneratedRoutineDay[] = split.map((day, dayIndex) => {
    const picked = pickExercises(source, day.tags, perDay, used);
    const safePicked =
      picked.length > 0
        ? picked
        : [source[dayIndex % source.length] ?? LIBRARY[0]];

    return {
      dayIndex,
      name: day.name,
      focus: day.focus,
      exercises: safePicked.map((template, i) =>
        toExercise(
          template,
          i === 0 ? Math.min(sets + (data.level === "advanced" ? 1 : 0), 5) : sets,
          reps,
          restSeconds,
          injuryNote,
          locale,
        ),
      ),
    };
  });

  const titleByGoal: Record<Goal, string> = es
    ? {
        muscle: "Plan de hipertrofia Forma",
        strength: "Plan de fuerza Forma",
        fat_loss: "Plan de recomposición Forma",
        endurance: "Plan de resistencia Forma",
        general: "Plan integral Forma",
      }
    : {
        muscle: "Forma hypertrophy plan",
        strength: "Forma strength plan",
        fat_loss: "Forma recomposition plan",
        endurance: "Forma endurance plan",
        general: "Forma general plan",
      };

  const daysWord = es ? "días" : "days";
  const g = goalLabel(data.goal, locale);
  const l = levelLabel(data.level, locale);
  const eq = data.equipment.map((e) => equipmentLabel(e, locale)).join(", ");

  const routine = {
    title: titleByGoal[data.goal],
    summary: `${g} · ${l} · ${data.daysPerWeek} ${daysWord} · ${data.sessionMinutes} min · ${eq}`,
    aiRationale: es
      ? `Armé un split de ${data.daysPerWeek} días para ${g.toLowerCase()}, con volumen de ${l.toLowerCase()} y ejercicios compatibles con tu equipo. ${data.injuries || data.avoidExercises ? "Filtré movimientos sensibles según tus limitaciones." : "Mantuve compuestos + accesorios para progresar sin sobrecargar."}`
      : `Built a ${data.daysPerWeek}-day split for ${g.toLowerCase()}, with ${l.toLowerCase()} volume and exercises that match your equipment. ${data.injuries || data.avoidExercises ? "Filtered sensitive movements based on your limitations." : "Kept compounds + accessories to progress without overload."}`,
    days,
  };

  return generatedRoutineSchema.parse(routine);
}

export type CoachAction =
  | { type: "set_days"; count: number }
  | { type: "swap_machines_to_dumbbells" }
  | { type: "reshuffle" }
  | { type: "volume_up" }
  | { type: "volume_down" }
  | { type: "rest_shorter" }
  | { type: "rest_longer" }
  | { type: "replace_exercise"; dayIndex: number; exerciseName: string }
  | { type: "explain_exercise"; dayIndex: number; exerciseName: string }
  | { type: "advice"; topic: "progress" | "technique" | "warmup" };

export type CoachActionResult = {
  reply: string;
  modified: boolean;
  routine?: GeneratedRoutine;
};

function cloneDays(current: GeneratedRoutine) {
  return current.days.map((day) => ({
    ...day,
    exercises: day.exercises.map((exercise) => ({ ...exercise })),
  }));
}

function prefsOrFallback(
  preferences: OnboardingData | null | undefined,
  currentDays: number,
): OnboardingData {
  return (
    preferences ?? {
      goal: "general",
      level: "beginner",
      daysPerWeek: Math.min(6, Math.max(2, currentDays)),
      sessionMinutes: 45,
      equipment: ["full_gym"],
      injuries: "",
      avoidExercises: "",
      preferences: "",
    }
  );
}

const MACHINE_TO_DUMBBELL: Record<string, string> = {
  "Prensa de piernas": "Sentadilla goblet",
  "Leg press": "Goblet squat",
  "Curl femoral en máquina": "Peso muerto rumano",
  "Machine leg curl": "Romanian deadlift",
  "Press de pecho en máquina": "Press con mancuernas en banco",
  "Machine chest press": "Dumbbell bench press",
  "Sentadilla en máquina Smith": "Sentadilla goblet",
  "Smith machine squat": "Goblet squat",
  "Jalón al pecho": "Remo con mancuerna",
  "Lat pulldown": "Dumbbell row",
};

function explainExerciseText(
  exerciseNameValue: string,
  dayName: string,
  muscles: string[],
  locale: AppLocale = "en",
) {
  const template = findExerciseTemplate(exerciseNameValue);
  const es = locale === "es";
  const focus = template?.tags.includes("compound")
    ? es
      ? "Es un movimiento compuesto: priorizá técnica antes de subir carga."
      : "It's a compound movement: prioritize technique before adding load."
    : es
      ? "Es un accesorio: buscá control y conexión músculo-mente."
      : "It's an accessory: aim for control and mind-muscle connection.";
  const muscleText = muscles.length
    ? muscles.map((m) => muscleLabel(m, locale)).join(", ")
    : es
      ? "el grupo objetivo"
      : "the target group";
  return es
    ? `${exerciseNameValue} está en ${dayName} para trabajar ${muscleText}. ${focus} Si duele (no fatiga muscular), bajá peso o pedime reemplazarlo.`
    : `${exerciseNameValue} is in ${dayName} to train ${muscleText}. ${focus} If it hurts (not muscle fatigue), lower the weight or ask me to replace it.`;
}

export function applyCoachAction(params: {
  action: CoachAction;
  current: GeneratedRoutine;
  preferences?: OnboardingData | null;
  locale?: AppLocale;
}): CoachActionResult {
  const current = params.current;
  const prefs = prefsOrFallback(params.preferences, current.days.length);
  const action = params.action;
  const locale = params.locale ?? "en";
  const es = locale === "es";

  if (action.type === "advice") {
    if (action.topic === "technique") {
      return {
        reply: es
          ? "Priorizá rango controlado. Si duele (no fatiga), bajá carga o pedime reemplazar ese ejercicio. Abrí cada movimiento para ver el GIF."
          : "Prioritize controlled range. If it hurts (not fatigue), lower the load or ask me to replace that exercise. Open each movement to see the GIF.",
        modified: false,
      };
    }
    if (action.topic === "warmup") {
      const first = current.days[0]?.name ?? (es ? "tu primer día" : "your first day");
      return {
        reply: es
          ? `Empezá ${first} con 5–8 min de movilización + 1–2 series livianas del primer ejercicio.`
          : `Start ${first} with 5–8 min of mobility + 1–2 light sets of the first exercise.`,
        modified: false,
      };
    }
    return {
      reply: es
        ? "Cuando completes el tope de reps con buena forma, subí un poco la carga la semana siguiente. Si estancás, pedime variar los ejercicios."
        : "When you hit the top of the rep range with good form, add a little load the next week. If you stall, ask me to vary the exercises.",
      modified: false,
    };
  }

  if (action.type === "explain_exercise") {
    const day = current.days.find((item) => item.dayIndex === action.dayIndex);
    const exercise = day?.exercises.find(
      (item) => item.name === action.exerciseName,
    );
    if (!day || !exercise) {
      return {
        reply: es
          ? "No encontré ese ejercicio en tu plan."
          : "I couldn't find that exercise in your plan.",
        modified: false,
      };
    }
    return {
      reply: explainExerciseText(exercise.name, day.name, exercise.muscles, locale),
      modified: false,
    };
  }

  if (action.type === "set_days") {
    const nextDays = Math.min(6, Math.max(2, action.count));
    if (nextDays === current.days.length) {
      return {
        reply: es
          ? `Tu plan ya tiene ${current.days.length} días.`
          : `Your plan already has ${current.days.length} days.`,
        modified: false,
      };
    }
    const rebuilt = buildLocalRoutine(
      { ...prefs, daysPerWeek: nextDays },
      locale,
    );
    return {
      reply: es
        ? `Listo. Pasé tu plan de ${current.days.length} a ${nextDays} días.`
        : `Done. I moved your plan from ${current.days.length} to ${nextDays} days.`,
      modified: true,
      routine: generatedRoutineSchema.parse({
        ...rebuilt,
        aiRationale: es
          ? `Pasé tu plan de ${current.days.length} a ${nextDays} días de entrenamiento.`
          : `Moved your plan from ${current.days.length} to ${nextDays} training days.`,
      }),
    };
  }

  if (action.type === "reshuffle") {
    const rebuilt = buildLocalRoutine(
      {
        ...prefs,
        daysPerWeek: current.days.length,
      },
      locale,
    );
    return {
      reply: es
        ? "Listo. Armé una nueva variación de ejercicios con tus preferencias."
        : "Done. I built a new exercise variation with your preferences.",
      modified: true,
      routine: generatedRoutineSchema.parse({
        ...rebuilt,
        aiRationale: es
          ? "Armé una nueva variación de ejercicios respetando tu objetivo, nivel y equipo."
          : "Built a new exercise variation respecting your goal, level, and equipment.",
      }),
    };
  }

  if (action.type === "swap_machines_to_dumbbells") {
    const days = cloneDays(current);
    const changes: string[] = [];
    for (const day of days) {
      day.exercises = day.exercises.map((exercise) => {
        const mapped = MACHINE_TO_DUMBBELL[exercise.name];
        const isMachine = /maquina|machine|prensa|press|smith|jalon|pulldown|lat pulldown/.test(
          normalize(exercise.name),
        );
        const replacementName =
          mapped ??
          (isMachine
            ? LIBRARY.find(
                (item) =>
                  templateKey(item) !==
                    (findExerciseTemplate(exercise.name)?.nameEn ?? "") &&
                  item.equipment.includes("home_dumbbells") &&
                  !/maquina|machine|prensa|smith|jalon|pulldown/.test(
                    normalize(item.nameEn + " " + item.nameEs),
                  ),
              )
            : undefined);
        const alt =
          typeof replacementName === "string"
            ? findExerciseTemplate(replacementName)
            : replacementName;
        if (!alt) return exercise;
        const from = exercise.name;
        const to = exerciseName(alt, locale);
        changes.push(`${from} → ${to}`);
        return toExercise(
          alt,
          exercise.sets,
          exercise.reps,
          exercise.restSeconds,
          es
            ? "Variante con mancuernas / peso libre."
            : "Dumbbell / free-weight variation.",
          locale,
        );
      });
    }
    if (!changes.length) {
      return {
        reply: es
          ? "No encontré ejercicios de máquina para reemplazar en tu plan."
          : "I couldn't find machine exercises to replace in your plan.",
        modified: false,
      };
    }
    const routine = generatedRoutineSchema.parse({
      ...current,
      aiRationale: es
        ? `Reemplacé máquinas por mancuernas: ${changes.join("; ")}.`
        : `Replaced machines with dumbbells: ${changes.join("; ")}.`,
      days,
    });
    return {
      reply: es
        ? `Listo. Reemplacé ${changes.length} ejercicio(s) de máquina por variantes con mancuernas.`
        : `Done. Replaced ${changes.length} machine exercise(s) with dumbbell variations.`,
      modified: true,
      routine,
    };
  }

  if (
    action.type === "volume_up" ||
    action.type === "volume_down" ||
    action.type === "rest_shorter" ||
    action.type === "rest_longer"
  ) {
    const days = cloneDays(current);
    for (const day of days) {
      for (const exercise of day.exercises) {
        if (action.type === "volume_up") {
          exercise.sets = Math.min(exercise.sets + 1, 5);
        }
        if (action.type === "volume_down") {
          exercise.sets = Math.max(exercise.sets - 1, 2);
        }
        if (action.type === "rest_shorter") {
          exercise.restSeconds = Math.max(exercise.restSeconds - 30, 45);
        }
        if (action.type === "rest_longer") {
          exercise.restSeconds = Math.min(exercise.restSeconds + 30, 180);
        }
      }
    }
    const labels = es
      ? ({
          volume_up: "Subí las series en todo el plan.",
          volume_down: "Bajé las series en todo el plan.",
          rest_shorter: "Acorté los descansos.",
          rest_longer: "Alargué los descansos.",
        } as const)
      : ({
          volume_up: "Increased sets across the plan.",
          volume_down: "Decreased sets across the plan.",
          rest_shorter: "Shortened rest periods.",
          rest_longer: "Lengthened rest periods.",
        } as const);
    const routine = generatedRoutineSchema.parse({
      ...current,
      aiRationale: labels[action.type],
      days,
    });
    return {
      reply: es ? `Listo. ${labels[action.type]}` : `Done. ${labels[action.type]}`,
      modified: true,
      routine,
    };
  }

  if (action.type === "replace_exercise") {
    const days = cloneDays(current);
    const day = days.find((item) => item.dayIndex === action.dayIndex);
    if (!day) {
      return {
        reply: es ? "No encontré ese día." : "I couldn't find that day.",
        modified: false,
      };
    }
    const index = day.exercises.findIndex(
      (item) => item.name === action.exerciseName,
    );
    if (index < 0) {
      return {
        reply: es
          ? "No encontré ese ejercicio."
          : "I couldn't find that exercise.",
        modified: false,
      };
    }
    const currentExercise = day.exercises[index];
    const template = findExerciseTemplate(currentExercise.name);
    const used = new Set(days.flatMap((d) => d.exercises.map((e) => e.name)));
    const pool = LIBRARY.filter(
      (item) =>
        matchesEquipment(item, prefs.equipment) && !isBlocked(item, prefs),
    );
    const source = pool.length ? pool : LIBRARY;
    const alt =
      source.find(
        (item) =>
          !used.has(item.nameEn) &&
          !used.has(item.nameEs) &&
          !used.has(exerciseName(item, locale)) &&
          item.nameEn !== template?.nameEn &&
          item.tags.some((tag) => template?.tags.includes(tag)),
      ) ??
      source.find(
        (item) =>
          !used.has(item.nameEn) &&
          !used.has(item.nameEs) &&
          !used.has(exerciseName(item, locale)) &&
          item.nameEn !== template?.nameEn,
      );

    if (!alt) {
      return {
        reply: es
          ? "No tengo una alternativa clara ahora. Probá regenerar el plan."
          : "I don't have a clear alternative right now. Try regenerating the plan.",
        modified: false,
      };
    }

    const nextName = exerciseName(alt, locale);
    day.exercises[index] = toExercise(
      alt,
      currentExercise.sets,
      currentExercise.reps,
      currentExercise.restSeconds,
      es ? "Reemplazo a pedido del coach." : "Replacement requested via coach.",
      locale,
    );
    const routine = generatedRoutineSchema.parse({
      ...current,
      aiRationale: es
        ? `Reemplacé ${currentExercise.name} por ${nextName}.`
        : `Replaced ${currentExercise.name} with ${nextName}.`,
      days,
    });
    return {
      reply: es
        ? `Listo. Reemplacé ${currentExercise.name} por ${nextName}.`
        : `Done. Replaced ${currentExercise.name} with ${nextName}.`,
      modified: true,
      routine,
    };
  }

  return {
    reply: es
      ? "No pude aplicar esa acción."
      : "I couldn't apply that action.",
    modified: false,
  };
}

/** @deprecated Prefer applyCoachAction — kept for API de instrucción libre */
export function modifyLocalRoutine(params: {
  instruction: string;
  current: GeneratedRoutine;
  preferences?: OnboardingData | null;
  locale?: AppLocale;
}): GeneratedRoutine {
  const text = normalize(params.instruction);
  const prefs = prefsOrFallback(params.preferences, params.current.days.length);
  const locale = params.locale ?? "en";
  const es = locale === "es";

  const addMatch =
    text.match(/agrega(?:r)?\s+(\d+)\s*dias?/) ||
    text.match(/(\d+)\s*dias?\s*mas/) ||
    text.match(/mas\s+(\d+)\s*dias?/) ||
    text.match(/add\s+(\d+)\s*days?/) ||
    text.match(/(\d+)\s*more\s*days?/);
  if (addMatch) {
    const result = applyCoachAction({
      action: {
        type: "set_days",
        count: params.current.days.length + Number(addMatch[1]),
      },
      current: params.current,
      preferences: prefs,
      locale,
    });
    return result.routine ?? params.current;
  }

  const removeMatch =
    text.match(/quita(?:r)?\s+(\d+)\s*dias?/) ||
    text.match(/(\d+)\s*dias?\s*menos/) ||
    text.match(/remove\s+(\d+)\s*days?/) ||
    text.match(/(\d+)\s*fewer\s*days?/);
  if (removeMatch) {
    const result = applyCoachAction({
      action: {
        type: "set_days",
        count: params.current.days.length - Number(removeMatch[1]),
      },
      current: params.current,
      preferences: prefs,
      locale,
    });
    return result.routine ?? params.current;
  }

  if (
    (text.includes("maquina") && text.includes("mancuern")) ||
    (text.includes("machine") && text.includes("dumbbell"))
  ) {
    const result = applyCoachAction({
      action: { type: "swap_machines_to_dumbbells" },
      current: params.current,
      preferences: prefs,
      locale,
    });
    return result.routine ?? params.current;
  }

  if (
    (text.includes("volumen") && text.includes("mas")) ||
    (text.includes("volume") && (text.includes("more") || text.includes("up")))
  ) {
    return (
      applyCoachAction({
        action: { type: "volume_up" },
        current: params.current,
        preferences: prefs,
        locale,
      }).routine ?? params.current
    );
  }
  if (
    (text.includes("volumen") && text.includes("menos")) ||
    (text.includes("volume") &&
      (text.includes("less") || text.includes("down") || text.includes("fewer")))
  ) {
    return (
      applyCoachAction({
        action: { type: "volume_down" },
        current: params.current,
        preferences: prefs,
        locale,
      }).routine ?? params.current
    );
  }
  if (
    text.includes("regener") ||
    text.includes("variedad") ||
    text.includes("renova") ||
    text.includes("reshuffle") ||
    text.includes("vary")
  ) {
    return (
      applyCoachAction({
        action: { type: "reshuffle" },
        current: params.current,
        preferences: prefs,
        locale,
      }).routine ?? params.current
    );
  }

  return generatedRoutineSchema.parse({
    ...params.current,
    aiRationale: es
      ? `Para cambios confiables usá las opciones del coach. Pedido recibido: “${params.instruction.trim()}”.`
      : `For reliable changes, use the coach options. Request received: “${params.instruction.trim()}”.`,
  });
}
