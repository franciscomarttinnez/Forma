"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { goalOptions } from "@/lib/validations/onboarding";
import type { NutritionIntake } from "@/lib/validations/nutrition";
import { cn } from "@/lib/utils";

type Props = {
  isFirst?: boolean;
  mode?: "create" | "edit";
  planId?: string;
  initial?: NutritionIntake;
  defaults?: {
    weightKg?: number;
    heightCm?: number;
    goal?: (typeof goalOptions)[number];
  };
};

export function NutritionForm({
  isFirst = false,
  mode = "create",
  planId,
  initial,
  defaults,
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const editing = mode === "edit" && Boolean(planId);
  const [name, setName] = useState(initial?.name ?? "");
  const [weightKg, setWeightKg] = useState(
    initial?.weightKg != null
      ? String(initial.weightKg)
      : defaults?.weightKg != null
        ? String(defaults.weightKg)
        : "",
  );
  const [heightCm, setHeightCm] = useState(
    initial?.heightCm != null
      ? String(initial.heightCm)
      : defaults?.heightCm != null
        ? String(defaults.heightCm)
        : "",
  );
  const [age, setAge] = useState(initial?.age != null ? String(initial.age) : "");
  const [goal, setGoal] = useState<(typeof goalOptions)[number]>(
    initial?.goal ?? defaults?.goal ?? "general",
  );
  const [avoidFoods, setAvoidFoods] = useState(initial?.avoidFoods ?? "");
  const [allergies, setAllergies] = useState(initial?.allergies ?? "");
  const [preferences, setPreferences] = useState(initial?.preferences ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      name: name.trim() || t.nutrition.planTitle,
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      age: Number(age),
      goal,
      avoidFoods,
      allergies,
      preferences,
      locale,
    };

    try {
      const response = await fetch(
        editing ? `/api/nutrition/${planId}` : "/api/nutrition",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.common.errorSave);
      }
      router.push(`/nutrition/${payload.plan.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.common.errorSave,
      );
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-8">
      <header className="space-y-3 text-center md:text-left">
        {editing ? (
          <Link
            href={`/nutrition/${planId}`}
            className="inline-block text-sm font-medium text-muted transition hover:text-foreground"
          >
            {t.nutrition.backToPlan}
          </Link>
        ) : null}
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
          {t.nav.nutrition}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
          {editing
            ? t.nutrition.editPlan
            : isFirst
              ? t.nutrition.firstPlan
              : t.nutrition.newPlan}
        </h1>
        <p className="text-muted">
          {editing ? t.nutrition.updateHint : t.nutrition.createHint}
        </p>
      </header>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] md:p-8"
      >
        <div>
          <Label htmlFor="nut-name">{t.nutrition.planName}</Label>
          <Input
            id="nut-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.nutrition.namePh}
            maxLength={80}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="nut-weight">{t.nutrition.weight}</Label>
            <Input
              id="nut-weight"
              type="number"
              inputMode="decimal"
              min={30}
              max={400}
              step="0.1"
              required
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="nut-height">{t.nutrition.height}</Label>
            <Input
              id="nut-height"
              type="number"
              inputMode="numeric"
              min={100}
              max={250}
              required
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="nut-age">{t.nutrition.age}</Label>
            <Input
              id="nut-age"
              type="number"
              inputMode="numeric"
              min={12}
              max={100}
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>{t.nutrition.goal}</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {goalOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setGoal(option)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left text-sm transition",
                  goal === option
                    ? "border-accent bg-accent-soft/40 text-foreground"
                    : "border-border bg-card text-muted hover:border-accent/30",
                )}
              >
                {t.goals[option]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="nut-avoid">{t.nutrition.avoid}</Label>
          <Textarea
            id="nut-avoid"
            value={avoidFoods}
            onChange={(e) => setAvoidFoods(e.target.value)}
            placeholder={t.nutrition.avoidPh}
            maxLength={500}
          />
        </div>

        <div>
          <Label htmlFor="nut-allergies">{t.nutrition.allergies}</Label>
          <Textarea
            id="nut-allergies"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder={t.nutrition.allergiesPh}
            maxLength={500}
          />
        </div>

        <div>
          <Label htmlFor="nut-prefs">{t.nutrition.preferences}</Label>
          <Textarea
            id="nut-prefs"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder={t.nutrition.prefsPh}
            maxLength={500}
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={busy} size="lg">
          {busy
            ? t.nutrition.generating
            : editing
              ? t.nutrition.saveRegenerate
              : t.nutrition.generate}
        </Button>
      </form>
    </div>
  );
}
