"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { Habit, HabitWithDates } from "@/lib/habits"
import { CommandMenu } from "./command-menu"
import { HabitDialog } from "./habit-dialog"
import { HabitDialogContext } from "./habit-dialog-context"
import { MobileNav, Sidebar } from "./sidebar"


export function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))
}

export function AppShell({
  children,
  habits,
  today,
  email,
  initialCollapsed,
}: {
  children: React.ReactNode
  habits: HabitWithDates[]
  today: string
  email: string | null
  initialCollapsed: boolean
}) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [commandOpen, setCommandOpen] = useState(false)
  const [dialog, setDialog] = useState<{ open: boolean; habit: Habit | null }>({ open: false, habit: null })
  const pendingG = useRef(false)

  // Persisted in a cookie so the server renders the right width with no flash.
  const toggleCollapsed = useCallback(
    () =>
      setCollapsed((c) => {
        document.cookie = `sidebar-collapsed=${c ? 0 : 1}; path=/; max-age=31536000; samesite=lax`
        return !c
      }),
    []
  )

  const openCreate = useCallback(() => setDialog({ open: true, habit: null }), [])
  const openEdit = useCallback((habit: Habit) => setDialog({ open: true, habit }), [])
  const ctx = useMemo(() => ({ openCreate, openEdit }), [openCreate, openEdit])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCommandOpen((o) => !o)
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target) || document.querySelector("[role=dialog]")) return

      const key = e.key.toLowerCase()
      if (pendingG.current) {
        pendingG.current = false
        const dest = { t: "/today", h: "/habits", s: "/settings" }[key]
        if (dest) router.push(dest)
        return
      }
      if (key === "g") {
        pendingG.current = true
        setTimeout(() => (pendingG.current = false), 800)
      } else if (key === "n") {
        e.preventDefault()
        openCreate()
      } else if (key === "[") {
        toggleCollapsed()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [router, openCreate, toggleCollapsed])

  return (
    <HabitDialogContext.Provider value={ctx}>
      <div className="flex min-h-dvh w-full">
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} onOpenCommand={() => setCommandOpen(true)} email={email} />
        <main className="min-w-0 flex-1 pb-28 md:pb-0">{children}</main>
      </div>
      <MobileNav onOpenCommand={() => setCommandOpen(true)} />
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} habits={habits} today={today} />
      <HabitDialog open={dialog.open} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} habit={dialog.habit} />
    </HabitDialogContext.Provider>
  )
}
