"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  formatMessage,
  useI18n,
} from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import {
  equipmentOptions,
  goalOptions,
  type OnboardingData,
} from "@/lib/validations/onboarding";
import { cn } from "@/lib/utils";

const steps = [
  "name",
  "goal",
  "level",
  "schedule",
  "equipment",
  "constraints",
  "generate",
] as const;

const initialData: OnboardingData = {
  goal: "muscle",
  level: "beginner",
  daysPerWeek: 3,
  sessionMinutes: 45,
  equipment: ["full_gym"],
  injuries: "",
  avoidExercises: "",
  preferences: "",
};

const ease = [0.22, 1, 0.36, 1] as const;

const dayOptions = [2, 3, 4, 5, 6];
const minuteOptions = [30, 45, 60, 75, 90];

function OptionCard({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-4 py-4 text-left transition",
        selected
          ? "border-accent bg-accent-soft text-accent-ink shadow-[0_8px_24px_rgb(255_166_43_/_18%)]"
          : "border-border bg-card hover:border-accent/40",
      )}
    >
      <span className="block text-sm font-semibold tracking-tight">{title}</span>
      {description ? (
        <span className="mt-1 block text-xs font-normal text-muted">
          {description}
        </span>
      ) : null}
    </motion.button>
  );
}

function Chip({
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
        "rounded-xl border px-4 py-2.5 text-sm font-medium transition",
        selected
          ? "border-accent bg-accent text-white"
          : "border-border bg-card text-foreground hover:border-accent/40",
      )}
    >
      {label}
    </button>
  );
}

