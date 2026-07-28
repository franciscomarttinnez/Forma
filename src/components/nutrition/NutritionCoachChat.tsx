"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { NutritionCoachAction } from "@/lib/nutrition/coach";
import type { MealSlot } from "@/lib/validations/nutrition";
import { goalOptions } from "@/lib/validations/onboarding";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "coach";
  content: string;
};

type DayOption = {
  dayIndex: number;
  name: string;
  meals: { id: string; slot: MealSlot; name: string }[];
};

type Screen =
  | { id: "menu" }
  | { id: "calories" }
  | { id: "goal" }
  | { id: "meals" }
  | { id: "advice" }
  | { id: "avoid" }
  | { id: "pick_day"; purpose: "replace" | "explain" }
  | {
      id: "pick_meal";
      purpose: "replace" | "explain";
      dayIndex: number;
      dayName: string;
    };

type Choice = {
  id: string;
  label: string;
  hint?: string;
  next?: Screen;
  action?: NutritionCoachAction;
};

type ChoiceLayout = "list" | "grid" | "pills";

const AVOID_OPTIONS = [
  { food: "Eggs", key: "avoidEggs" as const },
  { food: "Dairy", key: "avoidDairy" as const },
  { food: "Fish", key: "avoidFish" as const },
  { food: "Chicken", key: "avoidChicken" as const },
  { food: "Meat", key: "avoidMeat" as const },
  { food: "Broccoli", key: "avoidBroccoli" as const },
  { food: "Avocado", key: "avoidAvocado" as const },
  { food: "Oats", key: "avoidOats" as const },
];

const ease = [0.22, 1, 0.36, 1] as const;

type Props = {
  planId: string;
  days: DayOption[];
};

