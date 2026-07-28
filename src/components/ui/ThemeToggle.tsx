"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

function subscribe() {
  return () => {};
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted) {
    return (
      <span
        className={cn("inline-flex h-9 w-9 rounded-full", className)}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? t.theme.toLight : t.theme.toDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "group relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors duration-300 hover:bg-muted-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        className,
      )}
    >
      <SunIcon
        className={cn(
          "absolute h-[18px] w-[18px] transition-all duration-300",
          isDark
            ? "scale-75 rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100",
        )}
      />
      <MoonIcon
        className={cn(
          "absolute h-[18px] w-[18px] transition-all duration-300",
          isDark
            ? "scale-100 rotate-0 opacity-100"
            : "scale-75 -rotate-90 opacity-0",
        )}
      />
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z" />
    </svg>
  );
}
