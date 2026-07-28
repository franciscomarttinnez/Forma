"use client";

import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { useI18n } from "@/components/providers/I18nProvider";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
      {/* Subtle training photo + dark wash */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=70"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-[0.22]"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(
                180deg,
                rgb(12 12 13 / 72%) 0%,
                rgb(12 12 13 / 82%) 45%,
                rgb(12 12 13 / 92%) 100%
              )
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 20%, rgb(255 166 43 / 10%), transparent 60%)",
          }}
        />
      </div>

      <Link href="/" className="mb-10" aria-label={t.auth.backHome}>
        <Logo variant="badge" size="lg" />
      </Link>
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 text-left shadow-[var(--shadow-soft)] backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}