export function OnboardingWizard({ mode = "first" }: { mode?: "first" | "new" }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [name, setName] = useState(
    mode === "new" ? "" : t.onboarding.defaultName,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const step = steps[stepIndex];

  function next() {
    setError(null);
    if (step === "name" && !name.trim()) {
      setError(t.onboarding.nameRequired);
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function back() {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function toggleEquipment(value: (typeof equipmentOptions)[number]) {
    setData((prev) => {
      const exists = prev.equipment.includes(value);
      const equipment = exists
        ? prev.equipment.filter((item) => item !== value)
        : [...prev.equipment, value];
      return { ...prev, equipment: equipment.length ? equipment : prev.equipment };
    });
  }

  async function generate() {
    if (!name.trim()) {
      setError(t.onboarding.nameRequired);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, name: name.trim(), locale }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.onboarding.generateError);
      }
      const routineId = payload.routineId as string | undefined;
      router.replace(routineId ? `/routine/${routineId}` : "/routine");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.onboarding.generateError,
      );
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
          {mode === "new" ? t.onboarding.newRoutine : t.onboarding.title}
        </p>
        <p className="mt-2 text-sm text-muted">
          {formatMessage(t.onboarding.stepOf, {
            current: stepIndex + 1,
            total: steps.length,
          })}
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted-bg">
          <motion.div
            className="h-full rounded-full bg-accent"
            animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.45, ease }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease }}
          className="min-h-[340px]"
        >
          {step === "name" ? (
            <StepShell
              title={t.onboarding.nameTitle}
              subtitle={t.onboarding.nameSub}
            >
              <div>
                <Label htmlFor="routine-name">{t.onboarding.nameLabel}</Label>
                <Input
                  id="routine-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.onboarding.defaultName}
                  maxLength={80}
                />
              </div>
            </StepShell>
          ) : null}

          {step === "goal" ? (
            <StepShell title={t.onboarding.goalTitle}>
              <div className="grid gap-3 sm:grid-cols-2">
                {goalOptions.map((goal) => (
                  <OptionCard
                    key={goal}
                    selected={data.goal === goal}
                    title={t.goals[goal]}
                    onClick={() => setData((prev) => ({ ...prev, goal }))}
                  />
                ))}
              </div>
            </StepShell>
          ) : null}

          {step === "level" ? (
            <StepShell title={t.onboarding.levelTitle}>
              <div className="grid gap-3">
                <OptionCard
                  selected={data.level === "beginner"}
                  title={t.levels.beginner}
                  description={t.onboarding.beginnerHint}
                  onClick={() => setData((prev) => ({ ...prev, level: "beginner" }))}
                />
                <OptionCard
                  selected={data.level === "intermediate"}
                  title={t.levels.intermediate}
                  description={t.onboarding.intermediateHint}
                  onClick={() =>
                    setData((prev) => ({ ...prev, level: "intermediate" }))
                  }
                />
                <OptionCard
                  selected={data.level === "advanced"}
                  title={t.levels.advanced}
                  description={t.onboarding.advancedHint}
                  onClick={() => setData((prev) => ({ ...prev, level: "advanced" }))}
                />
              </div>
            </StepShell>
          ) : null}

          {step === "schedule" ? (
            <StepShell title={t.onboarding.scheduleTitle}>
              <div className="space-y-6">
                <div>
                  <Label className="text-center">{t.onboarding.daysPerWeek}</Label>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {dayOptions.map((days) => (
                      <Chip
                        key={days}
                        selected={data.daysPerWeek === days}
                        label={`${days}`}
                        onClick={() =>
                          setData((prev) => ({ ...prev, daysPerWeek: days }))
                        }
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-center">
                    {t.onboarding.sessionMinutes}
                  </Label>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {minuteOptions.map((minutes) => (
                      <Chip
                        key={minutes}
                        selected={data.sessionMinutes === minutes}
                        label={`${minutes} min`}
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            sessionMinutes: minutes,
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </StepShell>
          ) : null}

          {step === "equipment" ? (
            <StepShell title={t.onboarding.equipmentTitle}>
              <div className="grid gap-3 sm:grid-cols-2">
                {equipmentOptions.map((item) => (
                  <OptionCard
                    key={item}
                    selected={data.equipment.includes(item)}
                    title={t.equipment[item]}
                    onClick={() => toggleEquipment(item)}
                  />
                ))}
              </div>
            </StepShell>
          ) : null}

          {step === "constraints" ? (
            <StepShell title={t.onboarding.constraintsTitle}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="injuries">{t.onboarding.injuries}</Label>
                  <Textarea
                    id="injuries"
                    value={data.injuries}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, injuries: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="avoid">{t.onboarding.avoidExercises}</Label>
                  <Textarea
                    id="avoid"
                    value={data.avoidExercises}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        avoidExercises: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="prefs">{t.onboarding.preferences}</Label>
                  <Textarea
                    id="prefs"
                    value={data.preferences}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        preferences: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </StepShell>
          ) : null}

          {step === "generate" ? (
            <StepShell title={t.onboarding.generateTitle}>
              {loading ? (
                <div className="rounded-3xl border border-border bg-card p-8">
                  <motion.div
                    className="mx-auto h-12 w-12 rounded-full border-2 border-accent/30 border-t-accent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                  />
                  <p className="mt-5 font-display text-lg font-semibold">
                    {t.onboarding.designing}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {t.onboarding.generating}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-muted-bg/60 p-5 text-left text-sm text-muted">
                  <p>
                    <span className="font-medium text-foreground">
                      {t.onboarding.objective}:
                    </span>{" "}
                    {t.goals[data.goal]}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium text-foreground">
                      {t.onboarding.level}:
                    </span>{" "}
                    {t.levels[data.level]}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium text-foreground">
                      {t.onboarding.frequency}:
                    </span>{" "}
                    {formatMessage(t.onboarding.days, { n: data.daysPerWeek })} ·{" "}
                    {data.sessionMinutes} min
                  </p>
                  <p className="mt-2">
                    <span className="font-medium text-foreground">
                      {t.profile.equipment}:
                    </span>{" "}
                    {data.equipment.map((e) => t.equipment[e]).join(", ")}
                  </p>
                </div>
              )}
            </StepShell>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {!loading ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            onClick={back}
            disabled={stepIndex === 0 || loading}
          >
            {t.common.back}
          </Button>
          {step === "generate" ? (
            <Button onClick={generate} disabled={loading}>
              {t.onboarding.generate}
            </Button>
          ) : (
            <Button onClick={next}>{t.common.continue}</Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
        {title}
      </h1>
      {subtitle ? <p className="mt-3 text-muted">{subtitle}</p> : null}
      <div className="mt-8 text-left">{children}</div>
    </div>
  );
}
