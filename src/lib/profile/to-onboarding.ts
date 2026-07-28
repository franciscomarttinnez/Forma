import type { ProfilePreferences } from "@/lib/profile/preferences";
import type { OnboardingData } from "@/lib/validations/onboarding";

export function toOnboardingData(prefs: ProfilePreferences): OnboardingData {
  return {
    goal: prefs.goal,
    level: prefs.level,
    daysPerWeek: prefs.daysPerWeek,
    sessionMinutes: prefs.sessionMinutes,
    equipment: prefs.equipment,
    injuries: prefs.injuries,
    avoidExercises: prefs.avoidExercises,
    preferences: prefs.preferences,
  };
}
