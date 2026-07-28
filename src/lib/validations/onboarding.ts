import { z } from "zod";

export const goalOptions = [
  "muscle",
  "strength",
  "fat_loss",
  "endurance",
  "general",
] as const;

export const levelOptions = ["beginner", "intermediate", "advanced"] as const;

export const equipmentOptions = [
  "full_gym",
  "home_dumbbells",
  "bodyweight",
  "bands",
  "machines_only",
] as const;

export const onboardingSchema = z.object({
  goal: z.enum(goalOptions),
  level: z.enum(levelOptions),
  daysPerWeek: z.number().int().min(2).max(6),
  sessionMinutes: z.number().int().min(20).max(120),
  equipment: z.array(z.enum(equipmentOptions)).min(1),
  injuries: z.string().max(500).default(""),
  avoidExercises: z.string().max(500).default(""),
  preferences: z.string().max(500).default(""),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;

export const goalLabels: Record<(typeof goalOptions)[number], string> = {
  muscle: "Build muscle",
  strength: "Build strength",
  fat_loss: "Lose fat",
  endurance: "Improve endurance",
  general: "Get fit",
};

export const levelLabels: Record<(typeof levelOptions)[number], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const equipmentLabels: Record<(typeof equipmentOptions)[number], string> = {
  full_gym: "Full gym",
  home_dumbbells: "Home dumbbells",
  bodyweight: "Bodyweight",
  bands: "Resistance bands",
  machines_only: "Machines only",
};
