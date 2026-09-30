export type Habit = {
  id: string
  name: string
  icon: string
  color: AccentKey
  position: number
  archived_at: string | null
  created_at: string
}

export type HabitWithDates = Habit & { dates: string[] }

export const ACCENTS = {
  ember: { label: "Ember", hex: "#FF6B35" },
  amber: { label: "Amber", hex: "#F5B83D" },
  lime: { label: "Lime", hex: "#A3E635" },
  emerald: { label: "Emerald", hex: "#34D399" },
  cyan: { label: "Cyan", hex: "#22D3EE" },
  blue: { label: "Blue", hex: "#60A5FA" },
  violet: { label: "Violet", hex: "#A78BFA" },
  rose: { label: "Rose", hex: "#FB7185" },
} as const

export type AccentKey = keyof typeof ACCENTS

export function accentHex(color: string) {
  return (ACCENTS as Record<string, { hex: string }>)[color]?.hex ?? ACCENTS.ember.hex
}

/** YYYY-MM-DD for a Date in the given IANA time zone. */
export function isoDate(d: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

/** Shift a YYYY-MM-DD string by n days (calendar math in UTC, so no DST drift). */
export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function lastNDays(today: string, n: number) {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)))
}

/**
 * Current streak counts consecutive completed days ending today; if today isn't
 * done yet, it's still "alive" from yesterday. Best is the longest run ever.
 */
export function streaks(dates: Iterable<string>, today: string) {
  const set = new Set(dates)
  let current = 0
  let cursor = set.has(today) ? today : addDays(today, -1)
  while (set.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }

  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of [...set].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }

  return { current, best }
}
