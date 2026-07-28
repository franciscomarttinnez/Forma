import { z } from "zod";
import type { AppLocale } from "@/lib/i18n/locale";
import {
  nudgePlanCalories,
  rebuildNutritionPlan,
  regenerateMealInPlan,
} from "@/lib/nutrition/local-plan";
import { goalLabels, goalOptions } from "@/lib/validations/onboarding";
import {
  mealSlotLabels,
  type MealSlot,
  type NutritionPlan,
} from "@/lib/validations/nutrition";

export type NutritionCoachAction =
  | { type: "reshuffle" }
  | { type: "calories_up" }
  | { type: "calories_down" }
  | { type: "set_goal"; goal: (typeof goalOptions)[number] }
  | {
      type: "replace_meal";
      dayIndex: number;
      mealId: string;
    }
  | {
      type: "explain_meal";
      dayIndex: number;
      mealId: string;
    }
  | {
      type: "avoid_food";
      food: string;
    }
  | {
      type: "advice";
      topic: "protein" | "deficit" | "hydration" | "meal_prep";
    };

export const nutritionCoachActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("reshuffle") }),
  z.object({ type: z.literal("calories_up") }),
  z.object({ type: z.literal("calories_down") }),
  z.object({ type: z.literal("set_goal"), goal: z.enum(goalOptions) }),
  z.object({
    type: z.literal("replace_meal"),
    dayIndex: z.number().int().min(0).max(6),
    mealId: z.string().min(1),
  }),
  z.object({
    type: z.literal("explain_meal"),
    dayIndex: z.number().int().min(0).max(6),
    mealId: z.string().min(1),
  }),
  z.object({
    type: z.literal("avoid_food"),
    food: z.string().trim().min(2).max(80),
  }),
  z.object({
    type: z.literal("advice"),
    topic: z.enum(["protein", "deficit", "hydration", "meal_prep"]),
  }),
]);

const goalLabelsEs: Record<(typeof goalOptions)[number], string> = {
  muscle: "Ganar músculo",
  strength: "Ganar fuerza",
  fat_loss: "Perder grasa",
  endurance: "Mejorar resistencia",
  general: "Estar en forma",
};

const mealSlotLabelsEs: Record<MealSlot, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
};

function goalLabel(
  goal: (typeof goalOptions)[number],
  locale: AppLocale,
) {
  return locale === "es" ? goalLabelsEs[goal] : goalLabels[goal];
}

function mealSlotLabel(slot: MealSlot, locale: AppLocale) {
  return locale === "es" ? mealSlotLabelsEs[slot] : mealSlotLabels[slot];
}

export function labelForNutritionAction(
  action: NutritionCoachAction,
  locale: AppLocale = "en",
): string {
  const es = locale === "es";
  switch (action.type) {
    case "reshuffle":
      return es ? "Variar menú de la semana" : "Vary this week's menu";
    case "calories_up":
      return es ? "Subir calorías" : "Increase calories";
    case "calories_down":
      return es ? "Bajar calorías" : "Decrease calories";
    case "set_goal":
      return es
        ? `Objetivo: ${goalLabel(action.goal, locale)}`
        : `Goal: ${goalLabel(action.goal, locale)}`;
    case "replace_meal":
      return es ? "Cambiar una comida" : "Change a meal";
    case "explain_meal":
      return es ? "Explicar una comida" : "Explain a meal";
    case "avoid_food":
      return es ? `Evitar ${action.food}` : `Avoid ${action.food}`;
    case "advice":
      if (action.topic === "protein") {
        return es ? "Consejo de proteína" : "Protein tip";
      }
      if (action.topic === "deficit") {
        return es ? "Consejo de déficit" : "Deficit tip";
      }
      if (action.topic === "hydration") {
        return es ? "Consejo de hidratación" : "Hydration tip";
      }
      return es ? "Consejo de meal prep" : "Meal prep tip";
    default:
      return es ? "Acción del coach" : "Coach action";
  }
}

