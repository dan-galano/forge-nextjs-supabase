import type { Metadata } from "next"
import { HabitsManager } from "@/components/app/habits-manager"
import { getHabits, getToday } from "@/lib/data"

export const metadata: Metadata = { title: "Habits" }

export default async function HabitsPage() {
  const [active, archived, today] = await Promise.all([getHabits(), getHabits({ archived: true }), getToday()])
  return <HabitsManager active={active} archived={archived} today={today} />
}
