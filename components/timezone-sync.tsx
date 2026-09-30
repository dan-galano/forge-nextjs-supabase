"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Stores the browser's time zone in a cookie so the server knows the user's "today". */
export function TimezoneSync() {
  const router = useRouter()

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const current = document.cookie.match(/(?:^|; )tz=([^;]*)/)?.[1]
    if (current && decodeURIComponent(current) === tz) return
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }, [router])

  return null
}
