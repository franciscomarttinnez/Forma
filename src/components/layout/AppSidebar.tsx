"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useI18n } from "@/components/providers/I18nProvider";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { appNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label={t.nav.homeAria}
        >
          <Image
            src="/brand/logo-mark-on-orange.png"
            alt=""
            width={32}
            height={32}
            className="rounded-xl"
          />
          <span className="font-display text-lg font-semibold tracking-tight">
            Forma
          </span>
        </Link>
        <div className="flex items-center gap-0.5">
          <LanguageToggle />
          <ThemeToggle />
          <button
            type="button"
            aria-label={t.common.openMenu}
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-muted-bg hover:text-foreground"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t.common.closeMenu}
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(84vw,300px)] flex-col border-r border-border bg-card p-4 shadow-[var(--shadow-soft)]">
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setMobileOpen(false)}
                aria-label={t.nav.homeAria}
              >
                <Image
                  src="/brand/logo-mark-on-orange.png"
                  alt=""
                  width={36}
                  height={36}
                  className="rounded-xl"
                />
                <span className="font-display text-xl font-semibold">Forma</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-full px-2 py-1 text-muted hover:bg-muted-bg"
                aria-label={t.common.close}
              >
                ✕
              </button>
            </div>
            <NavLinks
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
            <div className="mt-auto space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-2 px-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              <SignOutButton />
            </div>
          </aside>
        </div>
      ) : null}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/80 px-4 py-6 backdrop-blur md:flex">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <Image
            src="/brand/logo-mark-on-orange.png"
            alt=""
            width={40}
            height={40}
            className="rounded-2xl shadow-[0_8px_24px_rgb(255_166_43_/_25%)]"
          />
          <div>
            <p className="font-display text-xl font-semibold tracking-tight">
              Forma
            </p>
            <p className="text-xs text-muted">{t.nav.coachTagline}</p>
          </div>
        </Link>

        <NavLinks pathname={pathname} />

        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted">{t.common.language}</span>
            <LanguageToggle />
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted">{t.common.theme}</span>
            <ThemeToggle />
          </div>
          <SignOutButton />
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5 gap-1 px-1 py-2">
          {appNavItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium",
                    active ? "text-accent" : "text-muted",
                  )}
                >
                  <NavIcon name={item.icon} className="h-5 w-5" />
                  <span>{t.nav[item.labelKey]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {appNavItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onNavigate?.()}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition",
              active
                ? "bg-accent-soft text-accent-ink"
                : "text-foreground hover:bg-muted-bg",
            )}
          >
            <span
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background",
                active && "border-accent/30 bg-card",
              )}
            >
              <NavIcon name={item.icon} className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-semibold tracking-tight">
                {t.nav[item.labelKey]}
              </span>
              <span className="block truncate text-xs text-muted">
                {t.nav[item.descKey]}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NavIcon({
  name,
  className,
}: {
  name: AppNavItemIcon;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    className,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "routine":
      return (
        <svg {...common}>
          <path
            d="M6 4h9l3 3v13H6V4Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M9 10h6M9 14h6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle
            cx="12"
            cy="8"
            r="3.2"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M5 19c1.6-3 4-4.5 7-4.5S17.4 16 19 19"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "nutrition":
      return (
        <svg {...common}>
          <path
            d="M12 3c2 3 5 5 5 9a5 5 0 1 1-10 0c0-4 3-6 5-9Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "library":
      return (
        <svg {...common}>
          <path
            d="M5 5h5v14H5V5Zm9 0h5v14h-5V5Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect
            x="4"
            y="6"
            width="16"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M8 4v4M16 4v4M4 11h16"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

type AppNavItemIcon = (typeof appNavItems)[number]["icon"];
