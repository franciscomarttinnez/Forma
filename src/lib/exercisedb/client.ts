export type ExerciseDbExercise = {
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
};

const BASE = "https://oss.exercisedb.dev/api/v1";
const memoryCache = new Map<string, ExerciseDbExercise | null>();

/**
 * Solo pares verificados 1:1 (nombre en español → exerciseId real de ExerciseDB).
 * Si un ejercicio no está acá, NO se inventa un GIF.
 */
export const VERIFIED_MEDIA: Record<
  string,
  { id: string; englishName: string }
> = {
  "Sentadilla con barra": {
    id: "qXTaZnJ",
    englishName: "barbell full squat",
  },
  "Sentadilla goblet": {
    id: "yn8yg1r",
    englishName: "dumbbell goblet squat",
  },
  "Puente de glúteos": {
    id: "qKBpF7I",
    englishName: "barbell glute bridge",
  },
  "Peso muerto rumano": {
    id: "rR0LJzx",
    englishName: "dumbbell romanian deadlift",
  },
  "Curl femoral en máquina": {
    id: "17lJ1kr",
    englishName: "lever lying leg curl",
  },
  "Elevación de gemelos": {
    id: "8ozhUIZ",
    englishName: "barbell standing calf raise",
  },
  "Press de banca": {
    id: "EIeI8Vf",
    englishName: "barbell bench press",
  },
  "Press con mancuernas en banco": {
    id: "SpYC0Kp",
    englishName: "dumbbell bench press",
  },
  "Remo con mancuerna": {
    id: "BJ0Hz5L",
    englishName: "dumbbell bent over row",
  },
  "Sentadilla en máquina Smith": {
    id: "jFtipLl",
    englishName: "smith squat",
  },
  "Step-up": {
    id: "aXtJhlg",
    englishName: "dumbbell step-up",
  },
  "Mountain climbers": {
    id: "RJgzwny",
    englishName: "mountain climber",
  },
  "Farmer walk": {
    id: "qPEzJjA",
    englishName: "farmers walk",
  },
  Plancha: {
    id: "VBAWRPG",
    englishName: "weighted front plank",
  },
};

export function gifProxyUrl(id: string) {
  // Path-based (not ?id=) so Netlify CDN doesn't serve one GIF for every exercise
  return `/api/exercises/gif/${encodeURIComponent(id)}`;
}

export function localMediaForName(name: string): ExerciseDbExercise | null {
  let entry = VERIFIED_MEDIA[name];
  if (!entry) {
    // Resolve English (or alternate) labels via bilingual catalog keys
    const match = Object.entries(VERIFIED_MEDIA).find(
      ([, meta]) =>
        meta.englishName.toLowerCase() === name.toLowerCase() ||
        titleish(meta.englishName) === titleish(name),
    );
    if (match) entry = match[1];
  }
  // Also accept English catalog names that map to Spanish VERIFIED_MEDIA keys
  if (!entry) {
    try {
      // Lazy require avoided — English keys added below as aliases
      const aliases = ENGLISH_MEDIA_ALIASES[name];
      if (aliases) entry = VERIFIED_MEDIA[aliases];
    } catch {
      /* noop */
    }
  }
  if (!entry) return null;
  return {
    exerciseId: entry.id,
    name: entry.englishName,
    gifUrl: gifProxyUrl(entry.id),
    bodyParts: [],
    equipments: [],
    targetMuscles: [],
    secondaryMuscles: [],
    instructions: [],
  };
}

function titleish(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ENGLISH_MEDIA_ALIASES: Record<string, string> = {
  "Barbell squat": "Sentadilla con barra",
  "Goblet squat": "Sentadilla goblet",
  "Glute bridge": "Puente de glúteos",
  "Romanian deadlift": "Peso muerto rumano",
  "Machine leg curl": "Curl femoral en máquina",
  "Calf raise": "Elevación de gemelos",
  "Bench press": "Press de banca",
  "Dumbbell bench press": "Press con mancuernas en banco",
  "Dumbbell row": "Remo con mancuerna",
  "Smith machine squat": "Sentadilla en máquina Smith",
  "Step-up": "Step-up",
  "Mountain climbers": "Mountain climbers",
  "Farmer walk": "Farmer walk",
  Plank: "Plancha",
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getExerciseById(id: string) {
  try {
    const response = await fetch(`${BASE}/exercises/${id}`, {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const data = (payload.data ?? payload) as ExerciseDbExercise;
    if (!data?.name && !data?.exerciseId) return null;
    return {
      ...data,
      exerciseId: data.exerciseId || id,
      gifUrl: gifProxyUrl(data.exerciseId || id),
    };
  } catch {
    return null;
  }
}

/**
 * Resuelve media SOLO con match verificado o exacto.
 * Nunca devuelve un GIF “parecido”.
 */
export async function resolveExerciseMedia(params: {
  name: string;
  query?: string;
}): Promise<ExerciseDbExercise | null> {
  const local = localMediaForName(params.name);
  if (local) {
    if (memoryCache.has(local.exerciseId)) {
      return memoryCache.get(local.exerciseId) ?? local;
    }
    const detailed = await getExerciseById(local.exerciseId);
    const merged = detailed
      ? { ...local, ...detailed, gifUrl: local.gifUrl }
      : local;
    memoryCache.set(local.exerciseId, merged);
    return merged;
  }

  const search = params.query?.trim();
  if (!search) return null;

  const key = normalize(search);
  if (memoryCache.has(key)) return memoryCache.get(key) ?? null;

  try {
    const response = await fetch(
      `${BASE}/exercises?name=${encodeURIComponent(search)}&limit=40`,
      { next: { revalidate: 60 * 60 * 24 } },
    );
    if (!response.ok) {
      memoryCache.set(key, null);
      return null;
    }

    const payload = (await response.json()) as { data?: ExerciseDbExercise[] };
    const exact = (payload.data ?? []).find(
      (item) => normalize(item.name) === key,
    );

    if (!exact) {
      memoryCache.set(key, null);
      return null;
    }

    const resolved = {
      ...exact,
      gifUrl: gifProxyUrl(exact.exerciseId),
    };
    memoryCache.set(key, resolved);
    return resolved;
  } catch {
    memoryCache.set(key, null);
    return null;
  }
}

export const EXERCISE_DB_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(VERIFIED_MEDIA).map(([es, meta]) => [es, meta.englishName]),
);
