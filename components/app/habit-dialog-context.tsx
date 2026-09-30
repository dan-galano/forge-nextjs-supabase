"use client"

import { createContext, useContext } from "react"
import type { Habit } from "@/lib/habits"

type Ctx = { openCreate: () => void; openEdit: (habit: Habit) => void }

export const HabitDialogContext = createContext<Ctx | null>(null)

export function useHabitDialog() {
  const ctx = useContext(HabitDialogContext)
  if (!ctx) throw new Error("useHabitDialog must be used inside <AppShell>")
  return ctx
}
