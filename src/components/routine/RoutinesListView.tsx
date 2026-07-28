"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export type RoutineListItem = {
  id: string;
  title: string;
  summary: string;
  updatedAt: string;
  active?: boolean;
};

type Props = {
  routines: RoutineListItem[];
};

export function RoutinesListView({ routines: initialRoutines }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [routines, setRoutines] = useState(initialRoutines);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function openRoutine(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await fetch("/api/routines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routineId: id, action: "activate" }),
      });
      router.push(`/routine/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
      setBusyId(null);
    }
  }

  async function saveRename(id: string) {
    const title = renameValue.trim();
    if (!title) return;
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch("/api/routines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routineId: id, action: "rename", title }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? t.common.errorGeneric);
      setRoutines((prev) =>
        prev.map((r) => (r.id === id ? { ...r, title } : r)),
      );
      setRenamingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const id = deleteId;
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch("/api/routines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routineId: id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? t.common.errorGeneric);
      setRoutines((prev) => prev.filter((r) => r.id !== id));
      setDeleteId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setBusyId(null);
    }
  }

  const deleting = routines.find((r) => r.id === deleteId);
  const dateLocale = locale === "en" ? "en-US" : "es-AR";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <header className="space-y-3 text-center md:text-left">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
          {t.nav.routine}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
              {t.routine.listTitle}
            </h1>
            <p className="mt-2 text-muted">
              {t.routine.listSub}
            </p>
          </div>
          <Link href="/onboarding?new=1" className="shrink-0 self-center sm:self-auto">
            <Button>{t.routine.new}</Button>
          </Link>
        </div>
      </header>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {routines.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-xl font-semibold">
            {t.routine.empty}
          </h2>
          <Link href="/onboarding?new=1" className="mt-6 inline-block">
            <Button>{t.routine.createFirst}</Button>
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {routines.map((item) => {
            const busy = busyId === item.id;
            const renaming = renamingId === item.id;
            return (
              <li key={item.id}>
                <div
                  className={cn(
                    "rounded-3xl border border-border bg-card px-5 py-5 shadow-[var(--shadow-soft)] transition",
                    item.active && "border-accent/35 bg-accent-soft/20",
                  )}
                >
                  {renaming ? (
                    <div className="space-y-3">
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        autoFocus
                        maxLength={80}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveRename(item.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => void saveRename(item.id)}
                        >
                          {t.common.save}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRenamingId(null)}
                        >
                          {t.common.cancel}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={Boolean(busyId)}
                        onClick={() => void openRoutine(item.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-display text-xl font-semibold tracking-tight">
                              {item.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm text-muted">
                              {item.summary}
                            </p>
                            <p className="mt-3 text-xs text-muted">
                              {new Date(item.updatedAt).toLocaleDateString(
                                dateLocale,
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-medium text-accent">
                            {busy ? t.common.loading : `${t.common.open} →`}
                          </span>
                        </div>
                      </button>
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={Boolean(busyId)}
                          onClick={() => {
                            setRenamingId(item.id);
                            setRenameValue(item.title);
                          }}
                        >
                          {t.common.rename}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={Boolean(busyId)}
                          className="text-danger hover:text-danger"
                          onClick={() => setDeleteId(item.id)}
                        >
                          {t.common.delete}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {deleting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="font-display text-xl font-semibold">
              {t.routine.deleteConfirm}
            </h2>
            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-foreground">{deleting.title}</span>
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setDeleteId(null)}
                disabled={Boolean(busyId)}
              >
                {t.common.cancel}
              </Button>
              <Button
                onClick={() => void confirmDelete()}
                disabled={Boolean(busyId)}
                className="bg-danger hover:bg-danger"
              >
                {busyId === deleting.id ? t.common.loading : t.common.delete}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
