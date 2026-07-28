"use client";

import { AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n, formatMessage } from "@/components/providers/I18nProvider";
import { CoachChat } from "@/components/routine/CoachChat";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { formatMuscles, muscleLabel } from "@/lib/exercises/muscles";
import type { Exercise, RoutineWithDays } from "@/types/database";
import { cn } from "@/lib/utils";

type Props = {
  routine: RoutineWithDays;
};

type MediaPayload = {
  gifUrl: string | null;
  instructions: string[];
  attribution?: string;
};

type EditPanel = {
  exercise: Exercise;
};

type SwapCandidate = {
  id: string;
  name: string;
  muscles: string[];
  demoUrl: string | null;
  source: "local" | "exercisedb";
};

const ease = [0.22, 1, 0.36, 1] as const;

export function RoutineView({ routine }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [days, setDays] = useState(routine.days);
  const [openDayId, setOpenDayId] = useState<string | null>(
    routine.days[0]?.id ?? null,
  );
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [editPanel, setEditPanel] = useState<EditPanel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [media, setMedia] = useState<MediaPayload | null>(null);
  const latestOrderRef = useRef<Record<string, Exercise[]>>({});
  const [mediaLoading, setMediaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [swapQuery, setSwapQuery] = useState("");
  const [swapResults, setSwapResults] = useState<SwapCandidate[]>([]);
  const [swapMode, setSwapMode] = useState<"recommend" | "search">("recommend");
  const [swapPrimary, setSwapPrimary] = useState<string | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(routine.title);

  useEffect(() => {
    setDays(routine.days);
    setTitleDraft(routine.title);
  }, [routine]);

  useEffect(() => {
    setOpenDayId(routine.days[0]?.id ?? null);
    setSelected(null);
    setEditPanel(null);
    setDeleteTarget(null);
    // Reset panels when switching routines, not on every days refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine.id]);

  const usedNames = useMemo(
    () => days.flatMap((day) => day.exercises.map((exercise) => exercise.name)),
    [days],
  );

  useEffect(() => {
    if (!editPanel) {
      setSwapQuery("");
      setSwapResults([]);
      setSwapPrimary(null);
      return;
    }

    const exercise = editPanel.exercise;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        setSwapLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams();
          const q = swapQuery.trim();
          if (q.length >= 2) params.set("q", q);
          params.set("name", exercise.name);
          params.set("muscles", exercise.muscles.join("|"));
          params.set("exclude", usedNames.join("|"));

          const response = await fetch(`/api/exercises/search?${params}`, {
            signal: controller.signal,
          });
          const payload = await response.json();
          if (!response.ok) {
            throw new Error(payload.error ?? t.routine.errorSearch);
          }
          setSwapResults((payload.results as SwapCandidate[]) ?? []);
          setSwapMode(payload.mode === "search" ? "search" : "recommend");
          setSwapPrimary(payload.primaryMuscle ?? exercise.muscles[0] ?? null);
        } catch (err) {
          if (controller.signal.aborted) return;
          setError(err instanceof Error ? err.message : t.routine.errorSearch);
        } finally {
          if (!controller.signal.aborted) setSwapLoading(false);
        }
      })();
    }, swapQuery.trim().length >= 2 ? 280 : 0);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [editPanel, swapQuery, usedNames, t.routine.errorSearch]);

  useEffect(() => {
    if (!selected) {
      setMedia(null);
      return;
    }

    let cancelled = false;
    setMediaLoading(true);

    const localDemo = selected.demo_url?.startsWith("/api/exercises/gif")
      ? selected.demo_url
      : null;

    setMedia(localDemo ? { gifUrl: localDemo, instructions: [] } : null);

    void (async () => {
      try {
        const response = await fetch(
          `/api/exercises/lookup?name=${encodeURIComponent(selected.name)}`,
        );
        const payload = await response.json();
        if (cancelled) return;
        if (payload.exercise?.gifUrl) {
          setMedia({
            gifUrl: payload.exercise.gifUrl,
            instructions: payload.exercise.instructions ?? [],
            attribution: payload.exercise.attribution,
          });
        } else {
          setMedia(null);
        }
      } catch {
        if (!cancelled && !localDemo) setMedia(null);
      } finally {
        if (!cancelled) setMediaLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected]);

  async function saveExercise(updates: Partial<Exercise>) {
    if (!selected) return;
    setSaveState("saving");
    setError(null);

    try {
      const response = await fetch("/api/exercises", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, ...updates }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.common.errorSave);
      }
      setSelected(payload.exercise);
      setSaveState("saved");
      router.refresh();
      setTimeout(() => setSaveState("idle"), 1200);
    } catch (err) {
      setSaveState("idle");
      setError(err instanceof Error ? err.message : t.common.errorSave);
    }
  }

  async function swapExercise(
    exercise: Exercise,
    next: { name: string; muscles: string[]; demoUrl: string | null },
  ) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/exercises", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: exercise.id,
          name: next.name,
          muscles: next.muscles,
          demo_url: next.demoUrl,
          notes: formatMessage(t.routine.swappedFor, { name: next.name }),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.routine.errorSwap);
      }
      setEditPanel(null);
      if (selected?.id === exercise.id) setSelected(payload.exercise);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.routine.errorSwap);
    } finally {
      setBusy(false);
    }
  }

  async function deleteExercise(exercise: Exercise) {
    const day = days.find((item) => item.id === exercise.day_id);
    if ((day?.exercises.length ?? 0) <= 1) {
      setError(t.routine.errorNeedExercise);
      setDeleteTarget(null);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/exercises", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: exercise.id }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.routine.errorDelete);
      }
      setDeleteTarget(null);
      setEditPanel(null);
      if (selected?.id === exercise.id) setSelected(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.routine.errorDelete);
    } finally {
      setBusy(false);
    }
  }

  async function persistOrder(dayId: string, exercises: Exercise[]) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/exercises/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId,
          exerciseIds: exercises.map((item) => item.id),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.routine.errorReorder);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.routine.errorReorder);
      setDays(routine.days);
    } finally {
      setBusy(false);
    }
  }

  function handleReorder(dayId: string, nextExercises: Exercise[]) {
    latestOrderRef.current[dayId] = nextExercises;
    setDays((prev) =>
      prev.map((item) =>
        item.id === dayId ? { ...item, exercises: nextExercises } : item,
      ),
    );
  }

  function finishReorder(dayId: string) {
    const next = latestOrderRef.current[dayId];
    if (!next) return;
    void persistOrder(dayId, next);
  }

  async function saveTitle() {
    const next = titleDraft.trim();
    if (!next || next === routine.title) {
      setRenaming(false);
      setTitleDraft(routine.title);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/routines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routineId: routine.id,
          action: "rename",
          title: next,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? t.routine.errorRename);
      setRenaming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.routine.errorRename);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/routine">
          <Button
            variant="secondary"
            size="md"
            className="h-11 px-4 text-sm font-semibold sm:h-12 sm:px-5 sm:text-base"
          >
            {t.routine.backToList}
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/routine/${routine.id}/edit`}>
            <Button size="sm" variant="secondary" disabled={busy || renaming}>
              {t.routine.editData}
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRenaming(true)}
            disabled={busy || renaming}
          >
            {t.routine.rename}
          </Button>
        </div>
      </div>

      <header className="space-y-4 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
          {t.routine.yourPlan}
        </p>

        {renaming ? (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-2 sm:flex-row">
            <Input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="text-center font-display text-xl font-semibold"
              maxLength={80}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" disabled={busy} onClick={() => void saveTitle()}>
                {t.common.save}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setRenaming(false);
                  setTitleDraft(routine.title);
                }}
              >
                {t.common.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            {routine.title}
          </h1>
        )}

        <p className="mx-auto max-w-xl text-muted">{routine.summary}</p>

        {routine.ai_rationale ? (
          <p className="mx-auto max-w-xl rounded-2xl border border-border bg-card/80 px-4 py-3 text-left text-sm leading-relaxed text-muted">
            <span className="font-medium text-foreground">
              {t.routine.whyPlan}:{" "}
            </span>
            {routine.ai_rationale}
          </p>
        ) : null}
      </header>

      {error ? (
        <p className="text-center text-sm text-danger">{error}</p>
      ) : null}

      <section className="space-y-3">
        {days.map((day, index) => {
          const open = openDayId === day.id;
          return (
            <div
              key={day.id}
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]"
            >
              <button
                type="button"
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-muted-bg/50"
                onClick={() => setOpenDayId(open ? null : day.id)}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft font-display text-sm font-semibold text-accent-ink">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold tracking-tight">
                    {day.name}
                  </p>
                  <p className="truncate text-sm text-muted">{day.focus}</p>
                </div>
                <span className="text-xs text-muted">
                  {day.exercises.length} {t.routine.exampleAbbr}
                </span>
                <ChevronIcon
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted transition duration-300",
                    open && "rotate-180 text-accent",
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease }}
                    className="border-t border-border"
                  >
                    <Reorder.Group
                      as="ul"
                      axis="y"
                      values={day.exercises}
                      onReorder={(next) => handleReorder(day.id, next)}
                      className="divide-y divide-border"
                    >
                      {day.exercises.map((exercise) => (
                        <DayExerciseRow
                          key={exercise.id}
                          exercise={exercise}
                          disabled={busy}
                          onOpen={() => setSelected(exercise)}
                          onEdit={() => setEditPanel({ exercise })}
                          onDelete={() => setDeleteTarget(exercise)}
                          onDragEnd={() => finishReorder(day.id)}
                        />
                      ))}
                    </Reorder.Group>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </section>

      <p className="text-center text-xs text-muted">{t.routine.gifCredit}</p>

      <CoachChat
        routineId={routine.id}
        days={days.map((day) => ({
          dayIndex: day.day_index,
          name: day.name,
          exercises: day.exercises.map((exercise) => ({ name: exercise.name })),
        }))}
      />

      <AnimatePresence>
        {editPanel ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !busy && setEditPanel(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ duration: 0.25, ease }}
              className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
                    {t.routine.swap}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                    {editPanel.exercise.name}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => setEditPanel(null)}
                >
                  {t.common.close}
                </Button>
              </div>

              <div className="mt-5">
                <Label htmlFor="swap-search">{t.routine.searchExercise}</Label>
                <Input
                  id="swap-search"
                  value={swapQuery}
                  onChange={(e) => setSwapQuery(e.target.value)}
                  placeholder={t.routine.searchPlaceholder}
                  className="mt-1"
                  autoFocus
                />
                <p className="mt-2 text-xs text-muted">
                  {swapMode === "search"
                    ? t.routine.searchResultsHint
                    : swapPrimary
                      ? formatMessage(t.routine.recommendFor, {
                          muscle: muscleLabel(swapPrimary, locale),
                        })
                      : t.routine.recommendDefault}
                </p>

                <div className="mt-3 grid gap-1.5">
                  {swapLoading ? (
                    <p className="rounded-xl bg-muted-bg px-3 py-3 text-sm text-muted">
                      {t.routine.searching}
                    </p>
                  ) : null}
                  {!swapLoading &&
                    swapResults.map((alt, i) => (
                      <motion.button
                        key={alt.id}
                        type="button"
                        disabled={busy}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.02 * i,
                          duration: 0.2,
                          ease,
                        }}
                        onClick={() =>
                          void swapExercise(editPanel.exercise, {
                            name: alt.name,
                            muscles: alt.muscles,
                            demoUrl: alt.demoUrl,
                          })
                        }
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3.5 py-3 text-left transition hover:border-accent/45 hover:bg-accent-soft/50 disabled:opacity-60"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold tracking-tight">
                            {alt.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {formatMuscles(alt.muscles, locale)}
                            <span className="mx-1.5 text-border">·</span>
                            {alt.source === "exercisedb"
                              ? t.routine.sourceExerciseDb
                              : t.routine.sourceLocal}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-medium text-accent">
                          {t.routine.use}
                        </span>
                      </motion.button>
                    ))}
                  {!swapLoading && !swapResults.length ? (
                    <p className="rounded-xl bg-muted-bg px-3 py-3 text-sm text-muted">
                      {swapQuery.trim().length >= 2
                        ? t.routine.noSearchResults
                        : t.routine.noRecommendations}
                    </p>
                  ) : null}
                </div>
              </div>

              {busy ? (
                <p className="mt-4 text-center text-xs text-muted">
                  {t.routine.saving}
                </p>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !busy && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-display text-xl font-semibold">
                {t.routine.deleteExerciseConfirm}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {formatMessage(t.routine.deleteExerciseBody, {
                  name: deleteTarget.name,
                })}
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setDeleteTarget(null)}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  disabled={busy}
                  className="bg-danger hover:bg-danger"
                  onClick={() => void deleteExercise(deleteTarget)}
                >
                  {busy ? t.routine.deleting : t.common.delete}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selected ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight">
                    {selected.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.muscles.map((muscle) => (
                      <span
                        key={muscle}
                        className="rounded-lg bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-ink"
                      >
                        {muscleLabel(muscle, locale)}
                      </span>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  {t.common.close}
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditPanel({ exercise: selected });
                    setSelected(null);
                  }}
                >
                  {t.routine.swap}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:text-danger"
                  onClick={() => {
                    setDeleteTarget(selected);
                    setSelected(null);
                  }}
                >
                  {t.common.delete}
                </Button>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-muted-bg">
                {media?.gifUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media.gifUrl}
                    alt={formatMessage(t.routine.demoOf, {
                      name: selected.name,
                    })}
                    className="aspect-video w-full object-contain bg-black/5"
                  />
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-1 px-4 text-center text-sm text-muted">
                    <span className="font-medium text-foreground/70">
                      {mediaLoading
                        ? t.routine.lookingDemo
                        : t.routine.noGif}
                    </span>
                    <span>{t.routine.gifOnlyVerified}</span>
                  </div>
                )}
              </div>

              {media?.instructions?.length ? (
                <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-left text-sm text-muted">
                  {media.instructions.slice(0, 6).map((step) => (
                    <li key={step}>{step.replace(/^Step:\d+\s*/i, "")}</li>
                  ))}
                </ol>
              ) : null}

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="sets">{t.routine.sets}</Label>
                  <Input
                    id="sets"
                    type="number"
                    min={1}
                    max={10}
                    value={selected.sets}
                    onChange={(e) =>
                      setSelected({
                        ...selected,
                        sets: Number(e.target.value),
                      })
                    }
                    onBlur={() => saveExercise({ sets: selected.sets })}
                  />
                </div>
                <div>
                  <Label htmlFor="reps">{t.routine.reps}</Label>
                  <Input
                    id="reps"
                    value={selected.reps}
                    onChange={(e) =>
                      setSelected({ ...selected, reps: e.target.value })
                    }
                    onBlur={() => saveExercise({ reps: selected.reps })}
                  />
                </div>
                <div>
                  <Label htmlFor="rest">{t.routine.rest}</Label>
                  <Input
                    id="rest"
                    type="number"
                    min={0}
                    max={600}
                    value={selected.rest_seconds}
                    onChange={(e) =>
                      setSelected({
                        ...selected,
                        rest_seconds: Number(e.target.value),
                      })
                    }
                    onBlur={() =>
                      saveExercise({ rest_seconds: selected.rest_seconds })
                    }
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="notes">{t.routine.notes}</Label>
                <Textarea
                  id="notes"
                  value={selected.notes}
                  onChange={(e) =>
                    setSelected({ ...selected, notes: e.target.value })
                  }
                  onBlur={() => saveExercise({ notes: selected.notes })}
                />
              </div>

              <p className="mt-3 text-xs text-muted">
                {saveState === "saving"
                  ? t.routine.saving
                  : saveState === "saved"
                    ? t.routine.saved
                    : t.routine.autosaveHint}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DayExerciseRow({
  exercise,
  disabled,
  onOpen,
  onEdit,
  onDelete,
  onDragEnd,
}: {
  exercise: Exercise;
  disabled?: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragEnd: () => void;
}) {
  const { t } = useI18n();
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={exercise}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 12px 32px rgb(18 18 18 / 12%)",
        zIndex: 20,
        backgroundColor: "var(--card)",
      }}
      transition={{ layout: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
      className="relative flex items-stretch gap-1 bg-card px-2 py-1 sm:px-3"
    >
      <button
        type="button"
        disabled={disabled}
        className="flex cursor-grab touch-none items-center px-1 text-muted transition active:cursor-grabbing disabled:cursor-not-allowed"
        title={t.routine.dragReorder}
        aria-label={t.routine.dragReorder}
        onPointerDown={(e) => {
          if (disabled) return;
          controls.start(e);
        }}
      >
        <DragHandleIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="min-w-0 flex-1 rounded-2xl px-2 py-3 text-left transition hover:bg-muted-bg/70 sm:px-3"
        onClick={onOpen}
      >
        <p className="font-medium tracking-tight">{exercise.name}</p>
        <p className="mt-1 text-sm text-muted">
          {exercise.sets} × {exercise.reps}
          <span className="mx-1.5 text-border">·</span>
          {exercise.rest_seconds}s
        </p>
      </button>
      <div className="flex shrink-0 items-center gap-0.5 pr-1">
        <button
          type="button"
          disabled={disabled}
          className="rounded-xl px-2.5 py-2 text-sm font-medium text-muted transition hover:bg-muted-bg hover:text-foreground"
          onClick={onEdit}
        >
          {t.routine.edit}
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label={formatMessage(t.routine.deleteNamed, {
            name: exercise.name,
          })}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-danger transition hover:bg-danger/10"
          onClick={onDelete}
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <circle cx="5" cy="4" r="1.2" />
      <circle cx="11" cy="4" r="1.2" />
      <circle cx="5" cy="8" r="1.2" />
      <circle cx="11" cy="8" r="1.2" />
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="11" cy="12" r="1.2" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
