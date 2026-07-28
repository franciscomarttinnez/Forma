import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg" | "hero";
  variant?: "mark" | "badge" | "wordmark" | "hero";
};

const markSizes = {
  sm: 28,
  md: 36,
  lg: 56,
  hero: 168,
};

const badgeSizes = {
  sm: 32,
  md: 40,
  lg: 64,
  hero: 112,
};

const wordmarkSizes = {
  sm: { width: 100, height: 36 },
  md: { width: 132, height: 48 },
  lg: { width: 200, height: 72 },
  hero: { width: 280, height: 100 },
};

export function Logo({
  className,
  showWordmark = true,
  size = "md",
  variant = "mark",
}: LogoProps) {
  if (variant === "hero") {
    const px = markSizes.hero;
    return (
      <div className={cn("inline-flex flex-col items-center gap-5", className)}>
        <Image
          src="/brand/logo-hero.png"
          alt="Forma"
          width={px}
          height={px}
          className="object-contain drop-shadow-[0_18px_40px_rgb(255_166_43_/_28%)]"
          priority
        />
        {showWordmark ? (
          <span className="font-display text-5xl font-semibold tracking-[-0.04em] text-foreground md:text-6xl">
            Forma
          </span>
        ) : null}
      </div>
    );
  }

  if (variant === "wordmark") {
    const dims = wordmarkSizes[size];
    return (
      <Image
        src="/brand/logo-wordmark.png"
        alt="Forma"
        width={dims.width}
        height={dims.height}
        className={cn("rounded-2xl object-contain", className)}
        priority={size === "hero"}
      />
    );
  }

  if (variant === "badge") {
    const px = badgeSizes[size];
    return (
      <Image
        src="/brand/logo-mark-on-orange.png"
        alt="Forma"
        width={px}
        height={px}
        className={cn(
          "rounded-2xl object-contain shadow-[0_10px_30px_rgb(255_166_43_/_28%)]",
          className,
        )}
        priority={size === "hero"}
      />
    );
  }

  const px = markSizes[size];

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/brand/logo-mark.png"
        alt=""
        aria-hidden
        width={px}
        height={px}
        className="object-contain"
        priority={size === "hero"}
      />
      {showWordmark ? (
        <span
          className={cn(
            "font-display font-semibold tracking-tight text-foreground",
            size === "sm" && "text-lg",
            size === "md" && "text-xl",
            size === "lg" && "text-3xl",
            size === "hero" && "text-5xl md:text-6xl",
          )}
        >
          Forma
        </span>
      ) : (
        <span className="sr-only">Forma</span>
      )}
    </div>
  );
}
