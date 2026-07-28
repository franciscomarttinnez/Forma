import { gifProxyUrl, type ExerciseDbExercise } from "@/lib/exercisedb/client";
import {
  edbTargetsForMuscle,
  musclesFromEdbTargets,
  normalizeText,
  primaryMuscleOf,
} from "@/lib/exercises/muscles";
import { listCatalogExercises, type CatalogExercise } from "@/lib/ai/local-coach";
import type { AppLocale } from "@/lib/i18n/locale";

const BASE = "https://oss.exercisedb.dev/api/v1";

export type SwapCandidate = {
  id: string;
  name: string;
  muscles: string[];
  demoUrl: string | null;
  source: "local" | "exercisedb";
};

export type LibraryExercise = {
  id: string;
  name: string;
  muscles: string[];
  demoUrl: string | null;
  equipment: string[];
  instructions: string[];
  source: "local" | "exercisedb";
};

function toLocalCandidate(item: CatalogExercise): SwapCandidate {
  return {
    id: `local:${item.name}`,
    name: item.name,
    muscles: item.muscles,
    demoUrl: item.demoUrl,
    source: "local",
  };
}

function toApiCandidate(item: ExerciseDbExercise): SwapCandidate {
  const muscles = musclesFromEdbTargets(item.targetMuscles ?? []);
  return {
    id: item.exerciseId,
    name: titleCase(item.name),
    muscles,
    demoUrl: gifProxyUrl(item.exerciseId),
    source: "exercisedb",
  };
}

function toLibraryFromEdb(item: ExerciseDbExercise): LibraryExercise {
  return {
    id: item.exerciseId,
    name: titleCase(item.name),
    muscles: musclesFromEdbTargets(item.targetMuscles ?? []),
    demoUrl: gifProxyUrl(item.exerciseId),
    equipment: item.equipments ?? [],
    instructions: item.instructions ?? [],
    source: "exercisedb",
  };
}

function toLibraryFromLocal(item: CatalogExercise): LibraryExercise {
  return {
    id: `local:${item.name}`,
    name: item.name,
    muscles: item.muscles,
    demoUrl: item.demoUrl,
    equipment: [],
    instructions: [],
    source: "local",
  };
}

function titleCase(name: string) {
  return name
    .split(" ")
    .map((word) =>
      word.length <= 2
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    next: { revalidate: 60 * 60 * 12 },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function fetchEdbByTarget(target: string, limit = 16) {
  const payload = await fetchJson(
    `${BASE}/exercises?targetMuscles=${encodeURIComponent(target)}&limit=${limit}`,
  );
  return (payload?.data ?? []) as ExerciseDbExercise[];
}

export async function fetchEdbByName(query: string, limit = 20) {
  const payload = await fetchJson(
    `${BASE}/exercises?name=${encodeURIComponent(query)}&limit=${limit}`,
  );
  return (payload?.data ?? []) as ExerciseDbExercise[];
}

export async function fetchEdbPage(params: {
  limit?: number;
  cursor?: string | null;
  targetMuscle?: string | null;
}) {
  const limit = params.limit ?? 24;
  const search = new URLSearchParams({ limit: String(limit) });
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.targetMuscle) {
    search.set("targetMuscles", params.targetMuscle);
  }

  const payload = await fetchJson(`${BASE}/exercises?${search.toString()}`);
  return {
    data: (payload?.data ?? []) as ExerciseDbExercise[],
    nextCursor: (payload?.meta?.nextCursor as string | undefined) ?? null,
    hasNextPage: Boolean(payload?.meta?.hasNextPage),
  };
}

export function localRecommendations(params: {
  currentName: string;
  muscles: string[];
  excludeNames?: string[];
  limit?: number;
}): SwapCandidate[] {
  const primary = primaryMuscleOf(params.muscles);
  const exclude = new Set([
    params.currentName,
    ...(params.excludeNames ?? []),
  ]);
  const limit = params.limit ?? 10;

  return listCatalogExercises("en")
    .filter((item) => !exclude.has(item.name))
    .filter((item) => {
      if (!primary) return true;
      return primaryMuscleOf(item.muscles) === primary;
    })
    .slice(0, limit)
    .map(toLocalCandidate);
}

export function localSearch(params: {
  query: string;
  excludeNames?: string[];
  preferMuscle?: string | null;
  limit?: number;
  locale?: AppLocale;
}): SwapCandidate[] {
  const q = normalizeText(params.query);
  if (!q) return [];
  const exclude = new Set(params.excludeNames ?? []);
  const prefer = params.preferMuscle;
  const locale = params.locale ?? "en";

  return listCatalogExercises(locale)
    .filter((item) => !exclude.has(item.name))
    .map((item) => {
      const hay = normalizeText(`${item.name} ${item.muscles.join(" ")}`);
      const match = hay.includes(q);
      const primaryBoost =
        prefer && primaryMuscleOf(item.muscles) === prefer ? 10 : 0;
      return { item, match, score: (match ? 20 : 0) + primaryBoost };
    })
    .filter((entry) => entry.match)
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit ?? 20)
    .map((entry) => toLocalCandidate(entry.item));
}

