"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Label, Textarea } from "@/components/ui/Input";
import {
  computeStreaks,
  isFutureDate,
  isTodayDate,
  todayKey,
} from "@/lib/calendar/streaks";
import type { WorkoutLog, WorkoutStatus } from "@/lib/profile/preferences";
import { cn } from "@/lib/utils";

type RoutineDayOption = {
  id: string;
  dayIndex: number;
  name: string;
  focus: string;
};

type RoutineOption = { id: string; title: string };

type SelectedRoutine = {
  id: string;
  title: string;
  days: RoutineDayOption[];
};

const STATUS_STYLES: Record<
  WorkoutStatus,
  { cell: string; todayRing: string; chip: string }
> = {
  trained: {
    cell: "bg-accent text-white",
    todayRing: "ring-2 ring-accent/40 ring-offset-1 ring-offset-card",
    chip: "border-accent/30 bg-accent-soft text-accent-ink",
  },
  rest: {
    cell: "bg-[color-mix(in_srgb,var(--success)_22%,var(--card))] text-success",
    todayRing: "ring-2 ring-success/35 ring-offset-1 ring-offset-card",
    chip: "border-success/25 bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-success",
  },
  skipped: {
    cell: "bg-[color-mix(in_srgb,var(--danger)_20%,var(--card))] text-danger",
    todayRing: "ring-2 ring-danger/35 ring-offset-1 ring-offset-card",
    chip: "border-danger/25 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-danger",
  },
};

function toKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatLongDate(key: string, locale: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(
    locale === "en" ? "en-US" : "es-AR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    },
  );
}

function buildMonthCells(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<{ day: number | null; key: string | null }> = [];
  for (let i = 0; i < startPad; i++) cells.push({ day: null, key: null });
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, key: toKey(year, monthIndex, day) });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, key: null });
  return cells;
}

