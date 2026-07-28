import { z } from "zod";
import {
  applyCoachAction,
  type CoachAction,
} from "@/lib/ai/local-coach";
import type { AppLocale } from "@/lib/i18n/locale";
import type { OnboardingData } from "@/lib/validations/onboarding";
import type { GeneratedRoutine } from "@/lib/validations/routine";

export type CoachChatResult = {
  reply: string;
  modified: boolean;
  aiRationale?: string;
  routine?: GeneratedRoutine;
  label: string;
};

export const coachActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("set_days"), count: z.number().int().min(2).max(6) }),
  z.object({ type: z.literal("swap_machines_to_dumbbells") }),
  z.object({ type: z.literal("reshuffle") }),
  z.object({ type: z.literal("volume_up") }),
  z.object({ type: z.literal("volume_down") }),
  z.object({ type: z.literal("rest_shorter") }),
  z.object({ type: z.literal("rest_longer") }),
  z.object({
    type: z.literal("replace_exercise"),
    dayIndex: z.number().int().min(0).max(5),
    exerciseName: z.string().min(1).max(120),
  }),
  z.object({
    type: z.literal("explain_exercise"),
    dayIndex: z.number().int().min(0).max(5),
    exerciseName: z.string().min(1).max(120),
  }),
  z.object({
    type: z.literal("advice"),
    topic: z.enum(["progress", "technique", "warmup"]),
  }),
]);

export function labelForAction(
  action: CoachAction,
  locale: AppLocale = "en",
): string {
  const es = locale === "es";
  switch (action.type) {
    case "set_days":
      return es
        ? `Pasar a ${action.count} días`
        : `Switch to ${action.count} days`;
    case "swap_machines_to_dumbbells":
      return es
        ? "Reemplazar máquinas por mancuernas"
        : "Replace machines with dumbbells";
    case "reshuffle":
      return es ? "Variar ejercicios del plan" : "Vary plan exercises";
    case "volume_up":
      return es ? "Más series" : "More sets";
    case "volume_down":
      return es ? "Menos series" : "Fewer sets";
    case "rest_shorter":
      return es ? "Menos descanso" : "Shorter rest";
    case "rest_longer":
      return es ? "Más descanso" : "Longer rest";
    case "replace_exercise":
      return es
        ? `Reemplazar ${action.exerciseName}`
        : `Replace ${action.exerciseName}`;
    case "explain_exercise":
      return es
        ? `Explicar ${action.exerciseName}`
        : `Explain ${action.exerciseName}`;
    case "advice":
      if (action.topic === "progress") {
        return es ? "Cómo progresar" : "How to progress";
      }
      if (action.topic === "technique") {
        return es ? "Técnica y dolor" : "Technique and pain";
      }
      return es ? "Cómo calentar" : "How to warm up";
    default:
      return es ? "Acción del coach" : "Coach action";
  }
}

export function runCoachAction(params: {
  action: CoachAction;
  current: GeneratedRoutine;
  preferences?: OnboardingData | null;
  locale?: AppLocale;
}): CoachChatResult {
  const locale = params.locale ?? "en";
  const result = applyCoachAction({
    action: params.action,
    current: params.current,
    preferences: params.preferences,
    locale,
  });
  return {
    reply: result.reply,
    modified: result.modified,
    aiRationale: result.routine?.aiRationale,
    routine: result.routine,
    label: labelForAction(params.action, locale),
  };
}
