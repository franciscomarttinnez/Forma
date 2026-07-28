"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const next = locale === "es" ? "en" : "es";

  return (
    <button
      type="button"
      aria-label={locale === "es" ? t.common.switchToEn : t.common.switchToEs}
      title={locale === "es" ? t.common.switchToEn : t.common.switchToEs}
      onClick={() => setLocale(next)}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold tracking-wide text-muted transition-colors duration-300 hover:bg-muted-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        className,
      )}
    >
      <span className={locale === "es" ? "text-foreground" : "opacity-45"}>
        ES
      </span>
      <span className="opacity-30" aria-hidden>
        /
      </span>
      <span className={locale === "en" ? "text-foreground" : "opacity-45"}>
        EN
      </span>
    </button>
  );
}
