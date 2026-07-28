import type { OnboardingData } from "@/lib/validations/onboarding";
import type { GeneratedRoutine } from "@/lib/validations/routine";
import { buildLocalRoutine, modifyLocalRoutine } from "@/lib/ai/local-coach";
import type { AppLocale } from "@/lib/i18n/locale";

/**
 * Coach gratuito de Forma: genera y adapta rutinas en el servidor
 * sin APIs de pago. Cero costo para el usuario y para el desarrollador.
 */
export async function generateRoutineFromOnboarding(
  data: OnboardingData,
  locale: AppLocale = "en",
): Promise<GeneratedRoutine> {
  return buildLocalRoutine(data, locale);
}

export async function modifyRoutineWithInstruction(params: {
  instruction: string;
  current: GeneratedRoutine;
  preferences?: OnboardingData | null;
  locale?: AppLocale;
}): Promise<GeneratedRoutine> {
  return modifyLocalRoutine(params);
}