export async function apiRecommendations(params: {
  muscles: string[];
  excludeNames?: string[];
  limit?: number;
}): Promise<SwapCandidate[]> {
  const primary = primaryMuscleOf(params.muscles);
  if (!primary) return [];
  const targets = edbTargetsForMuscle(primary);
  if (!targets.length) return [];

  const exclude = new Set(
    (params.excludeNames ?? []).map((name) => normalizeText(name)),
  );
  const limit = params.limit ?? 12;
  const batches = await Promise.all(
    targets.slice(0, 2).map((target) => fetchEdbByTarget(target, limit)),
  );

  const seen = new Set<string>();
  const results: SwapCandidate[] = [];

  for (const batch of batches) {
    for (const item of batch) {
      if (seen.has(item.exerciseId)) continue;
      const candidate = toApiCandidate(item);
      if (exclude.has(normalizeText(candidate.name))) continue;
      if (primaryMuscleOf(candidate.muscles) !== primary) continue;
      seen.add(item.exerciseId);
      results.push(candidate);
      if (results.length >= limit) return results;
    }
  }

  return results;
}

export async function apiSearch(params: {
  query: string;
  preferMuscle?: string | null;
  excludeNames?: string[];
  limit?: number;
}): Promise<SwapCandidate[]> {
  const q = params.query.trim();
  if (q.length < 2) return [];

  const exclude = new Set(
    (params.excludeNames ?? []).map((name) => normalizeText(name)),
  );
  const items = await fetchEdbByName(q, params.limit ?? 24);
  const prefer = params.preferMuscle;

  return items
    .map(toApiCandidate)
    .filter((item) => !exclude.has(normalizeText(item.name)))
    .sort((a, b) => {
      const aBoost = prefer && primaryMuscleOf(a.muscles) === prefer ? 1 : 0;
      const bBoost = prefer && primaryMuscleOf(b.muscles) === prefer ? 1 : 0;
      return bBoost - aBoost;
    })
    .slice(0, params.limit ?? 20);
}

function dedupeLibrary(items: LibraryExercise[]) {
  const seen = new Set<string>();
  const result: LibraryExercise[] = [];
  for (const item of items) {
    const key = normalizeText(item.name);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export async function browseLibrary(params: {
  query?: string;
  muscle?: string | null;
  cursor?: string | null;
  limit?: number;
}): Promise<{
  results: LibraryExercise[];
  nextCursor: string | null;
  hasNextPage: boolean;
}> {
  const limit = params.limit ?? 24;
  const query = params.query?.trim() ?? "";
  const muscle = params.muscle?.trim() || null;

  if (query.length >= 2) {
    const prefer = muscle;
    const catalog = listCatalogExercises("en");
    const local = localSearch({ query, preferMuscle: prefer, limit: 12 })
      .map((item) => {
        const match = catalog.find((c) => c.name === item.name);
        return match
          ? toLibraryFromLocal(match)
          : {
              id: item.id,
              name: item.name,
              muscles: item.muscles,
              demoUrl: item.demoUrl,
              equipment: [] as string[],
              instructions: [] as string[],
              source: item.source,
            };
      })
      .filter((item) => Boolean(item.demoUrl));

    const remoteItems = await fetchEdbByName(query, Math.max(limit * 2, 40));
    const remote = remoteItems
      .map(toLibraryFromEdb)
      .filter((item) => Boolean(item.demoUrl))
      .filter((item) =>
        prefer
          ? primaryMuscleOf(item.muscles) === prefer ||
            item.muscles.includes(prefer)
          : true,
      );

    return {
      results: dedupeLibrary([...local, ...remote]).slice(0, limit),
      nextCursor: null,
      hasNextPage: false,
    };
  }

  const localFiltered = listCatalogExercises("en")
    .filter((item) =>
      muscle ? primaryMuscleOf(item.muscles) === muscle : true,
    )
    .map(toLibraryFromLocal)
    .filter((item) => Boolean(item.demoUrl));

  const targets = muscle ? edbTargetsForMuscle(muscle) : [];
  const targetMuscle = targets[0] ?? null;

  const page = await fetchEdbPage({
    limit: Math.max(limit, 24),
    cursor: params.cursor,
    targetMuscle,
  });

  const remote = page.data
    .map(toLibraryFromEdb)
    .filter((item) => Boolean(item.demoUrl))
    .filter((item) =>
      muscle
        ? primaryMuscleOf(item.muscles) === muscle ||
          item.muscles.includes(muscle)
        : true,
    );

  if (params.cursor) {
    return {
      results: dedupeLibrary(remote),
      nextCursor: page.nextCursor,
      hasNextPage: page.hasNextPage,
    };
  }

  return {
    results: dedupeLibrary([...localFiltered, ...remote]),
    nextCursor: page.nextCursor,
    hasNextPage: page.hasNextPage,
  };
}

export async function getLibraryExerciseById(
  id: string,
): Promise<LibraryExercise | null> {
  if (id.startsWith("local:")) {
    const name = id.slice("local:".length);
    const item =
      listCatalogExercises("en").find((c) => c.name === name) ??
      listCatalogExercises("es").find((c) => c.name === name);
    return item ? toLibraryFromLocal(item) : null;
  }

  const payload = await fetchJson(`${BASE}/exercises/${encodeURIComponent(id)}`);
  const data = (payload?.data ?? payload) as ExerciseDbExercise | null;
  if (!data?.exerciseId && !data?.name) return null;
  return toLibraryFromEdb({
    ...data,
    exerciseId: data.exerciseId || id,
  });
}
