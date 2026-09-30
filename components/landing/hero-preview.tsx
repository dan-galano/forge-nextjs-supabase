"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Flame } from "lucide-react"
import { HabitIcon } from "@/lib/habit-icons"
import { accentHex } from "@/lib/habits"

const DEMO = [
  { name: "Read 20 minutes", icon: "book-open", color: "violet", streak: 12 },
  { name: "Morning run", icon: "footprints", color: "ember", streak: 5 },
  { name: "Meditate", icon: "wind", color: "cyan", streak: 31 },
  { name: "Drink 2L water", icon: "droplets", color: "blue", streak: 8 },
]

/** A self-playing mock of the Today screen: habits get checked off one by one, then reset. */
export function HeroPreview() {
  const [done, setDone] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDone((d) => (d >= DEMO.length + 2 ? 0 : d + 1)), done === 0 ? 1400 : 1100)
    return () => clearTimeout(t)
  }, [done])

  const completed = Math.min(done, DEMO.length)

  return (
    <div className="relative mx-auto w-full max-w-xl text-left">
      <div
        aria-hidden
        className="absolute -inset-x-10 -top-10 -bottom-16 -z-10 rounded-[3rem] opacity-70 blur-3xl"
        style={{ background: "radial-gradient(60% 60% at 50% 40%, color-mix(in oklch, var(--ember) 35%, transparent), transparent 70%)" }}
      />
      <div className="hairline rounded-2xl bg-surface/80 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between px-3 pt-2 pb-3">
          <div>
            <p className="text-xs text-muted-foreground">Wednesday</p>
            <p className="text-sm font-medium">Today</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
            <span>
              {completed}/{DEMO.length}
            </span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-ember"
                animate={{ width: `${(completed / DEMO.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 26 }}
              />
            </div>
          </div>
        </div>
        <ul className="space-y-1">
          {DEMO.map((h, i) => {
            const isDone = i < completed
            const hex = accentHex(h.color)
            return (
              <li
                key={h.name}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                style={{ background: isDone ? `color-mix(in oklch, ${hex} 7%, transparent)` : undefined }}
              >
                <span
                  className="grid size-8 place-items-center rounded-lg"
                  style={{ background: `color-mix(in oklch, ${hex} 16%, transparent)`, color: hex }}
                >
                  <HabitIcon name={h.icon} className="size-4" />
                </span>
                <span className="flex-1 text-sm">{h.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                  <Flame className="size-3.5" style={{ color: isDone ? hex : undefined }} />
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={isDone ? "d" : "n"}
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -8, opacity: 0 }}
                    >
                      {h.streak + (isDone ? 1 : 0)}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <motion.span
                  className="grid size-7 place-items-center rounded-full border"
                  animate={{
                    backgroundColor: isDone ? hex : "rgba(0,0,0,0)",
                    borderColor: isDone ? hex : "var(--border)",
                    scale: isDone ? [1, 1.18, 1] : 1,
                  }}
                  transition={{ duration: 0.35 }}
                >
                  <motion.span animate={{ opacity: isDone ? 1 : 0, scale: isDone ? 1 : 0.4 }}>
                    <Check className="size-4 text-black/80" strokeWidth={3} />
                  </motion.span>
                </motion.span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
