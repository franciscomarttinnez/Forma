import { z } from "zod";
import {
  equipmentOptions,
  goalOptions,
  levelOptions,
  onboardingSchema,
  type OnboardingData,
} from "@/lib/validations/onboarding";
import {
  nutritionPlanSchema,
  type NutritionPlan,
} from "@/lib/validations/nutrition";

export const weightLogSchema = z.object({
  id: z.string(),
  weightKg: z.number().positive().max(400),
  recordedAt: z.string(),
});

export const coachMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "coach"]),
  content: z.string(),
  createdAt: z.string(),
});

export const workoutStatusOptions = ["trained", "rest", "skipped"] as const;

export const workoutLogSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(workoutStatusOptions).default("trained"),
  routineId: z.string().uuid().optional(),
  dayName: z.string().max(80).optional(),
  note: z.string().max(400).optional(),
});

export const profilePreferencesSchema = onboardingSchema.extend({
  heightCm: z.number().min(100).max(250).optional(),
  weightKg: z.number().positive().max(400).optional(),
  weightLogs: z.array(weightLogSchema).default([]),
  coachChat: z.array(coachMessageSchema).default([]),
  nutritionCoachChat: z.array(coachMessageSchema).default([]),
  workoutLogs: z.array(workoutLogSchema).default([]),
  activeRoutineId: z.string().uuid().optional(),
  calendarRoutineId: z.string().uuid().optional(),
  nutritionPlans: z.array(nutritionPlanSchema).default([]),
  activeNutritionId: z.string().uuid().optional(),
});

export type ProfilePreferences = z.infer<typeof profilePreferencesSchema>;
export type CoachMessage = z.infer<typeof coachMessageSchema>;
export type WorkoutLog = z.infer<typeof workoutLogSchema>;
export type WorkoutStatus = (typeof workoutStatusOptions)[number];

export const workoutStatusLabels: Record<WorkoutStatus, string> = {
  trained: "Entrenado",
  rest: "Descanso",
  skipped: "Omitido",
};

function parseNutritionPlans(raw: Record<string, unknown>): NutritionPlan[] {
  const plans: NutritionPlan[] = [];

  if (Array.isArray(raw.nutritionPlans)) {
    for (const item of raw.nutritionPlans) {
      const parsed = nutritionPlanSchema.safeParse(item);
      if (parsed.success) plans.push(parsed.data);
    }
  }

  // Legacy single plan → migrate into array if valid under new schema
  if (!plans.length && raw.nutrition) {
    const parsed = nutritionPlanSchema.safeParse(raw.nutrition);
    if (parsed.success) plans.push(parsed.data);
  }

  return plans;
}

export function parsePreferences(raw: unknown): ProfilePreferences {
  const base: OnboardingData = {
    goal: "general",
    level: "beginner",
    daysPerWeek: 3,
    sessionMinutes: 45,
    equipment: ["full_gym"],
    injuries: "",
    avoidExercises: "",
    preferences: "",
  };

  if (!raw || typeof raw !== "object") {
    return profilePreferencesSchema.parse({
      ...base,
      weightLogs: [],
      coachChat: [],
      nutritionCoachChat: [],
      workoutLogs: [],
      nutritionPlans: [],
    });
  }

  const input = raw as Record<string, unknown>;
  const activeRoutineId =
    typeof input.activeRoutineId === "string" &&
    z.string().uuid().safeParse(input.activeRoutineId).success
      ? input.activeRoutineId
      : undefined;

  const calendarRoutineId =
    typeof input.calendarRoutineId === "string" &&
    z.string().uuid().safeParse(input.calendarRoutineId).success
      ? input.calendarRoutineId
      : undefined;

  const nutritionPlans = parseNutritionPlans(input);
  const activeNutritionId =
    typeof input.activeNutritionId === "string" &&
    z.string().uuid().safeParse(input.activeNutritionId).success &&
    nutritionPlans.some((p) => p.id === input.activeNutritionId)
      ? input.activeNutritionId
      : nutritionPlans[0]?.id;

  const workoutLogs = Array.isArray(input.workoutLogs)
    ? input.workoutLogs.flatMap((item) => {
        const parsed = workoutLogSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      })
    : [];

  const merged = {
    ...base,
    ...input,
    goal: goalOptions.includes(input.goal as never) ? input.goal : base.goal,
    level: levelOptions.includes(input.level as never) ? input.level : base.level,
    equipment: Array.isArray(input.equipment)
      ? input.equipment.filter((item) =>
          equipmentOptions.includes(item as never),
        )
      : base.equipment,
    weightLogs: Array.isArray(input.weightLogs) ? input.weightLogs : [],
    coachChat: Array.isArray(input.coachChat) ? input.coachChat : [],
    nutritionCoachChat: Array.isArray(input.nutritionCoachChat)
      ? input.nutritionCoachChat
      : [],
    workoutLogs,
    activeRoutineId,
    calendarRoutineId,
    nutritionPlans,
    activeNutritionId,
  };

  // Drop legacy key so zod doesn't choke on old meal shape
  delete (merged as { nutrition?: unknown }).nutrition;

  if (!merged.equipment.length) merged.equipment = base.equipment;

  return profilePreferencesSchema.parse(merged);
}
