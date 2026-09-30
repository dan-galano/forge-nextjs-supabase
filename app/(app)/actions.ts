"use server"

import { redirect } from "next/navigation"
import { refresh } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getToday } from "@/lib/data"
import { ACCENTS, addDays } from "@/lib/habits"
import { HABIT_ICONS } from "@/lib/habit-icons"

type Result = { error?: string }

/** Log the underlying database error server-side, return a friendly message to the client. */
function fail(message: string, cause: unknown): Result {
  console.error(`[ember] ${message}`, cause)
  return { error: message }
}

export type HabitInput = { name: string; icon: string; color: string }

function validate(input: HabitInput) {
  const name = input.name.trim()
  if (!name) return { error: "Give your habit a name." }
  if (name.length > 80) return { error: "Keep the name under 80 characters." }
  if (!(input.icon in HABIT_ICONS)) return { error: "Unknown icon." }
  if (!(input.color in ACCENTS)) return { error: "Unknown color." }
  return { value: { name, icon: input.icon, color: input.color } }
}

export async function toggleCompletion(habitId: string, date: string, done: boolean): Promise<Result> {
  const today = await getToday()
  // Allow back-filling the past week; +1 absorbs time zone edge cases.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < addDays(today, -7) || date > addDays(today, 1)) {
    return { error: "You can only check off the last 7 days." }
  }

  const supabase = await createClient()
  const { error } = done
    ? await supabase.from("completions").upsert({ habit_id: habitId, date }, { ignoreDuplicates: true })
    : await supabase.from("completions").delete().match({ habit_id: habitId, date })

  if (error) return fail("Couldn't save that. Try again.", error)
  refresh()
  return {}
}

export async function createHabit(input: HabitInput): Promise<Result> {
  const parsed = validate(input)
  if ("error" in parsed) return { error: parsed.error }

  const supabase = await createClient()
  const { data: last } = await supabase
    .from("habits")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase
    .from("habits")
    .insert({ ...parsed.value, position: (last?.position ?? -1) + 1 })

  if (error) return fail("Couldn't create habit.", error)
  refresh()
  return {}
}

export async function updateHabit(id: string, input: HabitInput): Promise<Result> {
  const parsed = validate(input)
  if ("error" in parsed) return { error: parsed.error }

  const supabase = await createClient()
  const { error } = await supabase.from("habits").update(parsed.value).eq("id", id)
  if (error) return fail("Couldn't update habit.", error)
  refresh()
  return {}
}

export async function setArchived(id: string, archived: boolean): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("habits")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
  if (error) return fail("Couldn't update habit.", error)
  refresh()
  return {}
}

export async function deleteHabit(id: string): Promise<Result> {
  const supabase = await createClient()
  const { error } = await supabase.from("habits").delete().eq("id", id)
  if (error) return fail("Couldn't delete habit.", error)
  refresh()
  return {}
}

/** Persist a new order for the given habit ids. */
export async function reorderHabits(ids: string[]): Promise<Result> {
  const supabase = await createClient()
  const results = await Promise.all(
    ids.map((id, position) => supabase.from("habits").update({ position }).eq("id", id))
  )
  const failed = results.find((r) => r.error)
  if (failed) return fail("Couldn't reorder habits.", failed.error)
  refresh()
  return {}
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}
