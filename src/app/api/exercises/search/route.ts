import { NextResponse } from "next/server";
import { z } from "zod";
import { primaryMuscleOf } from "@/lib/exercises/muscles";
import {
  apiRecommendations,
  apiSearch,
  localRecommendations,
  localSearch,
  type SwapCandidate,
} from "@/lib/exercises/search";
import { createClient } from "@/lib/supabase/server";

const querySchema = z.object({
  q: z.string().max(80).optional().default(""),
  name: z.string().max(120).optional(),
  muscles: z.string().max(200).optional(),
  exclude: z.string().max(800).optional(),
});

function dedupe(items: SwapCandidate[]) {
  const seen = new Set<string>();
  const result: SwapCandidate[] = [];
  for (const item of items) {
    const key = item.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

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
      name: searchParams.get("name") ?? undefined,
      muscles: searchParams.get("muscles") ?? undefined,
      exclude: searchParams.get("exclude") ?? undefined,
    });

    const muscles = (parsed.muscles ?? "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
    const excludeNames = (parsed.exclude ?? "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
    const preferMuscle = primaryMuscleOf(muscles);
    const query = parsed.q.trim();

    if (query.length >= 2) {
      const [local, remote] = await Promise.all([
        Promise.resolve(
          localSearch({
            query,
            excludeNames,
            preferMuscle,
            limit: 12,
          }),
        ),
        apiSearch({
          query,
          preferMuscle,
          excludeNames,
          limit: 20,
        }),
      ]);

      return NextResponse.json({
        mode: "search",
        primaryMuscle: preferMuscle,
        results: dedupe([...local, ...remote]).slice(0, 24),
      });
    }

    const currentName = parsed.name?.trim() || "Ejercicio";
    const [local, remote] = await Promise.all([
      Promise.resolve(
        localRecommendations({
          currentName,
          muscles,
          excludeNames,
          limit: 10,
        }),
      ),
      apiRecommendations({
        muscles,
        excludeNames,
        limit: 14,
      }),
    ]);

    return NextResponse.json({
      mode: "recommend",
      primaryMuscle: preferMuscle,
      results: dedupe([...local, ...remote]).slice(0, 20),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not search exercises.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
