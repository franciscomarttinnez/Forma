"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatMessage,
  useI18n,
} from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { PRIMARY_MUSCLES, formatMuscles, muscleLabel } from "@/lib/exercises/muscles";
import type { LibraryExercise } from "@/lib/exercises/search";
import { cn } from "@/lib/utils";

type RoutineOption = {
  id: string;
  title: string;
  days: { id: string; name: string; dayIndex: number; focus: string }[];
};

const MUSCLE_CHIPS = [...PRIMARY_MUSCLES, "Cardio"] as const;
const VISIBLE_MUSCLES = MUSCLE_CHIPS.slice(0, 6);
const MORE_MUSCLES = MUSCLE_CHIPS.slice(6);
const ease = [0.22, 1, 0.36, 1] as const;

function useDebounced<T>(value: T, delay = 320) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function LibraryView() {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query);
  const [muscle, setMuscle] = useState<string | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [results, setResults] = useState<LibraryExercise[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [attribution, setAttribution] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<LibraryExercise | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [routines, setRoutines] = useState<RoutineOption[]>([]);
  const [routinesLoading, setRoutinesLoading] = useState(false);
  const [routineId, setRoutineId] = useState<string | null>(null);
  const [dayId, setDayId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const selectedRoutine = useMemo(
    () => routines.find((r) => r.id === routineId) ?? null,
    [routines, routineId],
  );

  const loadPage = useCallback(
    async (opts?: { cursor?: string | null; append?: boolean }) => {
      const append = Boolean(opts?.append);
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
        if (muscle) params.set("muscle", muscle);
        if (opts?.cursor) params.set("cursor", opts.cursor);
        params.set("limit", "24");

        const response = await fetch(`/api/exercises/library?${params}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? t.library.loadError);
        }

        setResults((prev) =>
          append
            ? dedupeByName([...prev, ...(payload.results ?? [])])
            : (payload.results ?? []),
        );
        setNextCursor(payload.nextCursor ?? null);
        setHasNextPage(Boolean(payload.hasNextPage));
        setAttribution(payload.attribution ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.library.loadError);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedQuery, muscle, t.library.loadError],
  );

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  async function openDetail(item: LibraryExercise) {
    setSelected(item);
    setAddSuccess(null);
    if (item.instructions.length && item.source === "exercisedb") return;

    setDetailLoading(true);
    try {
      const response = await fetch(
        `/api/exercises/library?id=${encodeURIComponent(item.id)}`,
      );
      const payload = await response.json();
      if (response.ok && payload.exercise) {
        setSelected(payload.exercise);
      }
    } catch {
      // keep list item as-is
    } finally {
      setDetailLoading(false);
    }
  }

  async function openAddFlow() {
    if (!selected) return;
    setAddOpen(true);
    setAddSuccess(null);
    setRoutinesLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/routines");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? t.library.loadError);
      const list = (payload.routines ?? []) as RoutineOption[];
      setRoutines(list);
      const active = list.find((r) => (r as { active?: boolean }).active) ?? list[0];
      setRoutineId(active?.id ?? null);
      setDayId(active?.days[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.library.loadError);
    } finally {
      setRoutinesLoading(false);
    }
  }

  async function confirmAdd() {
    if (!selected || !dayId) return;
    setAdding(true);
    setError(null);
    setAddSuccess(null);
    try {
      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId,
          name: selected.name,
          muscles: selected.muscles.length ? selected.muscles : ["General"],
          demo_url: selected.demoUrl,
          sets: 3,
          reps: "8-12",
          rest_seconds: 90,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? t.library.addError);

      const routineTitle = selectedRoutine?.title ?? t.library.yourRoutine;
      const dayName =
        selectedRoutine?.days.find((d) => d.id === dayId)?.name ??
        t.library.theDay;
      setAddSuccess(
        formatMessage(t.library.addedTo, {
          day: dayName,
          routine: routineTitle,
        }),
      );
      setAddOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.library.addError);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-3 text-center md:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
          {t.nav.library}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
          {t.library.title}
        </h1>
        <p className="text-muted">
          {t.library.sub}
        </p>
      </header>

      <div className="space-y-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.library.search}
          aria-label={t.library.search}
        />

        <div className="flex flex-wrap justify-center gap-2">
          <FilterChip
            label={t.library.all}
            active={muscle === null}
            onClick={() => setMuscle(null)}
          />
          {VISIBLE_MUSCLES.map((chip) => (
            <FilterChip
              key={chip}
              label={muscleLabel(chip, locale)}
              active={muscle === chip}
              onClick={() => setMuscle(chip === muscle ? null : chip)}
            />
          ))}
          {!filtersExpanded &&
          muscle &&
          MORE_MUSCLES.includes(muscle as (typeof MORE_MUSCLES)[number]) ? (
            <FilterChip
              label={muscleLabel(muscle, locale)}
              active
              onClick={() => setMuscle(null)}
            />
          ) : null}
          {filtersExpanded
            ? MORE_MUSCLES.map((chip) => (
                <FilterChip
                  key={chip}
                  label={muscleLabel(chip, locale)}
                  active={muscle === chip}
                  onClick={() => setMuscle(chip === muscle ? null : chip)}
                />
              ))
            : null}
          {MORE_MUSCLES.length ? (
            <button
              type="button"
              aria-expanded={filtersExpanded}
              aria-label={
                filtersExpanded ? t.library.lessFilters : t.library.moreFilters
              }
              onClick={() => setFiltersExpanded((open) => !open)}
              className={cn(
                "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition",
                filtersExpanded
                  ? "border-accent/40 bg-accent-soft/50 text-accent"
                  : "border-border bg-card text-muted hover:border-accent/30 hover:text-foreground",
              )}
            >
              {filtersExpanded ? "−" : "+"}
            </button>
          ) : null}
        </div>
      </div>

      {error && !selected ? (
        <p className="text-sm text-danger">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">{t.common.loading}</p>
      ) : results.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-[var(--shadow-soft)]">
          <p className="font-display text-lg font-semibold">{t.library.empty}</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void openDetail(item)}
                className="flex w-full gap-3 rounded-3xl border border-border bg-card p-3 text-left shadow-[var(--shadow-soft)] transition hover:border-accent/35"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted-bg">
                  {item.demoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.demoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 py-1">
                  <p className="font-display text-base font-semibold leading-snug">
                    {item.name}
                  </p>
                  <p className="mt-1 truncate text-sm text-muted">
                    {formatMuscles(item.muscles, locale) ||
                      muscleLabel("General", locale)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && nextCursor && !debouncedQuery.trim() ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            disabled={loadingMore}
            onClick={() => void loadPage({ cursor: nextCursor, append: true })}
          >
            {loadingMore ? t.common.loading : t.library.seeMore}
          </Button>
        </div>
      ) : null}

      {attribution ? (
        <p className="text-center text-xs text-muted">{attribution}</p>
      ) : null}

      <AnimatePresence>
        {selected ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setSelected(null);
              setAddOpen(false);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.35, ease }}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                    {selected.muscles[0]
                      ? muscleLabel(selected.muscles[0], locale)
                      : t.library.exerciseFallback}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                    {selected.name}
                  </h2>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelected(null);
                    setAddOpen(false);
                  }}
                >
                  {t.common.close}
                </Button>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl bg-muted-bg">
                {selected.demoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.demoUrl}
                    alt={formatMessage(t.library.demoOf, {
                      name: selected.name,
                    })}
                    className="aspect-video w-full object-contain bg-black/5"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center text-sm text-muted">
                    {detailLoading
                      ? t.library.loadingDemo
                      : t.library.noAnimation}
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm text-muted">
                {formatMuscles(selected.muscles, locale)}
                {selected.equipment.length
                  ? ` · ${selected.equipment.join(", ")}`
                  : null}
              </p>

              {selected.instructions.length ? (
                <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted">
                  {selected.instructions.map((step) => (
                    <li key={step}>{step.replace(/^Step:\d+\s*/i, "")}</li>
                  ))}
                </ol>
              ) : null}

              {addSuccess ? (
                <p className="mt-4 text-sm text-success">{addSuccess}</p>
              ) : null}
              {error && selected ? (
                <p className="mt-4 text-sm text-danger">{error}</p>
              ) : null}

              {!addOpen ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button onClick={() => void openAddFlow()}>
                    {t.library.addToRoutine}
                  </Button>
                </div>
              ) : (
                <div className="mt-6 space-y-4 rounded-2xl border border-border bg-background/60 p-4">
                  <p className="font-display text-lg font-semibold">
                    {t.library.pickRoutine}
                  </p>

                  {routinesLoading ? (
                    <p className="text-sm text-muted">{t.common.loading}</p>
                  ) : routines.length === 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted">
                        {t.routine.empty}
                      </p>
                      <Link href="/onboarding?new=1">
                        <Button size="sm">{t.routine.createFirst}</Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="lib-routine">{t.library.pickRoutine}</Label>
                        <select
                          id="lib-routine"
                          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                          value={routineId ?? ""}
                          onChange={(e) => {
                            const id = e.target.value;
                            setRoutineId(id);
                            const next = routines.find((r) => r.id === id);
                            setDayId(next?.days[0]?.id ?? null);
                          }}
                        >
                          {routines.map((routine) => (
                            <option key={routine.id} value={routine.id}>
                              {routine.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="lib-day">{t.library.pickDay}</Label>
                        <select
                          id="lib-day"
                          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                          value={dayId ?? ""}
                          onChange={(e) => setDayId(e.target.value)}
                          disabled={!selectedRoutine?.days.length}
                        >
                          {(selectedRoutine?.days ?? []).map((day) => (
                            <option key={day.id} value={day.id}>
                              {day.name}
                              {day.focus ? ` · ${day.focus}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <p className="text-xs text-muted">
                        Se agrega con 3 series · 8-12 reps · 90s de descanso.
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          disabled={adding || !dayId}
                          onClick={() => void confirmAdd()}
                        >
                          {adding ? t.library.adding : t.library.confirmAdd}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={adding}
                          onClick={() => setAddOpen(false)}
                        >
                          {t.common.cancel}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-sm font-medium transition",
        active
          ? "border-accent bg-accent text-white"
          : "border-border bg-card text-muted hover:border-accent/30",
      )}
    >
      {label}
    </button>
  );
}

function dedupeByName(items: LibraryExercise[]) {
  const seen = new Set<string>();
  const result: LibraryExercise[] = [];
  for (const item of items) {
    const key = item.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}
