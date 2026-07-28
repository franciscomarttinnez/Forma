"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CoachAction } from "@/lib/ai/local-coach";
import {
  formatMessage,
  useI18n,
} from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "coach";
  content: string;
};

type DayOption = {
  dayIndex: number;
  name: string;
  exercises: { name: string }[];
};

type Screen =
  | { id: "menu" }
  | { id: "days" }
  | { id: "replace" }
  | { id: "volume" }
  | { id: "advice" }
  | { id: "pick_day"; purpose: "explain" | "replace_one" }
  | {
      id: "pick_exercise";
      purpose: "explain" | "replace_one";
      dayIndex: number;
      dayName: string;
    };

type Choice = {
  id: string;
  label: string;
  hint?: string;
  next?: Screen;
  action?: CoachAction;
};

type ChoiceLayout = "list" | "grid" | "pills";

const ease = [0.22, 1, 0.36, 1] as const;

type CoachChatProps = {
  routineId: string;
  days: DayOption[];
};

export function CoachChat({ routineId, days }: CoachChatProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>({ id: "menu" });
  const [path, setPath] = useState<string[]>([]);
  const [pending, setPending] = useState<{
    label: string;
    action: CoachAction;
  } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "coach", content: t.coach.greeting },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dayCount = days.length;

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.id === "welcome") {
        return [{ id: "welcome", role: "coach", content: t.coach.greeting }];
      }
      if (prev[0]?.id === "welcome") {
        return [
          { id: "welcome", role: "coach", content: t.coach.greeting },
          ...prev.slice(1),
        ];
      }
      return prev;
    });
  }, [t.coach.greeting]);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      try {
        const response = await fetch("/api/profile/metrics");
        if (!response.ok) return;
        const payload = await response.json();
        const chat = payload.preferences?.coachChat as
          | { id: string; role: "user" | "coach"; content: string }[]
          | undefined;
        if (cancelled || !chat?.length) return;
        setMessages([
          { id: "welcome", role: "coach", content: t.coach.greeting },
          ...chat.map((item) => ({
            id: item.id,
            role: item.role,
            content: item.content,
          })),
        ]);
      } catch {
        // keep welcome
      }
    }
    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [t.coach.greeting]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, screen, pending, loading]);

  function resetDraft() {
    setScreen({ id: "menu" });
    setPath([]);
    setPending(null);
  }

  async function resetChat() {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/profile/metrics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearCoachChat: true }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? t.coach.errorReset);
      }
      setMessages([{ id: "welcome", role: "coach", content: t.coach.greeting }]);
      resetDraft();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "coach",
          content:
            error instanceof Error ? error.message : t.coach.errorReset,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function sendPending() {
    if (!pending || loading) return;
    setLoading(true);
    const draftLabel = pending.label;
    const action = pending.action;
    resetDraft();

    try {
      const response = await fetch("/api/ai/coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routineId, action, locale }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.coach.errorApply);
      }

      const persisted = payload.messages as
        | { id: string; role: "user" | "coach"; content: string }[]
        | undefined;

      if (persisted?.length === 2) {
        setMessages((prev) => [
          ...prev,
          {
            id: persisted[0].id,
            role: persisted[0].role,
            content: persisted[0].content,
          },
          {
            id: persisted[1].id,
            role: persisted[1].role,
            content: persisted[1].content,
          },
          {
            id: crypto.randomUUID(),
            role: "coach",
            content: t.coach.anythingMore,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content: draftLabel },
          {
            id: crypto.randomUUID(),
            role: "coach",
            content: payload.reply as string,
          },
          {
            id: crypto.randomUUID(),
            role: "coach",
            content: t.coach.anythingMore,
          },
        ]);
      }

      if (payload.modified) router.refresh();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: draftLabel },
        {
          id: crypto.randomUUID(),
          role: "coach",
          content:
            error instanceof Error ? error.message : t.coach.errorProblem,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function choicesForScreen(): { layout: ChoiceLayout; items: Choice[] } {
    if (screen.id === "menu") {
      return {
        layout: "list",
        items: [
          {
            id: "days",
            label: t.coach.menuDays,
            hint: t.coach.menuDaysHint,
            next: { id: "days" },
          },
          {
            id: "replace",
            label: t.coach.menuReplace,
            hint: t.coach.menuReplaceHint,
            next: { id: "replace" },
          },
          {
            id: "volume",
            label: t.coach.menuVolume,
            hint: t.coach.menuVolumeHint,
            next: { id: "volume" },
          },
          {
            id: "explain",
            label: t.coach.menuExplain,
            hint: t.coach.menuExplainHint,
            next: { id: "pick_day", purpose: "explain" },
          },
          {
            id: "advice",
            label: t.coach.menuAdvice,
            hint: t.coach.menuAdviceHint,
            next: { id: "advice" },
          },
        ],
      };
    }

    if (screen.id === "days") {
      const items: Choice[] = [];
      if (dayCount < 6) {
        items.push({
          id: "add",
          label: t.coach.addDay,
          hint: formatMessage(t.coach.wouldRemain, { n: dayCount + 1 }),
          action: { type: "set_days", count: dayCount + 1 },
        });
      }
      if (dayCount > 2) {
        items.push({
          id: "remove",
          label: t.coach.removeDay,
          hint: formatMessage(t.coach.wouldRemain, { n: dayCount - 1 }),
          action: { type: "set_days", count: dayCount - 1 },
        });
      }
      for (const n of [2, 3, 4, 5, 6]) {
        if (n === dayCount) continue;
        items.push({
          id: `set-${n}`,
          label: `${n}`,
          hint: t.coach.daysUnit,
          action: { type: "set_days", count: n },
        });
      }
      return { layout: "pills", items };
    }

    if (screen.id === "replace") {
      return {
        layout: "list",
        items: [
          {
            id: "machines",
            label: t.coach.machinesToDumbbells,
            hint: t.coach.machinesHint,
            action: { type: "swap_machines_to_dumbbells" },
          },
          {
            id: "reshuffle",
            label: t.coach.varyPlan,
            hint: t.coach.varyPlanHint,
            action: { type: "reshuffle" },
          },
          {
            id: "one",
            label: t.coach.replaceOne,
            hint: t.coach.replaceOneHint,
            next: { id: "pick_day", purpose: "replace_one" },
          },
        ],
      };
    }

    if (screen.id === "volume") {
      return {
        layout: "grid",
        items: [
          {
            id: "vol-up",
            label: t.coach.moreSets,
            action: { type: "volume_up" },
          },
          {
            id: "vol-down",
            label: t.coach.lessSets,
            action: { type: "volume_down" },
          },
          {
            id: "rest-down",
            label: t.coach.lessRest,
            action: { type: "rest_shorter" },
          },
          {
            id: "rest-up",
            label: t.coach.moreRest,
            action: { type: "rest_longer" },
          },
        ],
      };
    }

    if (screen.id === "advice") {
      return {
        layout: "list",
        items: [
          {
            id: "progress",
            label: t.coach.howToProgress,
            hint: t.coach.progressHint,
            action: { type: "advice", topic: "progress" },
          },
          {
            id: "technique",
            label: t.coach.techniquePain,
            hint: t.coach.techniqueHint,
            action: { type: "advice", topic: "technique" },
          },
          {
            id: "warmup",
            label: t.coach.howToWarmup,
            hint: t.coach.warmupHint,
            action: { type: "advice", topic: "warmup" },
          },
        ],
      };
    }

    if (screen.id === "pick_day") {
      return {
        layout: "list",
        items: days.map((day) => ({
          id: `day-${day.dayIndex}`,
          label: day.name,
          hint: formatMessage(t.coach.exerciseCount, {
            n: day.exercises.length,
          }),
          next: {
            id: "pick_exercise" as const,
            purpose: screen.purpose,
            dayIndex: day.dayIndex,
            dayName: day.name,
          },
        })),
      };
    }

    if (screen.id === "pick_exercise") {
      const day = days.find((item) => item.dayIndex === screen.dayIndex);
      return {
        layout: "list",
        items: (day?.exercises ?? []).map((exercise, index) => ({
          id: `ex-${index}-${exercise.name}`,
          label: exercise.name,
          action:
            screen.purpose === "explain"
              ? {
                  type: "explain_exercise" as const,
                  dayIndex: screen.dayIndex,
                  exerciseName: exercise.name,
                }
              : {
                  type: "replace_exercise" as const,
                  dayIndex: screen.dayIndex,
                  exerciseName: exercise.name,
                },
        })),
      };
    }

    return { layout: "list", items: [] };
  }

  function onPick(choice: Choice) {
    if (choice.action) {
      const label = [...path, choice.label].join(" · ");
      setPending({ label, action: choice.action });
      setPath([...path, choice.label]);
      return;
    }
    if (choice.next) {
      setPath([...path, choice.label]);
      setPending(null);
      setScreen(choice.next);
    }
  }

  function goBack() {
    if (pending) {
      setPending(null);
      setPath((prev) => prev.slice(0, -1));
      return;
    }
    if (screen.id === "pick_exercise") {
      setPath((prev) => prev.slice(0, -1));
      setScreen({ id: "pick_day", purpose: screen.purpose });
      return;
    }
    if (screen.id !== "menu") {
      setPath([]);
      setScreen({ id: "menu" });
    }
  }

  const draftText =
    pending?.label ||
    (path.length ? path.join(" · ") : t.coach.pickOption);
  const { layout, items: choices } = choicesForScreen();
  const showChoices = !pending && !loading;
  const daysUnit = t.coach.daysUnit;
  const listActions = choices.filter(
    (item) => layout !== "pills" || Boolean(item.hint && item.hint !== daysUnit),
  );
  const pillChoices =
    layout === "pills"
      ? choices.filter((item) => item.hint === daysUnit)
      : [];
  const dayActions =
    layout === "pills"
      ? choices.filter((item) => item.hint !== daysUnit)
      : listActions;

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6 md:bottom-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.32, ease }}
            className="pointer-events-auto flex h-[min(560px,75vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]"
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2.5">
                <motion.div
                  animate={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.6, ease, delay: 0.15 }}
                >
                  <Image
                    src="/brand/coach-sparkles.png"
                    alt=""
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </motion.div>
                <div>
                  <p className="font-display text-sm font-semibold">
                    {t.coach.coachForma}
                  </p>
                  <p className="text-xs text-muted">{t.coach.pickAndSend}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void resetChat()}
                  disabled={loading}
                  className="rounded-full px-2 py-1 text-xs font-medium text-muted transition hover:bg-muted-bg hover:text-foreground disabled:opacity-50"
                  aria-label={t.coach.resetChat}
                  title={t.coach.resetChat}
                >
                  {t.coach.reset}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-2 py-1 text-sm text-muted transition hover:bg-muted-bg hover:text-foreground"
                  aria-label={t.common.close}
                >
                  ✕
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.28,
                      ease,
                      delay: index === messages.length - 1 ? 0.04 : 0,
                    }}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      message.role === "user"
                        ? "ml-auto bg-accent text-white"
                        : "bg-muted-bg text-foreground",
                    )}
                  >
                    {message.content}
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.div
                layout
                className="ml-auto w-[min(100%,94%)]"
                transition={{ duration: 0.25, ease }}
              >
                <motion.div
                  layout
                  animate={{
                    backgroundColor: pending
                      ? "rgb(255, 166, 43)"
                      : "rgba(255, 166, 43, 0.1)",
                    borderColor: pending
                      ? "rgba(255, 166, 43, 0.7)"
                      : "rgba(255, 166, 43, 0.35)",
                  }}
                  transition={{ duration: 0.28, ease }}
                  className={cn(
                    "rounded-2xl border border-dashed px-3 py-2.5",
                    pending ? "text-white" : "text-foreground",
                  )}
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] opacity-70">
                    {t.coach.draft}
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={draftText}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className={cn(
                        "mt-1 text-sm leading-relaxed",
                        !pending && !path.length && "text-muted",
                      )}
                    >
                      {loading ? t.coach.sending : draftText}
                    </motion.p>
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {showChoices ? (
                      <motion.div
                        key={
                          screen.id +
                          (screen.id === "pick_exercise" ? screen.dayIndex : "")
                        }
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22, ease }}
                        className="mt-3"
                      >
                        {layout === "pills" ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 gap-1.5">
                              {dayActions.map((choice, i) => (
                                <ChoiceRow
                                  key={choice.id}
                                  choice={choice}
                                  index={i}
                                  onPick={onPick}
                                />
                              ))}
                            </div>
                            {pillChoices.length ? (
                              <div>
                                <p className="mb-1.5 px-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                                  {t.coach.switchTo}
                                </p>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {pillChoices.map((choice, i) => (
                                    <motion.button
                                      key={choice.id}
                                      type="button"
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{
                                        delay: 0.04 * i,
                                        duration: 0.2,
                                        ease,
                                      }}
                                      whileTap={{ scale: 0.94 }}
                                      onClick={() => onPick(choice)}
                                      className="flex flex-col items-center justify-center rounded-xl border border-border/70 bg-card py-2.5 text-foreground shadow-[0_1px_0_rgb(0_0_0_/_3%)] transition hover:border-accent/45 hover:bg-accent-soft"
                                    >
                                      <span className="font-display text-base font-semibold leading-none">
                                        {choice.label}
                                      </span>
                                      <span className="mt-1 text-[10px] text-muted">
                                        {t.coach.daysUnit}
                                      </span>
                                    </motion.button>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {layout === "grid" ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            {choices.map((choice, i) => (
                              <motion.button
                                key={choice.id}
                                type="button"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: 0.04 * i,
                                  duration: 0.2,
                                  ease,
                                }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => onPick(choice)}
                                className="rounded-xl border border-border/70 bg-card px-2.5 py-3 text-center text-xs font-semibold leading-snug text-foreground shadow-[0_1px_0_rgb(0_0_0_/_3%)] transition hover:border-accent/45 hover:bg-accent-soft"
                              >
                                {choice.label}
                              </motion.button>
                            ))}
                          </div>
                        ) : null}

                        {layout === "list" ? (
                          <div className="grid grid-cols-1 gap-1.5">
                            {choices.map((choice, i) => (
                              <ChoiceRow
                                key={choice.id}
                                choice={choice}
                                index={i}
                                onPick={onPick}
                              />
                            ))}
                          </div>
                        ) : null}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {!loading ? (
                    <motion.div
                      layout
                      className="mt-3 flex items-center justify-end gap-2"
                    >
                      {screen.id !== "menu" || pending || path.length ? (
                        <button
                          type="button"
                          onClick={goBack}
                          className={cn(
                            "rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                            pending
                              ? "text-white/85 hover:bg-white/15"
                              : "text-muted hover:bg-muted-bg",
                          )}
                        >
                          {t.common.back}
                        </button>
                      ) : null}
                      <motion.button
                        type="button"
                        disabled={!pending}
                        onClick={() => void sendPending()}
                        whileTap={pending ? { scale: 0.96 } : undefined}
                        animate={
                          pending
                            ? {
                                scale: [1, 1.03, 1],
                              }
                            : { scale: 1 }
                        }
                        transition={
                          pending
                            ? { duration: 0.45, ease, repeat: 0 }
                            : undefined
                        }
                        className={cn(
                          "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
                          pending
                            ? "bg-white text-accent-ink shadow-sm hover:bg-white/90"
                            : "cursor-not-allowed bg-muted-bg text-muted",
                        )}
                      >
                        {t.coach.send}
                      </motion.button>
                    </motion.div>
                  ) : (
                    <div className="mt-3 flex items-center justify-end gap-1.5">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          className="h-1.5 w-1.5 rounded-full bg-accent"
                          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: dot * 0.15,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>

              <div ref={bottomRef} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label={open ? t.coach.closeCoach : t.coach.openCoach}
        onClick={() => setOpen((value) => !value)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        animate={
          open
            ? { scale: 1 }
            : {
                scale: [1, 1.04, 1],
                boxShadow: [
                  "0 12px 32px rgb(255 166 43 / 40%)",
                  "0 14px 36px rgb(255 166 43 / 55%)",
                  "0 12px 32px rgb(255 166 43 / 40%)",
                ],
              }
        }
        transition={
          open
            ? { duration: 0.2 }
            : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
        }
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent"
      >
        <Image
          src="/brand/coach-sparkles.png"
          alt=""
          width={28}
          height={28}
          className="object-contain brightness-0 invert"
        />
      </motion.button>
    </div>
  );
}

function ChoiceRow({
  choice,
  index,
  onPick,
}: {
  choice: Choice;
  index: number;
  onPick: (choice: Choice) => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.035 * index, duration: 0.2, ease }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onPick(choice)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5 text-left shadow-[0_1px_0_rgb(0_0_0_/_3%)] transition hover:border-accent/45 hover:bg-accent-soft"
    >
      <span className="min-w-0">
        <span className="block text-xs font-semibold leading-snug text-foreground">
          {choice.label}
        </span>
        {choice.hint ? (
          <span className="mt-0.5 block text-[11px] leading-snug text-muted">
            {choice.hint}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-accent" aria-hidden>
        ›
      </span>
    </motion.button>
  );
}
