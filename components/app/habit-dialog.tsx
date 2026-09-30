"use client"

import { useState, useTransition } from "react"
import { motion } from "motion/react"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HABIT_ICONS, HabitIcon } from "@/lib/habit-icons"
import { ACCENTS, accentHex, type AccentKey, type Habit } from "@/lib/habits"
import { cn } from "@/lib/utils"
import { createHabit, updateHabit } from "@/app/(app)/actions"

const SUGGESTIONS = [
  { name: "Read 20 minutes", icon: "book-open", color: "violet" },
  { name: "Workout", icon: "dumbbell", color: "ember" },
  { name: "Meditate", icon: "wind", color: "cyan" },
  { name: "Drink 2L water", icon: "droplets", color: "blue" },
  { name: "Journal", icon: "pen-line", color: "amber" },
] as const

export function HabitDialog({
  open,
  onOpenChange,
  habit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit: Habit | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        {/* Remount the form each time so it resets to the habit being edited. */}
        {open && <HabitForm key={habit?.id ?? "new"} habit={habit} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function HabitForm({ habit, onDone }: { habit: Habit | null; onDone: () => void }) {
  const [name, setName] = useState(habit?.name ?? "")
  const [icon, setIcon] = useState(habit?.icon ?? "sparkles")
  const [color, setColor] = useState<string>(habit?.color ?? "ember")
  const [pending, startTransition] = useTransition()
  const hex = accentHex(color)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const input = { name, icon, color }
      const res = habit ? await updateHabit(habit.id, input) : await createHabit(input)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(habit ? "Habit updated" : `“${name.trim()}” added`)
      onDone()
    })
  }

  return (
    <form onSubmit={submit}>
      <div
        className="relative border-b px-6 pt-6 pb-5"
        style={{ background: `radial-gradient(120% 90% at 50% 0%, color-mix(in oklch, ${hex} 14%, transparent), transparent 70%)` }}
      >
        <DialogHeader>
          <DialogTitle>{habit ? "Edit habit" : "New habit"}</DialogTitle>
          <DialogDescription>{habit ? "Tweak the name, icon or color." : "Something small you'll do every day."}</DialogDescription>
        </DialogHeader>
        <div className="mt-5 flex items-center gap-3 rounded-xl border bg-background/60 px-3 py-2.5 backdrop-blur">
          <motion.span
            key={icon + color}
            initial={{ scale: 0.7, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="grid size-9 place-items-center rounded-lg"
            style={{ background: `color-mix(in oklch, ${hex} 16%, transparent)`, color: hex }}
          >
            <HabitIcon name={icon} className="size-[18px]" />
          </motion.span>
          <span className={cn("flex-1 truncate text-sm", !name && "text-muted-foreground")}>{name || "Your habit"}</span>
          <span className="grid size-7 place-items-center rounded-full" style={{ background: hex }}>
            <Check className="size-4 text-black/80" strokeWidth={3} />
          </span>
        </div>
      </div>

      <div className="space-y-5 px-6 py-5">
        <div className="space-y-2">
          <Label htmlFor="habit-name">Name</Label>
          <Input
            id="habit-name"
            autoFocus
            required
            maxLength={80}
            placeholder="e.g. Read 20 minutes"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9"
          />
          {!habit && !name && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => {
                    setName(s.name)
                    setIcon(s.icon)
                    setColor(s.color)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                >
                  <HabitIcon name={s.icon} className="size-3" />
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
            {(Object.keys(ACCENTS) as AccentKey[]).map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={color === key}
                aria-label={ACCENTS[key].label}
                onClick={() => setColor(key)}
                className={cn(
                  "size-7 rounded-full ring-offset-2 ring-offset-popover transition-all hover:scale-110",
                  color === key && "ring-2"
                )}
                style={{ background: ACCENTS[key].hex, ["--tw-ring-color" as string]: ACCENTS[key].hex }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Icon</Label>
          <div className="grid grid-cols-8 gap-1" role="radiogroup" aria-label="Icon">
            {Object.keys(HABIT_ICONS).map((key) => {
              const selected = icon === key
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={key}
                  onClick={() => setIcon(key)}
                  className={cn(
                    "grid aspect-square place-items-center rounded-lg transition-colors",
                    selected ? "" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                  style={selected ? { background: `color-mix(in oklch, ${hex} 18%, transparent)`, color: hex } : undefined}
                >
                  <HabitIcon name={key} className="size-4" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-3">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {habit ? "Save changes" : "Create habit"}
        </Button>
      </div>
    </form>
  )
}
