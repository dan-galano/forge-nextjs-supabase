import { CalendarCheck, ListChecks, Settings } from "lucide-react"

export const NAV = [
  { href: "/today", label: "Today", icon: CalendarCheck, shortcut: "G T" },
  { href: "/habits", label: "Habits", icon: ListChecks, shortcut: "G H" },
  { href: "/settings", label: "Settings", icon: Settings, shortcut: "G S" },
] as const
