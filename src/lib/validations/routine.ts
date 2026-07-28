import { z } from "zod";

export const exerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.number().int().min(1).max(10),
  reps: z.string().min(1),
  restSeconds: z.number().int().min(0).max(600),
  muscles: z.array(z.string()).min(1),
  notes: z.string().default(""),
  demoUrl: z.string().nullable().optional(),
});

export const routineDaySchema = z.object({
  dayIndex: z.number().int().min(0),
  name: z.string().min(1),
  focus: z.string().min(1),
  exercises: z.array(exerciseSchema).min(1),
});

export const generatedRoutineSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  aiRationale: z.string().min(1),
  days: z.array(routineDaySchema).min(2).max(6),
});

export type GeneratedExercise = z.infer<typeof exerciseSchema>;
export type GeneratedRoutineDay = z.infer<typeof routineDaySchema>;
export type GeneratedRoutine = z.infer<typeof generatedRoutineSchema>;

export const modifyRoutineRequestSchema = z.object({
  instruction: z.string().min(3).max(500),
  routineId: z.string().uuid(),
});
