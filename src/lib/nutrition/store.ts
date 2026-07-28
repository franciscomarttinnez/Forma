import type { AppLocale } from "@/lib/i18n/locale";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildLocalNutritionPlan,
  normalizeWaterDay,
  rebuildNutritionPlan,
} from "@/lib/nutrition/local-plan";
import { parsePreferences } from "@/lib/profile/preferences";
import {
  nutritionIntakeSchema,
  type NutritionIntake,
  type NutritionPlan,
} from "@/lib/validations/nutrition";
import type { Database, Json } from "@/types/database";

type Client = SupabaseClient<Database>;

async function readPrefs(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return parsePreferences(data?.preferences);
}

async function writePrefs(
  supabase: Client,
  userId: string,
  preferences: ReturnType<typeof parsePreferences>,
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      preferences: preferences as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

function listSummary(plan: NutritionPlan) {
  return {
    id: plan.id,
    title: plan.title,
    summary: plan.summary,
    updatedAt: plan.generatedAt,
  };
}

export async function listNutritionPlans(supabase: Client, userId: string) {
  const prefs = await readPrefs(supabase, userId);
  return prefs.nutritionPlans.map(listSummary);
}

export async function getNutritionPlan(
  supabase: Client,
  userId: string,
  planId?: string,
): Promise<NutritionPlan | null> {
  const prefs = await readPrefs(supabase, userId);
  if (!prefs.nutritionPlans.length) return null;

  const id = planId ?? prefs.activeNutritionId ?? prefs.nutritionPlans[0]?.id;
  const index = prefs.nutritionPlans.findIndex((p) => p.id === id);
  if (index < 0) return null;

  const normalized = normalizeWaterDay(prefs.nutritionPlans[index]);
  if (
    normalized.waterMlToday !== prefs.nutritionPlans[index].waterMlToday ||
    normalized.waterDate !== prefs.nutritionPlans[index].waterDate
  ) {
    const nextPlans = [...prefs.nutritionPlans];
    nextPlans[index] = normalized;
    await writePrefs(supabase, userId, {
      ...prefs,
      nutritionPlans: nextPlans,
      activeNutritionId: normalized.id,
    });
  }

  return normalized;
}

export async function createNutritionPlan(
  supabase: Client,
  userId: string,
  rawIntake: unknown,
  locale: AppLocale = "en",
): Promise<NutritionPlan> {
  const intake = nutritionIntakeSchema.parse(rawIntake) as NutritionIntake;
  const prefs = await readPrefs(supabase, userId);
  const plan = buildLocalNutritionPlan(intake, locale);

  await writePrefs(supabase, userId, {
    ...prefs,
    nutritionPlans: [plan, ...prefs.nutritionPlans],
    activeNutritionId: plan.id,
    weightKg: intake.weightKg,
    heightCm: intake.heightCm,
  });

  return plan;
}

export async function replaceNutritionPlan(
  supabase: Client,
  userId: string,
  planId: string,
  plan: NutritionPlan,
): Promise<NutritionPlan> {
  const prefs = await readPrefs(supabase, userId);
  const index = prefs.nutritionPlans.findIndex((p) => p.id === planId);
  if (index < 0) throw new Error("Plan not found.");

  const next = { ...plan, id: planId };
  const nextPlans = [...prefs.nutritionPlans];
  nextPlans[index] = next;

  await writePrefs(supabase, userId, {
    ...prefs,
    nutritionPlans: nextPlans,
    activeNutritionId: planId,
    weightKg: next.intake.weightKg,
    heightCm: next.intake.heightCm,
  });

  return next;
}

export async function updateNutritionPlanFromIntake(
  supabase: Client,
  userId: string,
  planId: string,
  rawIntake: unknown,
  locale: AppLocale = "en",
): Promise<NutritionPlan> {
  const intake = nutritionIntakeSchema.parse(rawIntake) as NutritionIntake;
  const existing = await getNutritionPlan(supabase, userId, planId);
  if (!existing) throw new Error("Plan not found.");

  const rebuilt = rebuildNutritionPlan(existing, intake, locale);
  return replaceNutritionPlan(supabase, userId, planId, rebuilt);
}

export async function activateNutritionPlan(
  supabase: Client,
  userId: string,
  planId: string,
) {
  const prefs = await readPrefs(supabase, userId);
  if (!prefs.nutritionPlans.some((p) => p.id === planId)) {
    throw new Error("Plan not found.");
  }
  await writePrefs(supabase, userId, { ...prefs, activeNutritionId: planId });
}

export async function renameNutritionPlan(
  supabase: Client,
  userId: string,
  planId: string,
  title: string,
) {
  const prefs = await readPrefs(supabase, userId);
  const nextTitle = title.trim();
  if (!nextTitle) throw new Error("Name cannot be empty.");

  const nextPlans = prefs.nutritionPlans.map((plan) =>
    plan.id === planId
      ? {
          ...plan,
          title: nextTitle,
          intake: { ...plan.intake, name: nextTitle },
        }
      : plan,
  );

  if (!nextPlans.some((p) => p.id === planId)) {
    throw new Error("Plan not found.");
  }

  await writePrefs(supabase, userId, { ...prefs, nutritionPlans: nextPlans });
}

export async function deleteNutritionPlan(
  supabase: Client,
  userId: string,
  planId: string,
) {
  const prefs = await readPrefs(supabase, userId);
  const nextPlans = prefs.nutritionPlans.filter((p) => p.id !== planId);
  if (nextPlans.length === prefs.nutritionPlans.length) {
    throw new Error("Plan not found.");
  }

  const activeNutritionId =
    prefs.activeNutritionId === planId
      ? nextPlans[0]?.id
      : prefs.activeNutritionId;

  await writePrefs(supabase, userId, {
    ...prefs,
    nutritionPlans: nextPlans,
    activeNutritionId,
  });
}

export async function addWaterIntake(
  supabase: Client,
  userId: string,
  amountMl: number,
  planId?: string,
): Promise<NutritionPlan> {
  const prefs = await readPrefs(supabase, userId);
  const id = planId ?? prefs.activeNutritionId ?? prefs.nutritionPlans[0]?.id;
  const index = prefs.nutritionPlans.findIndex((p) => p.id === id);
  if (index < 0) {
    throw new Error("Create a nutrition plan first.");
  }

  const plan = normalizeWaterDay(prefs.nutritionPlans[index]);
  const next: NutritionPlan = {
    ...plan,
    waterMlToday: Math.min(10000, Math.max(0, plan.waterMlToday + amountMl)),
    waterDate: new Date().toISOString().slice(0, 10),
  };

  const nextPlans = [...prefs.nutritionPlans];
  nextPlans[index] = next;

  await writePrefs(supabase, userId, {
    ...prefs,
    nutritionPlans: nextPlans,
    activeNutritionId: next.id,
  });

  return next;
}