export function NutritionCoachChat({ planId, days }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>({ id: "menu" });
  const [path, setPath] = useState<string[]>([]);
  const [pending, setPending] = useState<{
    label: string;
    action: NutritionCoachAction;
  } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "coach", content: t.nutritionCoach.greeting },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.id === "welcome") {
        return [
          {
            id: "welcome",
            role: "coach",
            content: t.nutritionCoach.greeting,
          },
        ];
      }
      if (prev[0]?.id === "welcome") {
        return [
          {
            id: "welcome",
            role: "coach",
            content: t.nutritionCoach.greeting,
          },
          ...prev.slice(1),
        ];
      }
      return prev;
    });
  }, [t.nutritionCoach.greeting]);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      try {
        const response = await fetch("/api/profile/metrics");
        if (!response.ok) return;
        const payload = await response.json();
        const chat = payload.preferences?.nutritionCoachChat as
          | { id: string; role: "user" | "coach"; content: string }[]
          | undefined;
        if (cancelled || !chat?.length) return;
        setMessages([
          {
            id: "welcome",
            role: "coach",
            content: t.nutritionCoach.greeting,
          },
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
  }, [t.nutritionCoach.greeting]);

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
        body: JSON.stringify({ clearNutritionCoachChat: true }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? t.nutritionCoach.errorReset);
      }
      setMessages([
        {
          id: "welcome",
          role: "coach",
          content: t.nutritionCoach.greeting,
        },
      ]);
      resetDraft();
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "coach",
          content:
            error instanceof Error
              ? error.message
              : t.nutritionCoach.errorReset,
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
      const response = await fetch("/api/ai/nutrition-coach-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, action, locale }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? t.nutritionCoach.errorApply);
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
            content: t.nutritionCoach.anythingMore,
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
            content: t.nutritionCoach.anythingMore,
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
            error instanceof Error
              ? error.message
              : t.nutritionCoach.errorProblem,
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
            id: "meals",
            label: t.nutritionCoach.changeMeals,
            hint: t.nutritionCoach.changeMealsHint,
            next: { id: "meals" },
          },
          {
            id: "calories",
            label: t.nutritionCoach.caloriesGoal,
            hint: t.nutritionCoach.caloriesGoalHint,
            next: { id: "calories" },
          },
          {
            id: "avoid",
            label: t.nutritionCoach.avoidFood,
            hint: t.nutritionCoach.avoidFoodHint,
            next: { id: "avoid" },
          },
          {
            id: "explain",
            label: t.nutritionCoach.explainMeal,
            hint: t.nutritionCoach.explainMealHint,
            next: { id: "pick_day", purpose: "explain" },
          },
          {
            id: "advice",
            label: t.nutritionCoach.advice,
            hint: t.nutritionCoach.adviceHint,
            next: { id: "advice" },
          },
        ],
      };
    }

    if (screen.id === "meals") {
      return {
        layout: "list",
        items: [
          {
            id: "reshuffle",
            label: t.nutritionCoach.reshuffle,
            hint: t.nutritionCoach.reshuffleHint,
            action: { type: "reshuffle" },
          },
          {
            id: "one",
            label: t.nutritionCoach.changeOneMeal,
            hint: t.nutritionCoach.changeOneMealHint,
            next: { id: "pick_day", purpose: "replace" },
          },
        ],
      };
    }

    if (screen.id === "calories") {
      return {
        layout: "list",
        items: [
          {
            id: "up",
            label: t.nutritionCoach.bumpCals,
            action: { type: "calories_up" },
          },
          {
            id: "down",
            label: t.nutritionCoach.cutCals,
            action: { type: "calories_down" },
          },
          {
            id: "goal",
            label: t.nutritionCoach.changeGoal,
            hint: t.nutritionCoach.changeGoalHint,
            next: { id: "goal" },
          },
        ],
      };
    }

    if (screen.id === "goal") {
      return {
        layout: "list",
        items: goalOptions.map((goal) => ({
          id: goal,
          label: t.goals[goal],
          action: { type: "set_goal" as const, goal },
        })),
      };
    }

    if (screen.id === "avoid") {
      return {
        layout: "pills",
        items: AVOID_OPTIONS.map((item) => ({
          id: item.food,
          label: t.nutritionCoach[item.key],
          action: { type: "avoid_food" as const, food: item.food },
        })),
      };
    }

    if (screen.id === "advice") {
      return {
        layout: "list",
        items: [
          {
            id: "protein",
            label: t.nutritionCoach.protein,
            action: { type: "advice", topic: "protein" },
          },
          {
            id: "deficit",
            label: t.nutritionCoach.deficit,
            action: { type: "advice", topic: "deficit" },
          },
          {
            id: "water",
            label: t.nutritionCoach.hydration,
            action: { type: "advice", topic: "hydration" },
          },
          {
            id: "prep",
            label: t.nutritionCoach.mealPrep,
            action: { type: "advice", topic: "meal_prep" },
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
          next: {
            id: "pick_meal" as const,
            purpose: screen.purpose,
            dayIndex: day.dayIndex,
            dayName: day.name,
          },
        })),
      };
    }

    if (screen.id === "pick_meal") {
      const day = days.find((d) => d.dayIndex === screen.dayIndex);
      return {
        layout: "list",
        items: (day?.meals ?? []).map((meal) => ({
          id: meal.id,
          label: `${t.meals[meal.slot]} · ${meal.name}`,
          action:
            screen.purpose === "explain"
              ? {
                  type: "explain_meal" as const,
                  dayIndex: screen.dayIndex,
                  mealId: meal.id,
                }
              : {
                  type: "replace_meal" as const,
                  dayIndex: screen.dayIndex,
                  mealId: meal.id,
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
    if (screen.id === "pick_meal") {
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
    (path.length ? path.join(" · ") : t.nutritionCoach.pickOption);
  const { layout, items: choices } = choicesForScreen();
  const showChoices = !pending && !loading;

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
                <Image
                  src="/brand/coach-sparkles.png"
                  alt=""
                  width={28}
                  height={28}
                  className="object-contain"
                />
                <div>
                  <p className="font-display text-sm font-semibold">
                    {t.nutritionCoach.title}
                  </p>
                  <p className="text-xs text-muted">
                    {t.nutritionCoach.pickAndSend}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void resetChat()}
                  disabled={loading}
                  className="rounded-full px-2 py-1 text-xs font-medium text-muted transition hover:bg-muted-bg hover:text-foreground disabled:opacity-50"
                  aria-label={t.nutritionCoach.resetChat}
                  title={t.nutritionCoach.resetChat}
                >
                  {t.nutritionCoach.reset}
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
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "ml-auto bg-accent text-white"
                      : "bg-muted-bg text-foreground",
                  )}
                >
                  {message.content}
                </div>
              ))}

              <div className="ml-auto w-[min(100%,94%)]">
                <div
                  className={cn(
                    "rounded-2xl border border-dashed px-3 py-2.5",
                    pending
                      ? "border-accent bg-accent text-white"
                      : "border-accent/35 bg-accent-soft/40 text-foreground",
                  )}
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] opacity-70">
                    {t.nutritionCoach.draft}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-sm leading-relaxed",
                      !pending && !path.length && "text-muted",
                    )}
                  >
                    {loading ? t.nutritionCoach.sending : draftText}
                  </p>

                  {showChoices ? (
                    <div className="mt-3 grid grid-cols-1 gap-1.5">
                      {layout === "pills" ? (
                        <div className="flex flex-wrap gap-1.5">
                          {choices.map((choice) => (
                            <button
                              key={choice.id}
                              type="button"
                              onClick={() => onPick(choice)}
                              className="rounded-xl border border-border/70 bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:border-accent/45 hover:bg-accent-soft"
                            >
                              {choice.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        choices.map((choice) => (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => onPick(choice)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5 text-left transition hover:border-accent/45 hover:bg-accent-soft"
                          >
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold">
                                {choice.label}
                              </span>
                              {choice.hint ? (
                                <span className="mt-0.5 block text-[11px] text-muted">
                                  {choice.hint}
                                </span>
                              ) : null}
                            </span>
                            <span className="text-accent">›</span>
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}

                  {!loading ? (
                    <div className="mt-3 flex items-center justify-end gap-2">
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
                      <button
                        type="button"
                        disabled={!pending}
                        onClick={() => void sendPending()}
                        className={cn(
                          "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
                          pending
                            ? "bg-white text-accent-ink shadow-sm hover:bg-white/90"
                            : "cursor-not-allowed bg-muted-bg text-muted",
                        )}
                      >
                        {t.nutritionCoach.send}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div ref={bottomRef} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label={
          open ? t.nutritionCoach.closeCoach : t.nutritionCoach.openCoach
        }
        onClick={() => setOpen((value) => !value)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent shadow-[0_12px_32px_rgb(255_166_43_/_40%)]"
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
