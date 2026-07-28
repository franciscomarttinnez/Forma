"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

export function MarketingHeader({
  isAuthenticated,
  appHref,
}: {
  isAuthenticated: boolean;
  appHref: string;
}) {
  const { t } = useI18n();

  return (
    <header className="relative z-20 flex w-full items-center justify-between px-4 py-4 sm:px-6">
      <Link href="/" aria-label={t.nav.homeAria}>
        <Logo size="sm" showWordmark={false} variant="badge" />
      </Link>
      <nav className="flex items-center gap-2 sm:gap-3">
        <LanguageToggle />
        {isAuthenticated ? (
          <Link href={appHref}>
            <Button size="sm">{t.marketing.goToPlan}</Button>
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="hidden text-sm text-muted transition hover:text-foreground sm:inline"
            >
              {t.marketing.login}
            </Link>
            <Link href="/signup">
              <Button size="sm">{t.marketing.start}</Button>
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
