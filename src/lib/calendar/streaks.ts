import type { WorkoutLog, WorkoutStatus } from "@/lib/profile/preferences";

export type StreakSummary = {
  current: number;
  best: number;
  /** Trained days in the visible month */
  monthCount: number;
};

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(key: string, delta: number) {
  const d = parseKey(key);
  d.setDate(d.getDate() + delta);
  return toDateKey(d);
}

export function todayKey(now = new Date()) {
  // Calendar day in Argentina — avoids UTC drift on the server
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isFutureDate(date: string, today = todayKey()) {
  return date > today;
}

export function isTodayDate(date: string, today = todayKey()) {
  return date === today;
}

export function logsForRoutine(logs: WorkoutLog[], routineId: string) {
  return logs.filter((l) => l.routineId === routineId);
}

function statusMap(logs: WorkoutLog[]) {
  const map = new Map<string, WorkoutStatus>();
  for (const log of logs) {
    map.set(log.date, log.status ?? "trained");
  }
  return map;
}

/**
 * Current streak for a plan:
 * - trained → +1
 * - rest → continues (no +1, does not break)
 * - skipped or empty day → breaks
 * Starts from today if logged, else yesterday (grace for today).
 */
export function currentPlanStreak(
  logs: WorkoutLog[],
  today = todayKey(),
): number {
  const map = statusMap(logs);
  let cursor = map.has(today) ? today : addDays(today, -1);
  if (!map.has(cursor)) return 0;

  let streak = 0;
  while (true) {
    const status = map.get(cursor);
    if (!status) break;
    if (status === "skipped") break;
    if (status === "trained") streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * Best trained-day streak, walking the calendar range of logs.
 * Rest bridges days; skipped and gaps reset.
 */
export function bestPlanStreak(logs: WorkoutLog[]): number {
  if (!logs.length) return 0;
  const map = statusMap(logs);
  const dates = [...map.keys()].sort();
  const start = dates[0];
  const end = dates[dates.length - 1];

  let best = 0;
  let run = 0;
  let cursor = start;
  while (cursor <= end) {
    const status = map.get(cursor);
    if (!status || status === "skipped") {
      run = 0;
    } else if (status === "trained") {
      run += 1;
      best = Math.max(best, run);
    }
    // rest: keep run
    cursor = addDays(cursor, 1);
  }
  return best;
}

export function monthTrainedCount(
  logs: WorkoutLog[],
  year: number,
  monthIndex: number,
) {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}-`;
  return logs.filter(
    (l) =>
      l.date.startsWith(prefix) && (l.status ?? "trained") === "trained",
  ).length;
}

export function computeStreaks(
  logs: WorkoutLog[],
  opts?: { today?: string; year?: number; monthIndex?: number },
): StreakSummary {
  const today = opts?.today ?? todayKey();
  const ref = opts?.today ? parseKey(opts.today) : new Date();
  const year = opts?.year ?? ref.getFullYear();
  const monthIndex = opts?.monthIndex ?? ref.getMonth();

  return {
    current: currentPlanStreak(logs, today),
    best: bestPlanStreak(logs),
    monthCount: monthTrainedCount(logs, year, monthIndex),
  };
}
