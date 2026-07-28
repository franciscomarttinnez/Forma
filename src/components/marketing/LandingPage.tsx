"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Logo } from "@/components/brand/Logo";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease },
  },
};

const featureMeta = [
  {
    id: "routine",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "coach",
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "nutrition",
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=80",
  },
] as const;

type LandingPageProps = {
  isAuthenticated: boolean;
  appHref: string;
};

function PrimaryCta({
  isAuthenticated,
  appHref,
  size = "lg",
}: {
  isAuthenticated: boolean;
  appHref: string;
  size?: "sm" | "md" | "lg";
}) {
  const { t } = useI18n();
  if (isAuthenticated) {
    return (
      <Link href={appHref}>
        <Button size={size}>{t.marketing.goToPlan}</Button>
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Link href="/signup">
        <Button size={size}>{t.marketing.createRoutine}</Button>
      </Link>
      <Link href="/login">
        <Button size={size} variant="secondary">
          {t.marketing.haveAccount}
        </Button>
      </Link>
    </div>
  );
}

export function LandingPage({ isAuthenticated, appHref }: LandingPageProps) {
  const { t } = useI18n();

  const features = [
    {
      ...featureMeta[0],
      eyebrow: t.marketing.featureRoutineEyebrow,
      title: t.marketing.featureRoutineTitle,
      description: t.marketing.featureRoutineDesc,
    },
    {
      ...featureMeta[1],
      eyebrow: t.marketing.featureCoachEyebrow,
      title: t.marketing.featureCoachTitle,
      description: t.marketing.featureCoachDesc,
    },
    {
      ...featureMeta[2],
      eyebrow: t.marketing.featureNutritionEyebrow,
      title: t.marketing.featureNutritionTitle,
      description: t.marketing.featureNutritionDesc,
    },
  ];

  return (
    <div className="relative w-full">
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-5xl flex-col items-center justify-center px-6 pb-16 text-center">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex w-full max-w-2xl flex-col items-center"
        >
          <motion.div variants={item}>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Logo variant="hero" showWordmark={false} />
            </motion.div>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-8 font-display text-[1.65rem] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl"
          >
            <span className="block whitespace-nowrap">
              {t.marketing.heroLine1}
            </span>
            <span className="mt-1 block whitespace-nowrap">
              {t.marketing.heroLine2Before}{" "}
              <span className="text-accent">Forma</span>
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-lg text-lg font-light leading-relaxed text-muted md:text-xl"
          >
            {isAuthenticated
              ? t.marketing.heroSubAuth
              : t.marketing.heroSub}
          </motion.p>

          <motion.div variants={item} className="mt-10">
            <PrimaryCta isAuthenticated={isAuthenticated} appHref={appHref} />
          </motion.div>

          <motion.a
            variants={item}
            href="#funciones"
            className="mt-14 inline-flex flex-col items-center gap-2 text-sm text-muted transition hover:text-foreground"
          >
            <span>{t.marketing.discover}</span>
            <motion.span
              aria-hidden
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="text-accent"
            >
              ↓
            </motion.span>
          </motion.a>
        </motion.div>
      </main>

      <section id="funciones" className="relative z-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 py-24 md:gap-32 md:py-32">
          {features.map((feature, index) => {
            const imageRight = index % 2 === 1;
            return (
              <motion.article
                key={feature.id}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, ease }}
                className={cn(
                  "grid items-center gap-10 md:grid-cols-2 md:gap-14",
                  imageRight && "md:[&>*:first-child]:order-2",
                )}
              >
                <div className="overflow-hidden rounded-[2rem] bg-muted-bg">
                  <Image
                    src={feature.image}
                    alt=""
                    width={1400}
                    height={1050}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="h-auto w-full object-cover"
                    priority={index === 0}
                  />
                </div>

                <div
                  className={cn(
                    "max-w-md",
                    imageRight ? "md:mr-auto" : "md:ml-auto",
                  )}
                >
                  <p className="text-sm font-medium uppercase tracking-[0.14em] text-accent md:text-base">
                    {feature.eyebrow}
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-4xl">
                    {feature.title}
                  </h2>
                  <p className="mt-4 text-lg font-light leading-relaxed text-muted">
                    {feature.description}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.65, ease }}
          className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center md:py-28"
        >
          <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            {t.marketing.ctaTitle}
          </h2>
          <p className="mt-4 max-w-md text-lg font-light text-muted">
            {t.marketing.ctaSub}
          </p>
          <div className="mt-8">
            <PrimaryCta isAuthenticated={isAuthenticated} appHref={appHref} />
          </div>
        </motion.div>
      </section>

      <footer className="relative z-10 px-6 py-8 text-center text-sm text-muted">
        {t.marketing.footer}
      </footer>
    </div>
  );
}
