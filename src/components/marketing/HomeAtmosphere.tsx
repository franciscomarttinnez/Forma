"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

/**
 * Marketing home atmosphere: full-bleed gym photo, amber geometry, soft motion.
 * Kept dark enough that logo + hero type stay readable.
 */
export function HomeAtmosphere() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0c0c0d]">
      {/* Photo plane */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2400&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] opacity-[0.42] saturate-[0.85] contrast-[1.05]"
        />
        {/* Dark wash so brand stays first */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0c0c0d_0%,rgb(12_12_13_/_55%)_28%,rgb(12_12_13_/_72%)_58%,#0c0c0d_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_20%,transparent_0%,rgb(12_12_13_/_75%)_100%)]" />
      </div>

      {/* Amber energy wash */}
      <motion.div
        className="absolute -left-1/4 top-[-10%] h-[55vh] w-[70vw] rounded-full bg-[radial-gradient(circle,rgb(255_166_43_/_18%),transparent_68%)] blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.45, 0.75, 0.45], scale: [1, 1.06, 1] }
        }
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-1/5 bottom-[-5%] h-[45vh] w-[55vw] rounded-full bg-[radial-gradient(circle,rgb(255_166_43_/_10%),transparent_70%)] blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.35, 0.6, 0.35], x: [0, -24, 0] }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px",
        }}
      />

      {/* Bottom fade into content sections */}
      <div className="absolute inset-x-0 bottom-0 h-[28vh] bg-gradient-to-t from-[#0c0c0d] to-transparent" />
    </div>
  );
}
