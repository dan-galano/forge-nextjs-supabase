"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTransition } from "react"
import { useTheme } from "next-themes"
import { motion } from "motion/react"
import { ChevronsUpDown, Loader2, LogOut, Moon, PanelLeft, Plus, Search, Settings } from "lucide-react"
import { Logo, LogoMark } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { signOut } from "@/app/(app)/actions"
import { NAV } from "./nav"
import { useHabitDialog } from "./habit-dialog-context"

export function Sidebar({
  collapsed,
  onToggle,
  onOpenCommand,
  email,
}: {
  collapsed: boolean
  onToggle: () => void
  onOpenCommand: () => void
  email: string | null
}) {
  const pathname = usePathname()
  const { openCreate } = useHabitDialog()

  const item = (label: string, shortcut: string | undefined, node: React.ReactNode) =>
    collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="right">
          {label}
          {shortcut && <kbd className="ml-2 font-mono text-[10px] opacity-60">{shortcut}</kbd>}
        </TooltipContent>
      </Tooltip>
    ) : (
      node
    )

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 60 : 232 }}
      transition={{ type: "spring", stiffness: 400, damping: 36 }}
      className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-2.5 py-3 text-sidebar-foreground md:flex"
    >
      <div className={cn("flex h-9 items-center", collapsed ? "justify-center" : "justify-between pl-1.5")}>
        <Link href="/today" aria-label="Ember">
          {collapsed ? <LogoMark /> : <Logo className="text-[0.95rem]" />}
        </Link>
        {!collapsed && (
          <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label="Collapse sidebar" className="text-muted-foreground">
            <PanelLeft />
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-1">
        {item(
          "Search",
          "⌘K",
          <button
            onClick={onOpenCommand}
            className={cn(
              "flex h-8 w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-background/40 text-sm text-muted-foreground transition-colors hover:text-foreground",
              collapsed ? "justify-center" : "px-2.5"
            )}
          >
            <Search className="size-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Search…</span>
                <kbd className="font-mono text-[10px] opacity-70">⌘K</kbd>
              </>
            )}
          </button>
        )}
        {item(
          "New habit",
          "N",
          <button
            onClick={openCreate}
            className={cn(
              "flex h-8 w-full items-center gap-2.5 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
              collapsed ? "justify-center" : "px-2.5"
            )}
          >
            <Plus className="size-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">New habit</span>
                <kbd className="font-mono text-[10px] opacity-70">N</kbd>
              </>
            )}
          </button>
        )}
      </div>

      <nav className="mt-5 space-y-0.5">
        {!collapsed && <p className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">Workspace</p>}
        {NAV.map(({ href, label, icon: Icon, shortcut }) => {
          const active = pathname.startsWith(href)
          return (
            <div key={href}>
              {item(
                label,
                shortcut,
                <Link
                  href={href}
                  className={cn(
                    "relative flex h-8 items-center gap-2.5 rounded-lg text-sm transition-colors",
                    collapsed ? "justify-center" : "px-2.5",
                    active ? "text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-sidebar-accent"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <Icon className={cn("relative size-4 shrink-0", active && "text-ember")} />
                  {!collapsed && <span className="relative">{label}</span>}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      <div className={cn("mt-auto flex flex-col gap-1", collapsed && "items-center")}>
        {collapsed && (
          <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label="Expand sidebar" className="text-muted-foreground">
            <PanelLeft />
          </Button>
        )}
        <AccountMenu email={email} collapsed={collapsed} />
      </div>
    </motion.aside>
  )
}

function Avatar({ email, className }: { email: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#FFB26B] to-[#E0342B] text-[11px] font-semibold text-white uppercase",
        className
      )}
    >
      {email?.[0] ?? "?"}
    </span>
  )
}

function AccountMenu({ email, collapsed }: { email: string | null; collapsed: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [signingOut, startSignOut] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className={cn(
            "flex items-center gap-2.5 rounded-lg text-left transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-sidebar-accent",
            collapsed ? "size-9 justify-center" : "w-full px-2 py-1.5"
          )}
        >
          <Avatar email={email} />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{email}</span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground/70" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? "right" : "top"} align={collapsed ? "end" : "start"} className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2.5 font-normal">
          <Avatar email={email} className="size-7 text-xs" />
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">Signed in as</span>
            <span className="block truncate text-sm text-foreground">{email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          role="menuitemcheckbox"
          aria-checked={isDark}
          onSelect={(e) => {
            // Keep the menu open so the switch visibly flips.
            e.preventDefault()
            setTheme(isDark ? "light" : "dark")
          }}
        >
          <Moon />
          Dark mode
          <Switch
            checked={isDark}
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none ml-auto data-checked:bg-ember"
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={signingOut}
          onSelect={(e) => {
            e.preventDefault()
            startSignOut(() => signOut())
          }}
        >
          {signingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function MobileNav({ onOpenCommand }: { onOpenCommand: () => void }) {
  const pathname = usePathname()
  const { openCreate } = useHabitDialog()

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border bg-popover/85 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-xl md:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] transition-colors",
              active ? "bg-accent text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("size-5", active && "text-ember")} />
            {label}
          </Link>
        )
      })}
      <button onClick={onOpenCommand} className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] text-muted-foreground">
        <Search className="size-5" />
        Search
      </button>
      <button
        onClick={openCreate}
        aria-label="New habit"
        className="ml-1 grid size-11 shrink-0 place-items-center rounded-xl bg-ember text-white shadow-[0_0_20px_color-mix(in_oklch,var(--ember)_50%,transparent)]"
      >
        <Plus className="size-5" />
      </button>
    </nav>
  )
}
