"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatMessage,
  useI18n,
} from "@/components/providers/I18nProvider";
import { NutritionCoachChat } from "@/components/nutrition/NutritionCoachChat";
import { Button } from "@/components/ui/Button";
import {
  type MealSlot,
  type NutritionPlan,
} from "@/lib/validations/nutrition";
import { cn } from "@/lib/utils";

type Props = {
  plan: NutritionPlan;
};

function mondayIndexToday() {
  const js = new Date().getDay();
  return js === 0 ? 6 : js - 1;
}

export function NutritionPlanView({ plan: initial }: Props) {
  const { t } = useI18n();
  const weekdayLabels = Object.values(t.weekdays);
  const [plan, setPlan] = useState(initial);
  const [syncedInitial, setSyncedInitial] = useState(initial);
  if (initial !== syncedInitial) {
    setSyncedInitial(initial);
    setPlan(initial);
  }
  const [dayIndex, setDayIndex] = useState(mondayIndexToday);
  const [waterBusy, setWaterBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMealId, setOpenMealId] = useState<string | null>(null);

  const day = plan.days[dayIndex] ?? plan.days[0];
  const waterPct = useMemo(
    () =>
      Math.min(100, Math.round((plan.waterMlToday / plan.targets.waterMl) * 100)),
    [plan.waterMlToday, plan.targets.waterMl],
  );

  async function addWater(amountMl: number) {
    setWaterBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/nutrition/water", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMl, planId: plan.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? t.nutrition.errorWater);
      setPlan(payload.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.nutrition.errorWater);
    } finally {
      setWaterBusy(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl space-y-8 pb-24">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/nutrition"
            className="text-sm font-medium text-muted transition hover:text-foreground"
          >
            {t.nutrition.backToPlans}
          </Link>
          <Link href={`/nutrition/${plan.id}/edit`}>
            <Button size="sm" variant="secondary">
              {t.nutrition.editData}
            </Button>
          </Link>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
          {t.nutrition.planTitle}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
          {plan.title}
        </h1>
        <p className="text-muted">
          {t.goals[plan.intake.goal]} · {plan.intake.weightKg} kg ·{" "}
          {plan.intake.heightCm} cm ·{" "}
          {formatMessage(t.nutrition.yearsOld, { n: plan.intake.age })}
        </p>
        {(plan.intake.avoidFoods.trim() || plan.intake.allergies.trim()) && (
          <p className="text-sm text-muted">
            {plan.intake.allergies.trim()
              ? `${t.nutrition.allergiesLabel}: ${plan.intake.allergies.trim()}`
              : null}
            {plan.intake.allergies.trim() && plan.intake.avoidFoods.trim()
              ? " · "
              : null}
            {plan.intake.avoidFoods.trim()
              ? `${t.nutrition.avoids}: ${plan.intake.avoidFoods.trim()}`
              : null}
          </p>
        )}
      </header>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            {t.nutrition.dailyCals}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-accent">
            {plan.targets.calories}
            <span className="ml-1 text-base font-medium text-muted">kcal</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            P {plan.targets.protein}g · C {plan.targets.carbs}g · G{" "}
            {plan.targets.fat}g
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            {t.nutrition.waterToday}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold">
            {plan.waterMlToday}
            <span className="ml-1 text-base font-medium text-muted">
              / {plan.targets.waterMl} ml
            </span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted-bg">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${waterPct}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[250, 500].map((ml) => (
              <Button
                key={ml}
                size="sm"
                variant="secondary"
                disabled={waterBusy}
                onClick={() => void addWater(ml)}
              >
                +{ml} ml
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              disabled={waterBusy || plan.waterMlToday <= 0}
              onClick={() => void addWater(-250)}
            >
              −250
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold">
            {t.nutrition.weekMeals}
          </h2>
          <p className="mt-1 text-sm text-muted">{t.nutrition.weekMealsSub}</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {plan.days.map((d) => (
            <button
              key={d.dayIndex}
              type="button"
              onClick={() => {
                setDayIndex(d.dayIndex);
                setOpenMealId(null);
              }}
              className={cn(
                "shrink-0 rounded-xl border px-3 py-2 text-sm font-medium transition",
                dayIndex === d.dayIndex
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-card text-muted hover:border-accent/30",
              )}
            >
              {(weekdayLabels[d.dayIndex] ?? d.name).slice(0, 3)}
            </button>
          ))}
        </div>

        <p className="font-display text-lg font-semibold">
          {weekdayLabels[day.dayIndex] ?? day.name}
        </p>

        <ul className="grid gap-3">
          {day.meals.map((meal) => {
            const open = openMealId === meal.id;
            return (
              <li key={meal.id}>
                <button
                  type="button"
                  onClick={() => setOpenMealId(open ? null : meal.id)}
                  className="w-full rounded-3xl border border-border bg-card px-5 py-4 text-left shadow-[var(--shadow-soft)] transition hover:border-accent/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-accent">
                        {t.meals[meal.slot]}
                      </p>
                      <p className="mt-1 font-display text-lg font-semibold">
                        {meal.name}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {Math.round(meal.calories)} kcal · P{" "}
                        {Math.round(meal.protein)}g
                      </p>
                    </div>
                    <span className="text-sm text-muted">{open ? "−" : "+"}</span>
                  </div>
                  {open ? (
                    <ul className="mt-4 space-y-2 border-t border-border pt-4">
                      {meal.foods.map((food) => (
                        <li
                          key={`${meal.id}-${food.name}`}
                          className="flex items-baseline justify-between gap-3 text-sm"
                        >
                          <span>
                            {food.name}{" "}
                            <span className="text-muted">· {food.amount}</span>
                          </span>
                          <span className="shrink-0 text-muted">
                            {food.calories} kcal
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="font-display text-xl font-semibold">
          {t.nutrition.recommendations}
        </h2>
        <ul className="mt-4 space-y-3">
          {plan.recommendations.map((tip) => (
            <li key={tip} className="flex gap-3 text-sm text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <NutritionCoachChat
        planId={plan.id}
        days={plan.days.map((d) => ({
          dayIndex: d.dayIndex,
          name: d.name,
          meals: d.meals.map((meal) => ({
            id: meal.id,
            slot: meal.slot as MealSlot,
            name: meal.name,
          })),
        }))}
      />
    </div>
  );
}
