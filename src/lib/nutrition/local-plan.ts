import type { AppLocale } from "@/lib/i18n/locale";
import { goalLabels, type OnboardingData } from "@/lib/validations/onboarding";
import {
  mealSlotLabels,
  nutritionPlanSchema,
  weekdayLabels,
  type FoodItem,
  type Meal,
  type MealSlot,
  type NutritionDay,
  type NutritionIntake,
  type NutritionPlan,
  type NutritionTargets,
} from "@/lib/validations/nutrition";

type FoodTemplate = {
  nameEn: string;
  nameEs: string;
  amountEn: string;
  amountEs: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  categories: string[];
};

const FOODS: FoodTemplate[] = [
  { nameEn: "Oats", nameEs: "Avena", amountEn: "60 g", amountEs: "60 g", calories: 220, protein: 8, carbs: 38, fat: 4, tags: ["breakfast", "carbs"], categories: ["grain"] },
  { nameEn: "Scrambled eggs", nameEs: "Huevos revueltos", amountEn: "2 pcs", amountEs: "2 u.", calories: 150, protein: 12, carbs: 1, fat: 10, tags: ["breakfast", "protein"], categories: ["egg"] },
  { nameEn: "Greek yogurt", nameEs: "Yogur griego", amountEn: "170 g", amountEs: "170 g", calories: 100, protein: 17, carbs: 6, fat: 0, tags: ["breakfast", "protein"], categories: ["dairy"] },
  { nameEn: "Banana", nameEs: "Banana", amountEn: "1 pc", amountEs: "1 u.", calories: 90, protein: 1, carbs: 23, fat: 0, tags: ["breakfast", "carbs"], categories: ["fruit"] },
  { nameEn: "Whole-grain bread", nameEs: "Pan integral", amountEn: "2 slices", amountEs: "2 rebanadas", calories: 140, protein: 6, carbs: 24, fat: 2, tags: ["breakfast", "carbs"], categories: ["grain"] },
  { nameEn: "Avocado", nameEs: "Palta", amountEn: "½ pc", amountEs: "½ u.", calories: 120, protein: 1, carbs: 6, fat: 11, tags: ["breakfast", "fat"], categories: ["fruit"] },
  { nameEn: "Coffee with milk", nameEs: "Café con leche", amountEn: "200 ml", amountEs: "200 ml", calories: 50, protein: 4, carbs: 6, fat: 0, tags: ["breakfast"], categories: ["dairy"] },
  { nameEn: "Toast with ricotta", nameEs: "Tostadas con ricotta", amountEn: "2 pcs", amountEs: "2 u.", calories: 180, protein: 12, carbs: 18, fat: 6, tags: ["breakfast", "protein"], categories: ["dairy", "grain"] },
  { nameEn: "Chicken breast", nameEs: "Pechuga de pollo", amountEn: "150 g", amountEs: "150 g", calories: 250, protein: 46, carbs: 0, fat: 5, tags: ["lunch", "dinner", "protein"], categories: ["poultry", "meat"] },
  { nameEn: "Lean beef", nameEs: "Carne magra", amountEn: "140 g", amountEs: "140 g", calories: 260, protein: 36, carbs: 0, fat: 12, tags: ["lunch", "dinner", "protein"], categories: ["meat"] },
  { nameEn: "Salmon", nameEs: "Salmón", amountEn: "140 g", amountEs: "140 g", calories: 280, protein: 34, carbs: 0, fat: 16, tags: ["dinner", "protein", "fat"], categories: ["fish"] },
  { nameEn: "Canned tuna", nameEs: "Atún al natural", amountEn: "1 can", amountEs: "1 lata", calories: 120, protein: 26, carbs: 0, fat: 1, tags: ["lunch", "protein"], categories: ["fish"] },
  { nameEn: "Lentils", nameEs: "Lentejas", amountEn: "200 g", amountEs: "200 g", calories: 230, protein: 18, carbs: 40, fat: 1, tags: ["lunch", "dinner", "carbs", "protein"], categories: ["legume"] },
  { nameEn: "Chickpeas", nameEs: "Garbanzos", amountEn: "180 g", amountEs: "180 g", calories: 210, protein: 12, carbs: 30, fat: 4, tags: ["lunch", "dinner", "carbs", "protein"], categories: ["legume"] },
  { nameEn: "Brown rice", nameEs: "Arroz integral", amountEn: "80 g dry", amountEs: "80 g crudo", calories: 280, protein: 6, carbs: 58, fat: 2, tags: ["lunch", "dinner", "carbs"], categories: ["grain"] },
  { nameEn: "White rice", nameEs: "Arroz blanco", amountEn: "80 g dry", amountEs: "80 g crudo", calories: 290, protein: 5, carbs: 64, fat: 1, tags: ["lunch", "dinner", "carbs"], categories: ["grain"] },
  { nameEn: "Quinoa", nameEs: "Quinoa", amountEn: "70 g dry", amountEs: "70 g crudo", calories: 250, protein: 9, carbs: 44, fat: 4, tags: ["lunch", "dinner", "carbs"], categories: ["grain"] },
  { nameEn: "Pasta", nameEs: "Pasta", amountEn: "80 g dry", amountEs: "80 g crudo", calories: 280, protein: 10, carbs: 55, fat: 2, tags: ["lunch", "dinner", "carbs"], categories: ["grain"] },
  { nameEn: "Baked potato", nameEs: "Papa al horno", amountEn: "200 g", amountEs: "200 g", calories: 170, protein: 4, carbs: 37, fat: 0, tags: ["lunch", "dinner", "carbs"], categories: ["starch", "veg"] },
  { nameEn: "Mixed salad", nameEs: "Ensalada mixta", amountEn: "1 bowl", amountEs: "1 bowl", calories: 60, protein: 3, carbs: 8, fat: 2, tags: ["lunch", "dinner"], categories: ["veg", "green_veg"] },
  { nameEn: "Broccoli", nameEs: "Brócoli", amountEn: "150 g", amountEs: "150 g", calories: 50, protein: 4, carbs: 8, fat: 0, tags: ["lunch", "dinner"], categories: ["veg", "green_veg"] },
  { nameEn: "Sautéed spinach", nameEs: "Espinaca salteada", amountEn: "150 g", amountEs: "150 g", calories: 45, protein: 4, carbs: 4, fat: 2, tags: ["lunch", "dinner"], categories: ["veg", "green_veg"] },
  { nameEn: "Zucchini", nameEs: "Zapallitos", amountEn: "150 g", amountEs: "150 g", calories: 40, protein: 2, carbs: 6, fat: 1, tags: ["dinner"], categories: ["veg"] },
  { nameEn: "Steamed carrots", nameEs: "Zanahoria al vapor", amountEn: "150 g", amountEs: "150 g", calories: 55, protein: 1, carbs: 12, fat: 0, tags: ["lunch", "dinner"], categories: ["veg"] },
  { nameEn: "Tomato and cucumber", nameEs: "Tomate y pepino", amountEn: "1 plate", amountEs: "1 plato", calories: 45, protein: 2, carbs: 8, fat: 0, tags: ["lunch", "dinner"], categories: ["veg"] },
  { nameEn: "Olive oil", nameEs: "Aceite de oliva", amountEn: "1 tbsp", amountEs: "1 cda", calories: 120, protein: 0, carbs: 0, fat: 14, tags: ["lunch", "dinner", "fat"], categories: [] },
  { nameEn: "Tofu", nameEs: "Tofu", amountEn: "150 g", amountEs: "150 g", calories: 180, protein: 20, carbs: 4, fat: 10, tags: ["lunch", "dinner", "protein"], categories: ["soy", "legume"] },
  { nameEn: "Sweet potato", nameEs: "Batata", amountEn: "180 g", amountEs: "180 g", calories: 155, protein: 2, carbs: 36, fat: 0, tags: ["dinner", "carbs"], categories: ["starch", "veg"] },
  { nameEn: "Baked hake", nameEs: "Merluza al horno", amountEn: "160 g", amountEs: "160 g", calories: 180, protein: 34, carbs: 0, fat: 4, tags: ["dinner", "protein"], categories: ["fish"] },
  { nameEn: "Vegetable stir-fry", nameEs: "Wok de verduras", amountEn: "1 plate", amountEs: "1 plato", calories: 110, protein: 4, carbs: 14, fat: 4, tags: ["dinner"], categories: ["veg", "green_veg"] },
  { nameEn: "Corn", nameEs: "Choclo", amountEn: "1 cup", amountEs: "1 taza", calories: 130, protein: 4, carbs: 28, fat: 1, tags: ["lunch", "dinner", "carbs"], categories: ["starch", "veg"] },
];

