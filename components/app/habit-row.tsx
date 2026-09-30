"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Flame } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { HabitIcon } from "@/lib/habit-icons"
import { accentHex, lastNDays, streaks, type HabitWithDates } from "@/lib/habits"
import { cn } from "@/lib/utils"

const WEEKDAY = new Intl.DateTimeFormat("en-US", { weekday: "narrow", timeZone: "UTC" })
const LONG_DATE = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })
const utc = (iso: string) => new Date(`${iso}T00:00:00Z`)

export function HabitRow({
  habit,
  today,
  index,
  onToggle,
}: {
  habit: HabitWithDates
  today: string
  index: number
  onToggle: (id: string, date: string, done: boolean) => void
}) {
  const hex = accentHex(habit.color)
  const dates = useMemo(() => new Set(habit.dates), [habit.dates])
  const { current, best } = useMemo(() => streaks(habit.dates, today), [habit.dates, today])
  const done = dates.has(today)
  const week = lastNDays(today, 7).slice(0, 6)
  const [burst, setBurst] = useState(0)

  const toggleToday = () => {
    if (!done) setBurst((b) => b + 1)
    onToggle(habit.id, today, !done)
  }

  return (
    <div
      onClick={toggleToday}
      className={cn(
        "group relative flex cursor-pointer items-center gap-3.5 rounded-xl border px-3.5 py-3 transition-colors select-none",
        done ? "border-transparent" : "border-border bg-surface/50 hover:bg-surface"
      )}
      style={done ? { background: `color-mix(in oklch, ${hex} 8%, transparent)`, borderColor: `color-mix(in oklch, ${hex} 22%, transparent)` } : undefined}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-xl transition-transform group-active:scale-95"
        style={{ background: `color-mix(in oklch, ${hex} 15%, transparent)`, color: hex }}
      >
        <HabitIcon name={habit.icon} className="size-[18px]" />
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[0.95rem] font-medium transition-colors", done && "text-foreground/80")}>
          {habit.name}
        </p>
        <div className="mt-1.5 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {week.map((d) => {
            const on = dates.has(d)
            return (
              <Tooltip key={d}>
                <TooltipTrigger asChild>
                  <button
                    aria-label={`${on ? "Uncheck" : "Check"} ${LONG_DATE.format(utc(d))}`}
                    onClick={() => onToggle(habit.id, d, !on)}
                    className="grid size-4 place-items-center rounded-[5px] text-[9px] font-medium transition-all hover:scale-110"
                    style={{
                      background: on ? hex : "var(--muted)",
                      color: on ? "rgb(0 0 0 / 0.7)" : "var(--muted-foreground)",
                    }}
                  >
                    {WEEKDAY.format(utc(d))}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{LONG_DATE.format(utc(d))}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1 text-sm tabular-nums text-muted-foreground">
            <motion.span
              key={`flame-${current}`}
              initial={done ? { scale: 1.5, rotate: -15 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 12 }}
            >
              <Flame
                className="size-4 transition-colors"
                style={{ color: current > 0 ? hex : undefined, fill: done ? `color-mix(in oklch, ${hex} 35%, transparent)` : "none" }}
              />
            </motion.span>
            <span className="relative inline-flex min-w-[1.5ch] overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={current}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={cn(current > 0 && "text-foreground")}
                >
                  {current}
                </motion.span>
              </AnimatePresence>
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {current} day streak · best {best}
        </TooltipContent>
      </Tooltip>

      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleToday()
        }}
        aria-pressed={done}
        aria-label={`${done ? "Uncheck" : "Check off"} ${habit.name}${index < 9 ? ` (${index + 1})` : ""}`}
        className="relative grid size-9 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <motion.span
          className="absolute inset-0 rounded-full border-[1.5px]"
          initial={false}
          animate={{
            backgroundColor: done ? hex : "rgba(0,0,0,0)",
            borderColor: done ? hex : "var(--input)",
            scale: done ? [1, 0.85, 1.1, 1] : 1,
            boxShadow: done ? `0 0 18px color-mix(in oklch, ${hex} 55%, transparent)` : "0 0 0 transparent",
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        <motion.span
          className="relative"
          initial={false}
          animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 0.3 }}
          transition={{ type: "spring", stiffness: 600, damping: 22 }}
        >
          <Check className="size-[18px] text-black/75" strokeWidth={3} />
        </motion.span>
        {!done && index < 9 && (
          <span className="absolute font-mono text-[10px] text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/70">
            {index + 1}
          </span>
        )}
        <Burst key={burst} color={hex} active={burst > 0} />
      </button>
    </div>
  )
}

/** A quick ring of sparks that fires each time a habit is checked. */
function Burst({ color, active }: { color: string; active: boolean }) {
  if (!active) return null
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <motion.span
            key={i}
            className="absolute top-1/2 left-1/2 size-1.5 rounded-full"
            style={{ background: color, marginLeft: -3, marginTop: -3 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * 26, y: Math.sin(angle) * 26, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.3, 1] }}
          />
        )
      })}
    </span>
  )
}
