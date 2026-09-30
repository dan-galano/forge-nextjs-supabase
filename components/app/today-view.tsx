"use client"

import { useEffect, useOptimistic, useTransition } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Flame, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { HabitWithDates } from "@/lib/habits"
import { toggleCompletion } from "@/app/(app)/actions"
import { isTypingTarget } from "./app-shell"
import { useHabitDialog } from "./habit-dialog-context"
import { HabitRow } from "./habit-row"
import { ProgressRing } from "./progress-ring"

type Toggle = { id: string; date: string; done: boolean }

export function TodayView({
  habits,
  today,
  dateLabel,
  greeting,
}: {
  habits: HabitWithDates[]
  today: string
  dateLabel: string
  greeting: string
}) {
  const { openCreate } = useHabitDialog()
  const [, startTransition] = useTransition()
  const [optimistic, applyToggle] = useOptimistic(habits, (state, { id, date, done }: Toggle) =>
    state.map((h) =>
      h.id !== id ? h : { ...h, dates: done ? [...h.dates, date] : h.dates.filter((d) => d !== date) }
    )
  )

  const toggle = (id: string, date: string, done: boolean) =>
    startTransition(async () => {
      applyToggle({ id, date, done })
      const res = await toggleCompletion(id, date, done)
      if (res.error) toast.error(res.error)
    })

  // Press 1–9 to toggle the matching habit for today.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target) || document.querySelector("[role=dialog]")) return
      const n = Number(e.key)
      const h = n >= 1 && n <= 9 ? optimistic[n - 1] : undefined
      if (h) toggle(h.id, today, !h.dates.includes(today))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const doneCount = optimistic.filter((h) => h.dates.includes(today)).length
  const allDone = optimistic.length > 0 && doneCount === optimistic.length

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-14">
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{greeting}</h1>
          {optimistic.length > 0 && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              <span className="text-foreground tabular-nums">{doneCount}</span> of{" "}
              <span className="tabular-nums">{optimistic.length}</span> done today
            </p>
          )}
        </div>
        {optimistic.length > 0 && <ProgressRing value={doneCount} total={optimistic.length} />}
      </header>

      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-ember/25 bg-ember/[0.07] px-4 py-3 text-sm">
              <motion.span
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-ember"
              >
                <Flame className="size-5" />
              </motion.span>
              <span>
                <span className="font-medium">Perfect day.</span>{" "}
                <span className="text-muted-foreground">Every habit done, and the flame burns bright.</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {optimistic.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <>
          <ul className="mt-8 space-y-1.5">
            <AnimatePresence initial={false}>
              {optimistic.map((h, i) => (
                <motion.li
                  key={h.id}
                  layout="position"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                >
                  <HabitRow habit={h} today={today} index={i} onToggle={toggle} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={openCreate} className="text-muted-foreground">
              <Plus data-icon="inline-start" />
              Add habit
            </Button>
            <p className="hidden text-xs text-muted-foreground/70 sm:block">
              Press <kbd className="rounded border px-1 font-mono">1</kbd>–<kbd className="rounded border px-1 font-mono">9</kbd> to check off ·{" "}
              <kbd className="rounded border px-1 font-mono">⌘K</kbd> for commands
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="hairline relative mt-10 overflow-hidden rounded-2xl bg-surface/60 px-6 py-14 text-center"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 -top-24 mx-auto size-64 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklch, var(--ember) 45%, transparent), transparent 70%)" }}
      />
      <span className="relative mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-ember/15 text-ember">
        <Sparkles className="size-6" />
      </span>
      <h2 className="relative text-lg font-semibold tracking-tight">Light your first flame</h2>
      <p className="relative mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
        Pick one small thing you want to do every day. You can always add more later.
      </p>
      <Button onClick={onCreate} className="relative mt-6">
        <Plus data-icon="inline-start" />
        Create a habit
      </Button>
    </motion.div>
  )
}
