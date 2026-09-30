import type { Metadata } from "next"
import { TodayView } from "@/components/app/today-view"
import { getHabits, getLocalHour, getToday } from "@/lib/data"

export const metadata: Metadata = { title: "Today" }

function greeting(hour: number) {
  if (hour < 5) return "Burning the midnight oil"
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export default async function TodayPage() {
  const [habits, today, hour] = await Promise.all([getHabits(), getToday(), getLocalHour()])
  const dateLabel = new Date(`${today}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })

  return <TodayView habits={habits} today={today} dateLabel={dateLabel} greeting={greeting(hour)} />
}
