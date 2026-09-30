"use client"

import { motion } from "motion/react"

export function ProgressRing({ value, total, size = 56 }: { value: number; total: number; size?: number }) {
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = total ? value / total : 0

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ember)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{ filter: pct === 1 ? "drop-shadow(0 0 6px var(--ember))" : undefined }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xs font-medium tabular-nums">
        {Math.round(pct * 100)}%
      </span>
    </div>
  )
}
