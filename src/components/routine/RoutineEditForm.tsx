"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import {
  equipmentOptions,
  goalOptions,
  levelOptions,
  type OnboardingData,
} from "@/lib/validations/onboarding";
import { cn } from "@/lib/utils";

type Props = {
  routineId: string;
  routineTitle: string;
  initial: OnboardingData;
};

export function RoutineEditForm({
  routineId,
  routineTitle,
  initial,
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [name, setName] = useState(routineTitle);
  const [data, setData] = useState<OnboardingData>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleEquipment(value: (typeof equipmentOptions)[number]) {
    setData((prev) => {
      const has = prev.equipment.includes(value);
      const equipment = has
        ? prev.equipment.filter((item) => item !== value)
        : [...prev.equipment, value];
      return {
        ...prev,
        equipment: equipment.length ? equipment : prev.equipment,
      };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/generate-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          name: name.trim() || routineTitle,
          replaceRoutineId: routineId,
          locale,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.routine.errorSave);
      }
      router.push(`/routine/${payload.routineId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-8">
      <header className="space-y-3 text-center md:text-left">
        <Link
          href={`/routine/${routineId}`}
          className="inline-block text-sm font-medium text-muted transition hover:text-foreground"
        >
          {t.routine.backToRoutine}
        </Link>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
          {t.nav.routine}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
          {t.routine.editTitle}
        </h1>
        <p className="text-muted">{t.routine.editSub}</p>
      </header>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] md:p-8"
      >
        <div>
          <Label htmlFor="routine-name">{t.routine.name}</Label>
          <Input
            id="routine-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
        </div>

        <div>
          <Label>{t.profile.goal}</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {goalOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setData((prev) => ({ ...prev, goal: option }))}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left text-sm transition",
                  data.goal === option
                    ? "border-accent bg-accent-soft/40"
                    : "border-border text-muted hover:border-accent/30",
                )}
              >
                {t.goals[option]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>{t.profile.level}</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {levelOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setData((prev) => ({ ...prev, level: option }))}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left text-sm transition",
                  data.level === option
                    ? "border-accent bg-accent-soft/40"
                    : "border-border text-muted hover:border-accent/30",
                )}
              >
                {t.levels[option]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="days">{t.profile.daysPerWeek}</Label>
            <Input
              id="days"
              type="number"
              min={2}
              max={6}
              required
              value={data.daysPerWeek}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  daysPerWeek: Number(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="minutes">{t.profile.sessionMinutes}</Label>
            <Input
              id="minutes"
              type="number"
              min={20}
              max={120}
              step={5}
              required
              value={data.sessionMinutes}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  sessionMinutes: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>

        <div>
          <Label>{t.profile.equipment}</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {equipmentOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleEquipment(option)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left text-sm transition",
                  data.equipment.includes(option)
                    ? "border-accent bg-accent-soft/40"
                    : "border-border text-muted hover:border-accent/30",
                )}
              >
                {t.equipment[option]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="injuries">{t.profile.injuries}</Label>
          <Textarea
            id="injuries"
            value={data.injuries}
            onChange={(e) =>
              setData((prev) => ({ ...prev, injuries: e.target.value }))
            }
            maxLength={500}
            placeholder={t.routine.injuriesPh}
          />
        </div>

        <div>
          <Label htmlFor="avoid">{t.profile.avoidExercises}</Label>
          <Textarea
            id="avoid"
            value={data.avoidExercises}
            onChange={(e) =>
              setData((prev) => ({ ...prev, avoidExercises: e.target.value }))
            }
            maxLength={500}
            placeholder={t.routine.avoidPh}
          />
        </div>

        <div>
          <Label htmlFor="prefs">{t.profile.preferences}</Label>
          <Textarea
            id="prefs"
            value={data.preferences}
            onChange={(e) =>
              setData((prev) => ({ ...prev, preferences: e.target.value }))
            }
            maxLength={500}
            placeholder={t.routine.prefsPh}
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={busy} size="lg">
          {busy ? t.routine.regenerating : t.routine.saveRegenerate}
        </Button>
      </form>
    </div>
  );
}
