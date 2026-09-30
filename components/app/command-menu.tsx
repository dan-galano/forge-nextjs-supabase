"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Check, LogOut, Monitor, Moon, Plus, Sun } from "lucide-react"
import { toast } from "sonner"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { HabitIcon } from "@/lib/habit-icons"
import { accentHex, type HabitWithDates } from "@/lib/habits"
import { signOut, toggleCompletion } from "@/app/(app)/actions"
import { NAV } from "./nav"
import { useHabitDialog } from "./habit-dialog-context"

export function CommandMenu({
  open,
  onOpenChange,
  habits,
  today,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  habits: HabitWithDates[]
  today: string
}) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const { openCreate } = useHabitDialog()
  const [, startTransition] = useTransition()

  const run = (fn: () => void) => {
    onOpenChange(false)
    fn()
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="sm:max-w-lg">
      <Command>
        <CommandInput placeholder="Type a command or search habits…" />
        <CommandList className="max-h-[360px]">
          <CommandEmpty>No results.</CommandEmpty>

          {habits.length > 0 && (
            <CommandGroup heading="Check off today">
              {habits.map((h) => {
                const done = h.dates.includes(today)
                return (
                  <CommandItem
                    key={h.id}
                    value={`check ${h.name}`}
                    onSelect={() =>
                      run(() =>
                        startTransition(async () => {
                          const res = await toggleCompletion(h.id, today, !done)
                          if (res.error) toast.error(res.error)
                          else toast.success(done ? `Unchecked “${h.name}”` : `“${h.name}” done 🔥`)
                        })
                      )
                    }
                  >
                    <span style={{ color: accentHex(h.color) }}>
                      <HabitIcon name={h.icon} />
                    </span>
                    {h.name}
                    {done && <Check className="ml-auto text-muted-foreground" />}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}

          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => run(openCreate)}>
              <Plus />
              New habit
              <CommandShortcut>N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("dark"))}>
              <Moon />
              Dark theme
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("light"))}>
              <Sun />
              Light theme
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("system"))}>
              <Monitor />
              System theme
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          <CommandGroup heading="Go to">
            {NAV.map(({ href, label, icon: Icon, shortcut }) => (
              <CommandItem key={href} value={`go ${label}`} onSelect={() => run(() => router.push(href))}>
                <Icon />
                {label}
                <CommandShortcut>{shortcut}</CommandShortcut>
              </CommandItem>
            ))}
            <CommandItem value="sign out log out" onSelect={() => run(() => startTransition(() => signOut()))}>
              <LogOut />
              Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
