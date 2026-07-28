"use client";

import { useEffect } from "react";
import { HomeAtmosphere } from "@/components/marketing/HomeAtmosphere";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add("home-atmosphere");
    return () => document.body.classList.remove("home-atmosphere");
  }, []);

  return (
    <>
      <HomeAtmosphere />
      <div className="relative z-0">{children}</div>
    </>
  );
}
