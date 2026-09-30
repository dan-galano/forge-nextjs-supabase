"use client"

import { useOptimistic, useTransition } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Flame, MoreHorizontal, Pencil, Plus, Trash2, Trophy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HabitIcon } from "@/lib/habit-icons"
import { accentHex, streaks, type HabitWithDates } from "@/lib/habits"
import { cn } from "@/lib/utils"
import { deleteHabit, reorderHabits, setArchived } from "@/app/(app)/actions"
import { useHabitDialog } from "./habit-dialog-context"

export function HabitsManager({
  active,
  archived,
  today,
}: {
  active: HabitWithDates[]
  archived: HabitWithDates[]
  today: string
}) {
  const { openCreate, openEdit } = useHabitDialog()
  const [, startTransition] = useTransition()
  const [order, setOrder] = useOptimistic(active)

  const act = (fn: () => Promise<{ error?: string }>, success?: string) =>
    startTransition(async () => {
      const res = await fn()
      if (res.error) toast.error(res.error)
      else if (success) toast.success(success)
    })

  const move = (index: number, delta: number) => {
    const next = [...order]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    startTransition(async () => {
      setOrder(next)
      const res = await reorderHabits(next.map((h) => h.id))
      if (res.error) toast.error(res.error)
    })
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-14">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Habits</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Everything you&rsquo;re building, one day at a time.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus data-icon="inline-start" />
          New habit
        </Button>
      </header>

      {order.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          No active habits yet.{" "}
          <button onClick={openCreate} className="text-foreground underline-offset-4 hover:underline">
            Create one
          </button>
          .
        </div>
      ) : (
        <motion.ul layout className="hairline mt-8 overflow-hidden rounded-2xl bg-surface/50">
          <AnimatePresence initial={false}>
            {order.map((h, i) => (
              <motion.li
                key={h.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className={cn(i > 0 && "border-t")}
              >
                <Row habit={h} today={today}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Options for ${h.name}`} className="text-muted-foreground">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onSelect={() => openEdit(h)}>
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={i === 0} onSelect={() => move(i, -1)}>
                        <ArrowUp />
                        Move up
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={i === order.length - 1} onSelect={() => move(i, 1)}>
                        <ArrowDown />
                        Move down
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => act(() => setArchived(h.id, true), `Archived “${h.name}”`)}>
                        <Archive />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Row>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      {archived.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground/80 uppercase">Archived</h2>
          <ul className="overflow-hidden rounded-2xl border opacity-80">
            {archived.map((h, i) => (
              <li key={h.id} className={cn(i > 0 && "border-t")}>
                <Row habit={h} today={today} muted>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Restore ${h.name}`}
                    className="text-muted-foreground"
                    onClick={() => act(() => setArchived(h.id, false), `Restored “${h.name}”`)}
                  >
                    <ArchiveRestore />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${h.name}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      toast(`Delete “${h.name}” forever?`, {
                        description: "Its whole history will be removed.",
                        action: { label: "Delete", onClick: () => act(() => deleteHabit(h.id), "Habit deleted") },
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </Row>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Row({
  habit,
  today,
  muted,
  children,
}: {
  habit: HabitWithDates
  today: string
  muted?: boolean
  children: React.ReactNode
}) {
  const hex = accentHex(habit.color)
  const { current, best } = streaks(habit.dates, today)
  const since = new Date(habit.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  return (
    <div className="flex items-center gap-3.5 px-4 py-3">
      <span
        className={cn("grid size-9 shrink-0 place-items-center rounded-lg", muted && "grayscale")}
        style={{ background: `color-mix(in oklch, ${hex} 15%, transparent)`, color: hex }}
      >
        <HabitIcon name={habit.icon} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{habit.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Since {since} · {habit.dates.length} check-ins
        </p>
      </div>
      <div className="hidden items-center gap-4 text-xs text-muted-foreground tabular-nums sm:flex">
        <span className="flex items-center gap-1" title="Current streak">
          <Flame className="size-3.5" style={{ color: current ? hex : undefined }} />
          {current}
        </span>
        <span className="flex items-center gap-1" title="Best streak">
          <Trophy className="size-3.5" />
          {best}
        </span>
      </div>
      <div className="flex items-center gap-0.5">{children}</div>
    </div>
  )
}