export function applyNutritionCoachAction(params: {
  action: NutritionCoachAction;
  current: NutritionPlan;
  locale?: AppLocale;
}): { reply: string; modified: boolean; plan?: NutritionPlan } {
  const { action, current } = params;
  const locale = params.locale ?? "en";
  const es = locale === "es";

  if (action.type === "advice") {
    return {
      reply: adviceReply(action.topic, current, locale),
      modified: false,
    };
  }

  if (action.type === "explain_meal") {
    const day = current.days[action.dayIndex];
    const meal = day?.meals.find((m) => m.id === action.mealId);
    if (!day || !meal) {
      return {
        reply: es
          ? "No encontré esa comida en el plan."
          : "I couldn't find that meal in the plan.",
        modified: false,
      };
    }
    const foods = meal.foods.map((f) => `${f.name} (${f.amount})`).join(", ");
    const slot = mealSlotLabel(meal.slot as MealSlot, locale);
    const goal = goalLabel(current.intake.goal, locale).toLowerCase();
    return {
      reply: es
        ? `${day.name} · ${slot} (${meal.name}): ~${Math.round(meal.calories)} kcal. Incluye ${foods}. Encaja con tu objetivo de ${goal}.`
        : `${day.name} · ${slot} (${meal.name}): ~${Math.round(meal.calories)} kcal. Includes ${foods}. Fits your ${goal} goal.`,
      modified: false,
    };
  }

  if (action.type === "reshuffle") {
    const plan = rebuildNutritionPlan(current, current.intake, locale);
    return {
      reply: es
        ? `Listo: armé un menú nuevo manteniendo tus ${plan.targets.calories} kcal y restricciones.`
        : `Done: built a new menu keeping your ${plan.targets.calories} kcal and restrictions.`,
      modified: true,
      plan,
    };
  }

  if (action.type === "calories_up" || action.type === "calories_down") {
    const plan = nudgePlanCalories(
      current,
      action.type === "calories_up" ? "up" : "down",
      locale,
    );
    return {
      reply: es
        ? `Pasamos a ~${plan.targets.calories} kcal/día (P ${plan.targets.protein}g · C ${plan.targets.carbs}g · G ${plan.targets.fat}g).`
        : `Now at ~${plan.targets.calories} kcal/day (P ${plan.targets.protein}g · C ${plan.targets.carbs}g · F ${plan.targets.fat}g).`,
      modified: true,
      plan,
    };
  }

  if (action.type === "set_goal") {
    const intake = { ...current.intake, goal: action.goal };
    const plan = rebuildNutritionPlan(current, intake, locale);
    const goal = goalLabel(action.goal, locale).toLowerCase();
    return {
      reply: es
        ? `Actualicé el plan hacia ${goal} (~${plan.targets.calories} kcal).`
        : `Updated the plan toward ${goal} (~${plan.targets.calories} kcal).`,
      modified: true,
      plan,
    };
  }

  if (action.type === "replace_meal") {
    const plan = regenerateMealInPlan(
      current,
      action.dayIndex,
      action.mealId,
      locale,
    );
    const day = plan.days[action.dayIndex];
    const meal = day?.meals.find((m) => m.id === action.mealId);
    const oldMeal = current.days[action.dayIndex]?.meals.find(
      (m) => m.id === action.mealId,
    );
    const nextMeal =
      day?.meals.find((m) => m.slot === oldMeal?.slot) ?? meal ?? day?.meals[0];
    return {
      reply: nextMeal
        ? es
          ? `Cambié ${day?.name ?? "el día"} · ${mealSlotLabel(nextMeal.slot, locale)} por “${nextMeal.name}”.`
          : `Changed ${day?.name ?? "the day"} · ${mealSlotLabel(nextMeal.slot, locale)} to “${nextMeal.name}”.`
        : es
          ? "No pude cambiar esa comida."
          : "I couldn't change that meal.",
      modified: Boolean(nextMeal),
      plan,
    };
  }

  if (action.type === "avoid_food") {
    const food = action.food.trim();
    const foodLabelsEs: Record<string, string> = {
      Eggs: "Huevos",
      Dairy: "Lácteos",
      Fish: "Pescado",
      Chicken: "Pollo",
      Meat: "Carne",
      Broccoli: "Brócoli",
      Avocado: "Palta",
      Oats: "Avena",
    };
    const display = es ? (foodLabelsEs[food] ?? food) : food;
    const prev = current.intake.avoidFoods.trim();
    const avoidFoods = prev
      ? prev.toLowerCase().includes(food.toLowerCase())
        ? prev
        : `${prev}, ${food}`
      : food;
    const intake = { ...current.intake, avoidFoods };
    const plan = rebuildNutritionPlan(current, intake, locale);
    return {
      reply: es
        ? `Sumé “${display}” a lo que preferís evitar y regeneré el menú semanal.`
        : `Added “${display}” to foods to avoid and regenerated the weekly menu.`,
      modified: true,
      plan,
    };
  }

  return {
    reply: es ? "No entendí esa acción." : "I didn't understand that action.",
    modified: false,
  };
}

function adviceReply(
  topic: "protein" | "deficit" | "hydration" | "meal_prep",
  plan: NutritionPlan,
  locale: AppLocale,
): string {
  const es = locale === "es";
  if (topic === "protein") {
    return es
      ? `Tu objetivo es ~${plan.targets.protein} g de proteína/día. Distribuila en las 3 comidas (aprox. ${Math.round(plan.targets.protein / 3)} g por comida) para mejor recuperación.`
      : `Your target is ~${plan.targets.protein} g of protein/day. Spread it across the 3 meals (about ${Math.round(plan.targets.protein / 3)} g per meal) for better recovery.`;
  }
  if (topic === "deficit") {
    if (plan.intake.goal === "fat_loss") {
      return es
        ? `Estás cerca de ${plan.targets.calories} kcal. Mantené la proteína alta y priorizá verduras para saciedad. Si te sentís sin energía una semana, subí 100–150 kcal.`
        : `You're around ${plan.targets.calories} kcal. Keep protein high and prioritize vegetables for satiety. If you feel low energy for a week, add 100–150 kcal.`;
    }
    return es
      ? `Si querés déficit, bajá ~150–300 kcal desde ${plan.targets.calories} y cuidá no recortar proteína.`
      : `If you want a deficit, drop ~150–300 kcal from ${plan.targets.calories} and don't cut protein.`;
  }
  if (topic === "hydration") {
    return es
      ? `Apuntá a ${plan.targets.waterMl} ml de agua. Un vaso al despertar y otro en cada comida ayuda a llegar sin forzar.`
      : `Aim for ${plan.targets.waterMl} ml of water. A glass on waking and one with each meal helps you hit it without forcing.`;
  }
  return es
    ? `Prepará 2–3 proteínas base (pollo, atún, huevos) y carbohidratos simples (arroz, papa, avena). Intercambiá verduras según el día del plan para no aburrirte.`
    : `Prep 2–3 base proteins (chicken, tuna, eggs) and simple carbs (rice, potato, oats). Rotate vegetables by plan day so you don't get bored.`;
}
