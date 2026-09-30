import "server-only"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { addDays, isoDate, type Habit, type HabitWithDates } from "@/lib/habits"

const HISTORY_DAYS = 400

/** The user's IANA time zone, from the cookie set by <TimezoneSync />. Falls back to UTC. */
export async function getTimeZone() {
  const tz = (await cookies()).get("tz")?.value
  if (!tz) return "UTC"
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz })
    return tz
  } catch {
    return "UTC"
  }
}

/** The user's local calendar date (YYYY-MM-DD). */
export async function getToday() {
  return isoDate(new Date(), await getTimeZone())
}

/** The user's local hour of day, 0–23. */
export async function getLocalHour() {
  const hour = new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: await getTimeZone() })
  return Number(hour.format(new Date()))
}

export async function getHabits({ archived = false } = {}): Promise<HabitWithDates[]> {
  const supabase = await createClient()
  const today = await getToday()

  let query = supabase
    .from("habits")
    .select("id, name, icon, color, position, archived_at, created_at, completions(date)")
    .gte("completions.date", addDays(today, -HISTORY_DAYS))
    .order("position")
    .order("created_at")
  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null)

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map(({ completions, ...habit }) => ({
    ...(habit as Habit),
    dates: (completions as { date: string }[]).map((c) => c.date),
  }))
}

export async function getUserEmail() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return (data?.claims.email as string | undefined) ?? null
}
