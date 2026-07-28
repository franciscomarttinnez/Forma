import { z } from "zod";
import { goalOptions } from "@/lib/validations/onboarding";

export const mealSlotOptions = ["breakfast", "lunch", "dinner"] as const;
export type MealSlot = (typeof mealSlotOptions)[number];

export const mealSlotLabels: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export const weekdayLabels = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const foodItemSchema = z.object({
  name: z.string().min(1),
  amount: z.string().min(1),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
});

export const mealSchema = z.object({
  id: z.string(),
  slot: z.enum(mealSlotOptions),
  name: z.string().min(1),
  foods: z.array(foodItemSchema).min(1),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
});

export const nutritionDaySchema = z.object({
  dayIndex: z.number().int().min(0).max(6),
  name: z.string().min(1),
  meals: z.array(mealSchema).min(3).max(3),
});

export const nutritionTargetsSchema = z.object({
  calories: z.number().int().min(1200).max(6000),
  protein: z.number().int().min(40).max(400),
  carbs: z.number().int().min(40).max(800),
  fat: z.number().int().min(20).max(250),
  waterMl: z.number().int().min(1000).max(6000),
});

export const nutritionIntakeSchema = z.object({
  name: z.string().trim().min(1).max(80),
  weightKg: z.number().positive().max(400),
  heightCm: z.number().min(100).max(250),
  age: z.number().int().min(12).max(100),
  goal: z.enum(goalOptions),
  avoidFoods: z.string().max(500).default(""),
  allergies: z.string().max(500).default(""),
  preferences: z.string().max(500).default(""),
});

export const nutritionPlanSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  summary: z.string(),
  generatedAt: z.string(),
  intake: nutritionIntakeSchema,
  targets: nutritionTargetsSchema,
  days: z.array(nutritionDaySchema).length(7),
  recommendations: z.array(z.string()).min(1),
  waterMlToday: z.number().int().min(0).max(10000).default(0),
  waterDate: z.string().optional(),
});

export type FoodItem = z.infer<typeof foodItemSchema>;
export type Meal = z.infer<typeof mealSchema>;
export type NutritionDay = z.infer<typeof nutritionDaySchema>;
export type NutritionTargets = z.infer<typeof nutritionTargetsSchema>;
export type NutritionIntake = z.infer<typeof nutritionIntakeSchema>;
export type NutritionPlan = z.infer<typeof nutritionPlanSchema>;