const weekdayLabelsEs = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

const goalLabelsEs: Record<OnboardingData["goal"], string> = {
  muscle: "Ganar músculo",
  strength: "Ganar fuerza",
  fat_loss: "Perder grasa",
  endurance: "Mejorar resistencia",
  general: "Estar en forma",
};

function goalLabel(goal: OnboardingData["goal"], locale: AppLocale) {
  return locale === "es" ? goalLabelsEs[goal] : goalLabels[goal];
}

function weekdayLabel(dayIndex: number, locale: AppLocale) {
  return locale === "es" ? weekdayLabelsEs[dayIndex] : weekdayLabels[dayIndex];
}

/** Phrase / word → food categories to exclude (EN + ES) */
const AVOID_PHRASE_TO_CATEGORIES: Record<string, string[]> = {
  legume: ["legume"],
  legumes: ["legume"],
  legumbre: ["legume"],
  legumbres: ["legume"],
  lentil: ["legume"],
  lentils: ["legume"],
  lenteja: ["legume"],
  lentejas: ["legume"],
  chickpea: ["legume"],
  chickpeas: ["legume"],
  garbanzo: ["legume"],
  garbanzos: ["legume"],
  bean: ["legume"],
  beans: ["legume"],
  poroto: ["legume"],
  porotos: ["legume"],
  frijol: ["legume"],
  soy: ["soy", "legume"],
  soja: ["soy", "legume"],
  tofu: ["soy", "legume"],
  vegetable: ["veg", "green_veg"],
  vegetables: ["veg", "green_veg"],
  verdura: ["veg", "green_veg"],
  verduras: ["veg", "green_veg"],
  "green vegetables": ["green_veg"],
  "verduras verdes": ["green_veg"],
  "verdura verde": ["green_veg"],
  greens: ["green_veg"],
  verdes: ["green_veg"],
  green: ["green_veg"],
  verde: ["green_veg"],
  broccoli: ["green_veg", "veg"],
  brocoli: ["green_veg", "veg"],
  spinach: ["green_veg", "veg"],
  espinaca: ["green_veg", "veg"],
  espinacas: ["green_veg", "veg"],
  salad: ["green_veg", "veg"],
  ensalada: ["green_veg", "veg"],
  dairy: ["dairy"],
  lacteo: ["dairy"],
  lacteos: ["dairy"],
  milk: ["dairy"],
  leche: ["dairy"],
  yogurt: ["dairy"],
  yogur: ["dairy"],
  cheese: ["dairy"],
  queso: ["dairy"],
  ricotta: ["dairy"],
  gluten: ["grain"],
  bread: ["grain"],
  pan: ["grain"],
  oats: ["grain"],
  avena: ["grain"],
  fish: ["fish"],
  pescado: ["fish"],
  salmon: ["fish"],
  tuna: ["fish"],
  atun: ["fish"],
  hake: ["fish"],
  merluza: ["fish"],
  chicken: ["poultry", "meat"],
  pollo: ["poultry", "meat"],
  meat: ["meat"],
  carne: ["meat"],
  egg: ["egg"],
  eggs: ["egg"],
  huevo: ["egg"],
  huevos: ["egg"],
  avocado: ["fruit"],
  palta: ["fruit"],
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function foodKey(item: FoodTemplate) {
  return item.nameEn;
}

function localizeFood(item: FoodTemplate, locale: AppLocale): FoodItem {
  return {
    name: locale === "es" ? item.nameEs : item.nameEn,
    amount: locale === "es" ? item.amountEs : item.amountEn,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
  };
}

function avoidSourceText(intake: NutritionIntake) {
  return normalize(
    `${intake.avoidFoods} ${intake.allergies} ${intake.preferences}`,
  );
}

function getAvoidRules(intake: NutritionIntake) {
  const text = avoidSourceText(intake);
  const categories = new Set<string>();
  const nameTokens = new Set<string>();

  if (!text.trim()) return { categories, nameTokens };

  const phrases = Object.keys(AVOID_PHRASE_TO_CATEGORIES).sort(
    (a, b) => b.length - a.length,
  );
  for (const phrase of phrases) {
    const key = normalize(phrase);
    if (text.includes(key)) {
      nameTokens.add(key);
      for (const cat of AVOID_PHRASE_TO_CATEGORIES[phrase]) {
        categories.add(cat);
      }
    }
  }

  for (const part of text.split(
    /[,;\n\/]+|\s+ni\s+|\s+sin\s+|\s+no\s+|\s+y\s+|\s+o\s+|\s+and\s+|\s+or\s+|\s+without\s+/,
  )) {
    const token = part.trim();
    if (token.length > 2) nameTokens.add(token);
  }

  return { categories, nameTokens };
}

function isBlocked(item: FoodTemplate, intake: NutritionIntake) {
  const { categories, nameTokens } = getAvoidRules(intake);
  if (!categories.size && !nameTokens.size) return false;

  const name = normalize(`${item.nameEn} ${item.nameEs}`);
  for (const token of nameTokens) {
    if (token.length < 3) continue;
    if (name.includes(token) || token.includes(normalize(item.nameEn))) return true;
  }
  return item.categories.some((cat) => categories.has(cat));
}

function sumMacros(foods: FoodItem[]) {
  return foods.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function computeTargets(intake: NutritionIntake): NutritionTargets {
  const sexNeutralBmr =
    10 * intake.weightKg + 6.25 * intake.heightCm - 5 * intake.age + 5;
  let calories = Math.round(sexNeutralBmr * 1.45);

  if (intake.goal === "fat_loss") calories = Math.round(calories * 0.82);
  if (intake.goal === "muscle" || intake.goal === "strength") {
    calories = Math.round(calories * 1.1);
  }
  if (intake.goal === "endurance") calories = Math.round(calories * 1.05);

  calories = Math.min(4200, Math.max(1600, calories));

  const proteinPerKg =
    intake.goal === "muscle" || intake.goal === "strength"
      ? 2.0
      : intake.goal === "fat_loss"
        ? 2.2
        : 1.6;
  const protein = Math.round(intake.weightKg * proteinPerKg);
  const fat = Math.round((calories * 0.28) / 9);
  const carbs = Math.max(
    80,
    Math.round((calories - protein * 4 - fat * 9) / 4),
  );
  const waterMl = Math.round(
    Math.min(4000, Math.max(2000, intake.weightKg * 35)),
  );

  return { calories, protein, carbs, fat, waterMl };
}

function pickOne(
  pool: FoodTemplate[],
  used: Set<string>,
  offset: number,
  match: (item: FoodTemplate) => boolean,
): FoodTemplate | null {
  if (!pool.length) return null;
  const candidates = pool.filter(
    (item) => match(item) && !used.has(foodKey(item)),
  );
  const source = candidates.length ? candidates : pool.filter(match);
  if (!source.length) return null;
  for (let i = 0; i < source.length; i++) {
    const item = source[(offset + i) % source.length];
    if (!used.has(foodKey(item))) {
      used.add(foodKey(item));
      return item;
    }
  }
  const fallback = source[offset % source.length];
  used.add(foodKey(fallback));
  return fallback;
}

function composeMealFoods(
  slot: MealSlot,
  intake: NutritionIntake,
  used: Set<string>,
  offset: number,
  locale: AppLocale,
): FoodItem[] {
  const allowed = FOODS.filter(
    (item) => item.tags.includes(slot) && !isBlocked(item, intake),
  );
  const pool = allowed.length
    ? allowed
    : FOODS.filter((item) => !isBlocked(item, intake));
  if (!pool.length) return [];

  const selected: FoodTemplate[] = [];

  const isCarbSide = (i: FoodTemplate) =>
    (i.categories.includes("grain") ||
      i.categories.includes("starch") ||
      (i.tags.includes("carbs") && !i.tags.includes("protein"))) &&
    !i.categories.includes("fruit");

  const isPureProtein = (i: FoodTemplate) =>
    i.tags.includes("protein") &&
    !i.categories.includes("grain") &&
    !i.categories.includes("starch");

  if (slot === "breakfast") {
    const protein =
      pickOne(pool, used, offset, isPureProtein) ??
      pickOne(pool, used, offset, (i) => i.tags.includes("protein")) ??
      pickOne(pool, used, offset, () => true);
    if (protein) selected.push(protein);

    const carb = pickOne(
      pool,
      used,
      offset + 1,
      (i) => isCarbSide(i) && !selected.some((s) => foodKey(s) === foodKey(i)),
    );
    if (carb) selected.push(carb);

    const extras = pickOne(
      pool,
      used,
      offset + 2,
      (i) =>
        (i.categories.includes("fruit") ||
          i.tags.includes("fat") ||
          (!isCarbSide(i) && !i.tags.includes("protein"))) &&
        !selected.some((s) => foodKey(s) === foodKey(i)),
    );
    if (extras) selected.push(extras);
  } else {
    const protein =
      pickOne(
        pool,
        used,
        offset,
        (i) => isPureProtein(i) && !i.categories.includes("legume"),
      ) ??
      pickOne(pool, used, offset, isPureProtein) ??
      pickOne(pool, used, offset, (i) => i.tags.includes("protein"));
    if (protein) selected.push(protein);

    const alreadyHasLegume = selected.some((s) =>
      s.categories.includes("legume"),
    );

    const carb =
      pickOne(
        pool,
        used,
        offset + 2,
        (i) =>
          (i.categories.includes("grain") || i.categories.includes("starch")) &&
          !i.tags.includes("protein"),
      ) ??
      (!alreadyHasLegume
        ? pickOne(
            pool,
            used,
            offset + 2,
            (i) =>
              i.categories.includes("legume") && i.tags.includes("carbs"),
          )
        : null);
    if (carb) selected.push(carb);

    const veg = pickOne(
      pool,
      used,
      offset + 4,
      (i) =>
        i.categories.includes("veg") &&
        !i.categories.includes("grain") &&
        !i.categories.includes("starch") &&
        !i.tags.includes("protein"),
    );
    if (veg) selected.push(veg);

    if (selected.length < 3) {
      const fat = pickOne(
        pool,
        used,
        offset + 5,
        (i) => i.tags.includes("fat") && i.categories.length === 0,
      );
      if (fat) selected.push(fat);
    }
  }

  if (selected.length < 2) {
    const filler = pickOne(
      pool,
      used,
      offset + 7,
      (i) =>
        !selected.some((s) => foodKey(s) === foodKey(i)) &&
        !i.categories.includes("grain"),
    );
    if (filler) selected.push(filler);
  }

  return selected.map((item) => localizeFood(item, locale));
}

function buildMeal(
  slot: MealSlot,
  name: string,
  foods: FoodItem[],
): Meal {
  return {
    id: crypto.randomUUID(),
    slot,
    name,
    foods,
    ...sumMacros(foods),
  };
}

const BREAKFAST_NAMES = {
  en: ["Classic breakfast", "Morning bowl", "Protein breakfast", "Light start"],
  es: ["Desayuno clásico", "Bowl matutino", "Desayuno proteico", "Inicio liviano"],
};
const LUNCH_NAMES = {
  en: ["Full lunch", "Midday plate", "Balanced lunch", "Main menu"],
  es: ["Almuerzo completo", "Plato del mediodía", "Almuerzo balanceado", "Menú principal"],
};
const DINNER_NAMES = {
  en: ["Light dinner", "Recovery dinner", "Full dinner", "Day closer"],
  es: ["Cena liviana", "Cena de recuperación", "Cena completa", "Cierre del día"],
};

function mealNames(slot: MealSlot, locale: AppLocale) {
  if (slot === "breakfast") return BREAKFAST_NAMES[locale];
  if (slot === "lunch") return LUNCH_NAMES[locale];
  return DINNER_NAMES[locale];
}

function buildDay(
  dayIndex: number,
  intake: NutritionIntake,
  locale: AppLocale,
): NutritionDay {
  const used = new Set<string>();
  const meals = [
    buildMeal(
      "breakfast",
      mealNames("breakfast", locale)[dayIndex % 4],
      composeMealFoods("breakfast", intake, used, dayIndex, locale),
    ),
    buildMeal(
      "lunch",
      mealNames("lunch", locale)[dayIndex % 4],
      composeMealFoods("lunch", intake, used, dayIndex + 1, locale),
    ),
    buildMeal(
      "dinner",
      mealNames("dinner", locale)[dayIndex % 4],
      composeMealFoods("dinner", intake, used, dayIndex + 2, locale),
    ),
  ];

  return {
    dayIndex,
    name: weekdayLabel(dayIndex, locale) ?? weekdayLabels[dayIndex],
    meals,
  };
}

function buildRecommendations(
  intake: NutritionIntake,
  targets: NutritionTargets,
  locale: AppLocale,
): string[] {
  const es = locale === "es";
  const goal = goalLabel(intake.goal, locale).toLowerCase();
  const tips = es
    ? [
        `Objetivo diario: ~${targets.calories} kcal orientado a ${goal}.`,
        `Apuntá a ${targets.protein} g de proteína y ${targets.waterMl} ml de agua por día.`,
      ]
    : [
        `Daily target: ~${targets.calories} kcal aimed at ${goal}.`,
        `Aim for ${targets.protein} g of protein and ${targets.waterMl} ml of water per day.`,
      ];

  if (intake.allergies.trim()) {
    tips.push(
      es
        ? `Respetá tus alergias: ${intake.allergies.trim()}.`
        : `Respect your allergies: ${intake.allergies.trim()}.`,
    );
  }
  if (intake.avoidFoods.trim() || intake.preferences.trim()) {
    const notes = [intake.avoidFoods.trim(), intake.preferences.trim()]
      .filter(Boolean)
      .join(" · ");
    tips.push(
      es
        ? `Tuve en cuenta tus excepciones: ${notes}.`
        : `I accounted for your exceptions: ${notes}.`,
    );
  }
  if (intake.goal === "fat_loss") {
    tips.push(
      es
        ? "Priorizá volumen con verduras y proteína magra para mayor saciedad."
        : "Prioritize volume with vegetables and lean protein for more satiety.",
    );
  } else if (intake.goal === "muscle" || intake.goal === "strength") {
    tips.push(
      es
        ? "No saltees comidas: la constancia ayuda a recuperar y crecer."
        : "Don't skip meals: consistency helps recovery and growth.",
    );
  } else {
    tips.push(
      es
        ? "Repetí comidas simples los días ocupados para sostener el hábito."
        : "Repeat simple meals on busy days to keep the habit going.",
    );
  }

  return tips;
}

export function buildLocalNutritionPlan(
  intake: NutritionIntake,
  locale: AppLocale = "en",
): NutritionPlan {
  const targets = computeTargets(intake);
  const days = weekdayLabels.map((_, dayIndex) =>
    buildDay(dayIndex, intake, locale),
  );
  const goal = goalLabel(intake.goal, locale);
  const es = locale === "es";

  return nutritionPlanSchema.parse({
    id: crypto.randomUUID(),
    title: intake.name.trim(),
    summary: es
      ? `${targets.calories} kcal/día · ${goal} · agua ${targets.waterMl} ml`
      : `${targets.calories} kcal/day · ${goal} · water ${targets.waterMl} ml`,
    generatedAt: new Date().toISOString(),
    intake,
    targets,
    days,
    recommendations: buildRecommendations(intake, targets, locale),
    waterMlToday: 0,
    waterDate: todayKey(),
  });
}

/** Rebuild meals/targets from intake while keeping plan id and water progress. */
export function rebuildNutritionPlan(
  existing: NutritionPlan,
  intake: NutritionIntake,
  locale: AppLocale = "en",
): NutritionPlan {
  const fresh = buildLocalNutritionPlan(intake, locale);
  return {
    ...fresh,
    id: existing.id,
    title: intake.name.trim() || existing.title,
    waterMlToday: existing.waterMlToday,
    waterDate: existing.waterDate ?? todayKey(),
  };
}

export function regenerateMealInPlan(
  plan: NutritionPlan,
  dayIndex: number,
  mealId: string,
  locale: AppLocale = "en",
): NutritionPlan {
  const day = plan.days[dayIndex];
  if (!day) return plan;
  const mealIndex = day.meals.findIndex((m) => m.id === mealId);
  if (mealIndex < 0) return plan;

  const old = day.meals[mealIndex];
  const used = new Set(
    day.meals
      .flatMap((m) => m.foods.map((f) => f.name))
      .filter((n) => !old.foods.some((f) => f.name === n)),
  );
  // Map displayed names back to English keys when possible
  const usedKeys = new Set<string>();
  for (const name of used) {
    const match = FOODS.find((f) => f.nameEn === name || f.nameEs === name);
    usedKeys.add(match ? foodKey(match) : name);
  }

  const offset = dayIndex * 3 + mealIndex + Math.floor(Math.random() * 5);
  const names = mealNames(old.slot, locale);
  const nextMeal = buildMeal(
    old.slot,
    names[(dayIndex + mealIndex + 1) % names.length],
    composeMealFoods(old.slot, plan.intake, usedKeys, offset, locale),
  );

  const nextDays = plan.days.map((d, i) => {
    if (i !== dayIndex) return d;
    const meals = d.meals.map((m, mi) => (mi === mealIndex ? nextMeal : m));
    return { ...d, meals };
  });

  return { ...plan, days: nextDays, generatedAt: new Date().toISOString() };
}

export function nudgePlanCalories(
  plan: NutritionPlan,
  direction: "up" | "down",
  locale: AppLocale = "en",
): NutritionPlan {
  const delta = direction === "up" ? 150 : -150;
  const calories = Math.min(
    4200,
    Math.max(1600, plan.targets.calories + delta),
  );
  const protein = plan.targets.protein;
  const fat = Math.round((calories * 0.28) / 9);
  const carbs = Math.max(
    80,
    Math.round((calories - protein * 4 - fat * 9) / 4),
  );
  const goal = goalLabel(plan.intake.goal, locale);
  const es = locale === "es";
  return {
    ...plan,
    targets: { ...plan.targets, calories, carbs, fat },
    summary: es
      ? `${calories} kcal/día · ${goal} · agua ${plan.targets.waterMl} ml`
      : `${calories} kcal/day · ${goal} · water ${plan.targets.waterMl} ml`,
    recommendations: buildRecommendations(
      plan.intake,
      { ...plan.targets, calories, carbs, fat },
      locale,
    ),
    generatedAt: new Date().toISOString(),
  };
}

export function normalizeWaterDay(plan: NutritionPlan): NutritionPlan {
  const today = todayKey();
  if (plan.waterDate === today) return plan;
  return { ...plan, waterMlToday: 0, waterDate: today };
}

/** Map onboarding goal helpers when needed by older callers */
export function intakeFromProfileLike(input: {
  name: string;
  weightKg: number;
  heightCm: number;
  age: number;
  goal: OnboardingData["goal"];
  avoidFoods?: string;
  allergies?: string;
  preferences?: string;
}): NutritionIntake {
  return {
    name: input.name,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    age: input.age,
    goal: input.goal,
    avoidFoods: input.avoidFoods ?? "",
    allergies: input.allergies ?? "",
    preferences: input.preferences ?? "",
  };
}

export { mealSlotLabels, weekdayLabels };
