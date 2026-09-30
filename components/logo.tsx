import { useId } from "react"
import { cn } from "@/lib/utils"

export function LogoMark({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn("size-6", className)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB26B" />
          <stop offset="0.55" stopColor="#FF6B35" />
          <stop offset="1" stopColor="#E0342B" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="7" fill={`url(#${id}-g)`} />
      <path
        d="M12.3 5.5c.4 2.2 3.7 3.9 3.7 7.6a4 4 0 0 1-8 0c0-1.5.7-2.6 1.6-3.4.1 1.1.6 1.9 1.4 2.2-.4-2.4.2-4.7 1.3-6.4Z"
        fill="white"
        fillOpacity="0.95"
      />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span>Ember</span>
    </span>
  )
}
