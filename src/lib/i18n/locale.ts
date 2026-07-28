export type AppLocale = "en" | "es";

export function parseLocale(value: unknown): AppLocale {
  return value === "es" ? "es" : "en";
}
