"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import type { Dictionary } from "@/lib/i18n/dictionaries";

function titleForPath(pathname: string, meta: Dictionary["meta"]) {
  if (pathname === "/") return meta.home;
  if (pathname.startsWith("/login")) return meta.login;
  if (pathname.startsWith("/signup")) return meta.signup;
  if (pathname.startsWith("/profile")) return meta.profile;
  if (pathname.startsWith("/onboarding")) return meta.onboarding;
  if (pathname.startsWith("/library")) return meta.library;
  if (pathname.startsWith("/calendar")) return meta.calendar;
  if (/^\/routine\/[^/]+\/edit/.test(pathname)) return meta.routineEdit;
  if (pathname.startsWith("/routine")) return meta.routine;
  if (pathname.startsWith("/nutrition/new")) return meta.nutritionNew;
  if (/^\/nutrition\/[^/]+\/edit/.test(pathname)) return meta.nutritionEdit;
  if (pathname.startsWith("/nutrition")) return meta.nutrition;
  return meta.defaultTitle;
}

/** Keeps the browser tab title in sync with locale + route. */
export function DocumentTitle() {
  const pathname = usePathname();
  const { t, locale } = useI18n();

  useEffect(() => {
    document.title = titleForPath(pathname, t.meta);
    document.documentElement.lang = locale;
  }, [pathname, t.meta, locale]);

  return null;
}
