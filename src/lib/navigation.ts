export const appNavItems = [
  {
    href: "/profile",
    labelKey: "profile",
    descKey: "profileDesc",
    icon: "profile",
  },
  {
    href: "/routine",
    labelKey: "routine",
    descKey: "routineDesc",
    icon: "routine",
  },
  {
    href: "/nutrition",
    labelKey: "nutrition",
    descKey: "nutritionDesc",
    icon: "nutrition",
  },
  {
    href: "/library",
    labelKey: "library",
    descKey: "libraryDesc",
    icon: "library",
  },
  {
    href: "/calendar",
    labelKey: "calendar",
    descKey: "calendarDesc",
    icon: "calendar",
  },
] as const;

export type AppNavItem = (typeof appNavItems)[number];