export function CalendarView() {
  const { t, locale } = useI18n();
  const statusLabels: Record<WorkoutStatus, string> = {
    trained: t.calendar.trained,
    rest: t.calendar.rest,
    skipped: t.calendar.skipped,
  };
  const WEEKDAYS = t.calendar.weekdays;
  const MONTHS = t.calendar.months;

  const today = todayKey();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [routines, setRoutines] = useState<RoutineOption[]>([]);
  const [routineId, setRoutineId] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] =
    useState<SelectedRoutine | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<WorkoutStatus>("trained");
  const [dayName, setDayName] = useState("");
  const [note, setNote] = useState("");

  const logByDate = useMemo(() => {
    const map = new Map<string, WorkoutLog>();
    for (const log of logs) map.set(log.date, log);
    return map;
  }, [logs]);

  const selectedLog = selectedKey ? logByDate.get(selectedKey) : undefined;
  const selectedIsFuture = selectedKey ? isFutureDate(selectedKey, today) : false;
  const selectedIsToday = selectedKey ? isTodayDate(selectedKey, today) : false;
  const trackingSince = useMemo(() => {
    if (!logs.length) return null;
    return logs.map((l) => l.date).sort()[0] ?? null;
  }, [logs]);

  const streaks = useMemo(
    () => computeStreaks(logs, { today, year, monthIndex }),
    [logs, today, year, monthIndex],
  );

  const cells = useMemo(
    () => buildMonthCells(year, monthIndex),
    [year, monthIndex],
  );

  const load = useCallback(async (id?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const qs = id ? `?routineId=${encodeURIComponent(id)}` : "";
      const response = await fetch(`/api/calendar${qs}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? t.calendar.errorLoad);
      setRoutines(payload.routines ?? []);
      setRoutineId(payload.routineId ?? null);
      setSelectedRoutine(payload.selectedRoutine ?? null);
      setLogs(payload.logs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.calendar.errorLoad);
    } finally {
      setLoading(false);
    }
  }, [t.calendar.errorLoad]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedKey) {
      setEditing(false);
      return;
    }
    const existing = logByDate.get(selectedKey);
    const canEdit = isTodayDate(selectedKey, today);
    if (existing) {
      setEditing(false);
      setStatus(existing.status ?? "trained");
      setDayName(existing.dayName ?? "");
      setNote(existing.note ?? "");
    } else {
      setEditing(canEdit);
      setStatus("trained");
      setDayName(selectedRoutine?.days[0]?.name ?? "");
      setNote("");
    }
  }, [selectedKey, logByDate, selectedRoutine, today]);

  async function changeRoutine(nextId: string) {
    setSelectedKey(null);
    setRoutineId(nextId);
    void load(nextId);
    void fetch("/api/calendar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendarRoutineId: nextId }),
    });
  }

  function shiftMonth(delta: number) {
    const d = new Date(year, monthIndex + delta, 1);
    setYear(d.getFullYear());
    setMonthIndex(d.getMonth());
    setSelectedKey(null);
  }

  async function saveCheckIn() {
    if (!selectedKey || !routineId) return;
    if (!isTodayDate(selectedKey, today)) {
      setError(t.calendar.futureOnlyPast);
      return;
    }
    if (status === "trained" && !dayName.trim()) {
      setError(t.calendar.pickRoutineDay);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedKey,
          routineId,
          status,
          dayName: status === "trained" ? dayName.trim() : undefined,
          note: note.trim() || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.calendar.errorCheckIn);
      }
      setLogs(payload.logs ?? []);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.calendar.errorCheckIn);
    } finally {
      setBusy(false);
    }
  }

  async function removeCheckIn() {
    if (!selectedKey || !routineId) return;
    if (!isTodayDate(selectedKey, today)) {
      setError(t.calendar.pastLocked);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/calendar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedKey, routineId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.calendar.errorRemove);
      }
      setLogs(payload.logs ?? []);
      setEditing(true);
      setStatus("trained");
      setDayName(selectedRoutine?.days[0]?.name ?? "");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.calendar.errorRemove);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted">
        {t.calendar.loading}
      </div>
    );
  }

  if (!routines.length) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <header className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
            {t.calendar.title}
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.03em]">
            {t.calendar.noRoutines}
          </h1>
          <p className="text-sm text-muted">
            {t.calendar.noRoutinesSub}
          </p>
        </header>
        <Link
          href="/routine"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-medium text-white shadow-[0_8px_24px_rgb(255_166_43_/_30%)] transition hover:bg-accent-hover"
        >
          {t.calendar.goRoutine}
        </Link>
      </div>
    );
  }

  const showForm = selectedIsToday && (editing || !selectedLog);

  return (
    <div className="mx-auto max-w-md space-y-5">
      <header className="space-y-1 text-center md:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
          {t.calendar.title}
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.03em]">
          {t.calendar.planTitle}
        </h1>
      </header>

      <div className="space-y-1.5">
        <Label htmlFor="calendar-routine">{t.calendar.selectPlan}</Label>
        <select
          id="calendar-routine"
          value={routineId ?? ""}
          onChange={(e) => void changeRoutine(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-accent"
        >
          {routines.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      </div>

      <section className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-accent/25 bg-accent-soft px-2.5 py-2.5 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-accent-ink">
              {t.calendar.streak}
            </p>
            <p className="font-display text-2xl font-semibold text-accent">
              {streaks.current}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-2.5 py-2.5 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
              {t.calendar.best}
            </p>
            <p className="font-display text-2xl font-semibold">{streaks.best}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-2.5 py-2.5 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
              {t.calendar.month}
            </p>
            <p className="font-display text-2xl font-semibold">
              {streaks.monthCount}
            </p>
          </div>
        </div>
        <p className="text-center text-[11px] leading-snug text-muted md:text-left">
          {t.calendar.streakHint}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-muted-bg hover:text-foreground"
            aria-label={t.calendar.prevMonth}
          >
            ‹
          </button>
          <h2 className="font-display text-sm font-semibold tracking-tight">
            {MONTHS[monthIndex]} {year}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:bg-muted-bg hover:text-foreground"
            aria-label={t.calendar.nextMonth}
          >
            ›
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium uppercase tracking-[0.06em] text-muted">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-0.5">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((cell, i) => {
            if (!cell.key || cell.day == null) {
              return <div key={`pad-${i}`} className="h-8" />;
            }
            const log = logByDate.get(cell.key);
            const isToday = cell.key === today;
            const isFuture = isFutureDate(cell.key, today);
            const isSelected = cell.key === selectedKey;
            const impliedSkip =
              !log &&
              !isFuture &&
              !isToday &&
              trackingSince != null &&
              cell.key >= trackingSince;
            const statusStyle = log
              ? STATUS_STYLES[log.status ?? "trained"]
              : impliedSkip
                ? STATUS_STYLES.skipped
                : null;
            const hasNote = Boolean(log?.note?.trim());

            return (
              <button
                key={cell.key}
                type="button"
                disabled={isFuture}
                onClick={() => {
                  if (isFuture) return;
                  setSelectedKey(cell.key);
                }}
                className={cn(
                  "relative flex h-8 items-center justify-center rounded-lg text-xs font-medium transition",
                  isFuture && "cursor-not-allowed opacity-30",
                  !isFuture && statusStyle && statusStyle.cell,
                  impliedSkip && "opacity-70",
                  !isFuture && !statusStyle && "text-foreground hover:bg-muted-bg",
                  isToday && !log && !isFuture && "ring-1 ring-accent/45",
                  isToday && log && statusStyle?.todayRing,
                  isSelected && !log && !isFuture && !impliedSkip && "bg-accent-soft text-accent-ink",
                  isSelected && impliedSkip && "ring-2 ring-danger/40",
                )}
                aria-label={`${cell.day}${log ? `, ${statusLabels[log.status ?? "trained"]}` : impliedSkip ? `, ${statusLabels.skipped}` : ""}${isFuture ? t.calendar.futureSuffix : ""}`}
                aria-pressed={isSelected}
              >
                {cell.day}
                {hasNote ? (
                  <span
                    className={cn(
                      "absolute right-0.5 top-0 text-[8px] leading-none",
                      log?.status === "trained"
                        ? "text-white"
                        : "text-accent",
                    )}
                    aria-hidden
                  >
                    ★
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-muted">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent" /> {t.calendar.trained}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success/70" /> {t.calendar.rest}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-danger/70" /> {t.calendar.skipped}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-[9px] text-accent">★</span> {t.calendar.withNote}
          </span>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {selectedKey ? (
          <motion.section
            key={selectedKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
              {selectedKey === today ? t.calendar.today : t.calendar.day}
            </p>
            <h3 className="mt-0.5 font-display text-lg font-semibold capitalize">
              {formatLongDate(selectedKey, locale)}
            </h3>

            {!selectedLog &&
            selectedKey < today &&
            trackingSince &&
            selectedKey >= trackingSince ? (
              <p className="mt-2 text-sm text-danger">
                {t.calendar.impliedSkip}
              </p>
            ) : null}

            {!selectedLog && selectedIsToday ? (
              <p className="mt-2 text-sm text-muted">
                {t.calendar.canCheckIn}
              </p>
            ) : null}

            {selectedLog && !selectedIsToday && !selectedIsFuture ? (
              <p className="mt-2 text-sm text-muted">{t.calendar.pastLocked}</p>
            ) : null}

            {selectedLog && !editing ? (
              <div className="mt-3 space-y-2">
                <span
                  className={cn(
                    "inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium",
                    STATUS_STYLES[selectedLog.status ?? "trained"].chip,
                  )}
                >
                  {statusLabels[selectedLog.status ?? "trained"]}
                </span>
                {selectedLog.status === "trained" && selectedLog.dayName ? (
                  <p className="text-sm">
                    <span className="text-muted">{t.calendar.day}: </span>
                    {selectedLog.dayName}
                  </p>
                ) : null}
                {selectedLog.note?.trim() ? (
                  <p className="rounded-xl bg-muted-bg px-3 py-2 text-sm leading-relaxed">
                    <span className="mr-1 text-accent" aria-hidden>
                      ★
                    </span>
                    {selectedLog.note}
                  </p>
                ) : (
                  <p className="text-sm text-muted">{t.calendar.noNote}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedIsToday ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => setEditing(true)}
                      >
                        {t.calendar.editLog}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => void removeCheckIn()}
                      >
                        {t.calendar.remove}
                      </Button>
                    </>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setSelectedKey(null)}
                  >
                    {t.common.close}
                  </Button>
                </div>
              </div>
            ) : null}

            {showForm ? (
              <div className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted">{t.calendar.status}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      ["trained", "rest", "skipped"] as const
                    ).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setStatus(value)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-xs transition",
                          status === value
                            ? STATUS_STYLES[value].chip
                            : "border-border hover:bg-muted-bg",
                        )}
                      >
                        {statusLabels[value]}
                      </button>
                    ))}
                  </div>
                </div>

                {status === "trained" ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted">{t.calendar.whichDay}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedRoutine?.days ?? []).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDayName(d.name)}
                          className={cn(
                            "rounded-lg border px-2.5 py-1.5 text-xs transition",
                            dayName === d.name
                              ? "border-accent bg-accent-soft text-accent-ink"
                              : "border-border hover:bg-muted-bg",
                          )}
                        >
                          {d.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setDayName(t.calendar.free)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-xs transition",
                          dayName === t.calendar.free
                            ? "border-accent bg-accent-soft text-accent-ink"
                            : "border-border hover:bg-muted-bg",
                        )}
                      >
                        {t.calendar.free}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor="checkin-note">{t.calendar.note}</Label>
                  <Textarea
                    id="checkin-note"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t.calendar.notePlaceholder}
                    className="min-h-[64px] text-sm"
                    maxLength={400}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={busy} onClick={() => void saveCheckIn()}>
                    {busy
                      ? t.calendar.saving
                      : selectedLog
                        ? t.calendar.saveChanges
                        : t.calendar.checkIn}
                  </Button>
                  {selectedLog ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setEditing(false)}
                    >
                      {t.common.cancel}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setSelectedKey(null)}
                    >
                      {t.common.close}
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </motion.section>
        ) : null}
      </AnimatePresence>

      {error ? (
        <p className="text-center text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
