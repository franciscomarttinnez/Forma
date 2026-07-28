"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n, formatMessage } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import type { ProfilePreferences } from "@/lib/profile/preferences";
import {
  equipmentOptions,
  goalOptions,
  levelOptions,
} from "@/lib/validations/onboarding";
import { cn } from "@/lib/utils";

export function ProfileView() {
  const { t } = useI18n();
  const [prefs, setPrefs] = useState<ProfilePreferences | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [heightInput, setHeightInput] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/metrics");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? t.common.errorLoad);
      setPrefs(payload.preferences);
      setDisplayName(payload.displayName);
      setHeightInput(
        payload.preferences.heightCm != null
          ? String(payload.preferences.heightCm)
          : "",
      );
      setWeightInput(
        payload.preferences.weightKg != null
          ? String(payload.preferences.weightKg)
          : "",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // Initial load only; `load` closes over t.* messages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weightDelta = useMemo(() => {
    const logs = prefs?.weightLogs ?? [];
    if (logs.length < 2) return null;
    const last = logs[logs.length - 1];
    const prev = logs[logs.length - 2];
    return last.weightKg - prev.weightKg;
  }, [prefs?.weightLogs]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/metrics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? t.common.errorSave);
      setPrefs(payload.preferences);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorSave);
    } finally {
      setSaving(false);
    }
  }

  function toggleEquipment(value: (typeof equipmentOptions)[number]) {
    if (!prefs) return;
    const exists = prefs.equipment.includes(value);
    const equipment = exists
      ? prefs.equipment.filter((item) => item !== value)
      : [...prefs.equipment, value];
    if (!equipment.length) return;
    void patch({ equipment });
  }

  if (loading || !prefs) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center text-muted">
        {t.common.loading}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2 text-center md:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
          {t.profile.eyebrow}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
          {displayName
            ? formatMessage(t.profile.hello, { name: displayName })
            : t.profile.title}
        </h1>
        <p className="text-muted">{t.profile.intro}</p>
        {savedFlash ? (
          <p className="text-sm text-success">{t.common.saved}</p>
        ) : null}
      </header>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label={t.profile.goal} value={t.goals[prefs.goal]} />
        <SummaryCard label={t.profile.level} value={t.levels[prefs.level]} />
        <SummaryCard
          label={t.profile.availability}
          value={`${prefs.daysPerWeek} · ${prefs.sessionMinutes} min`}
        />
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="font-display text-lg font-semibold">
          {t.profile.planData}
        </h2>
        <p className="mt-1 text-sm text-muted">{t.profile.intro}</p>

        <div className="mt-5 space-y-5">
          <FieldBlock title={t.profile.goal}>
            <div className="grid gap-2 sm:grid-cols-2">
              {goalOptions.map((goal) => (
                <Choice
                  key={goal}
                  selected={prefs.goal === goal}
                  label={t.goals[goal]}
                  onClick={() => void patch({ goal })}
                />
              ))}
            </div>
          </FieldBlock>

          <FieldBlock title={t.profile.level}>
            <div className="grid gap-2 sm:grid-cols-3">
              {levelOptions.map((level) => (
                <Choice
                  key={level}
                  selected={prefs.level === level}
                  label={t.levels[level]}
                  onClick={() => void patch({ level })}
                />
              ))}
            </div>
          </FieldBlock>

          <FieldBlock title={t.profile.equipment}>
            <div className="grid gap-2 sm:grid-cols-2">
              {equipmentOptions.map((item) => (
                <Choice
                  key={item}
                  selected={prefs.equipment.includes(item)}
                  label={t.equipment[item]}
                  onClick={() => toggleEquipment(item)}
                />
              ))}
            </div>
          </FieldBlock>

          <FieldBlock title={t.profile.availability}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>{t.profile.daysPerWeek}</Label>
                <div className="flex flex-wrap gap-2">
                  {[2, 3, 4, 5, 6].map((days) => (
                    <Choice
                      key={days}
                      selected={prefs.daysPerWeek === days}
                      label={`${days}`}
                      onClick={() => void patch({ daysPerWeek: days })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label>{t.profile.sessionMinutes}</Label>
                <div className="flex flex-wrap gap-2">
                  {[30, 45, 60, 75, 90].map((minutes) => (
                    <Choice
                      key={minutes}
                      selected={prefs.sessionMinutes === minutes}
                      label={`${minutes}`}
                      onClick={() => void patch({ sessionMinutes: minutes })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </FieldBlock>

          <FieldBlock title={t.profile.injuries}>
            <Textarea
              value={prefs.injuries}
              onChange={(e) =>
                setPrefs((prev) =>
                  prev ? { ...prev, injuries: e.target.value } : prev,
                )
              }
              onBlur={() => void patch({ injuries: prefs.injuries })}
            />
          </FieldBlock>

          <FieldBlock title={t.profile.avoidExercises}>
            <Textarea
              value={prefs.avoidExercises}
              onChange={(e) =>
                setPrefs((prev) =>
                  prev ? { ...prev, avoidExercises: e.target.value } : prev,
                )
              }
              onBlur={() => void patch({ avoidExercises: prefs.avoidExercises })}
            />
          </FieldBlock>

          <FieldBlock title={t.profile.preferences}>
            <Textarea
              value={prefs.preferences}
              onChange={(e) =>
                setPrefs((prev) =>
                  prev ? { ...prev, preferences: e.target.value } : prev,
                )
              }
              onBlur={() => void patch({ preferences: prefs.preferences })}
            />
          </FieldBlock>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="font-display text-lg font-semibold">
          {t.profile.measures}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="height">{t.profile.height}</Label>
            <Input
              id="height"
              type="number"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
            />
            <Button
              className="mt-2"
              size="sm"
              disabled={saving || !heightInput}
              onClick={() => void patch({ heightCm: Number(heightInput) })}
            >
              {t.common.save}
            </Button>
          </div>
          <div>
            <Label htmlFor="weight">{t.profile.weight}</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
            />
            <Button
              className="mt-2"
              size="sm"
              disabled={saving || !weightInput}
              onClick={() => {
                void patch({ logWeightKg: Number(weightInput) });
              }}
            >
              {t.profile.logWeight}
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SummaryCard
            label={t.profile.weight}
            value={prefs.weightKg != null ? `${prefs.weightKg} kg` : "—"}
          />
          <SummaryCard
            label={t.profile.weightHistory}
            value={
              weightDelta == null
                ? "—"
                : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg`
            }
          />
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card px-4 py-4 text-center shadow-[var(--shadow-soft)]">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 font-display text-lg font-semibold tracking-tight sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function FieldBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold tracking-tight">{title}</p>
      {children}
    </div>
  );
}

function Choice({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition",
        selected
          ? "border-accent bg-accent-soft text-accent-ink"
          : "border-border bg-background hover:border-accent/40",
      )}
    >
      {label}
    </button>
  );
}
