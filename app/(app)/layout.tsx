import { cookies } from "next/headers"
import { AppShell } from "@/components/app/app-shell"
import { getHabits, getToday, getUserEmail } from "@/lib/data"

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [habits, today, email, cookieStore] = await Promise.all([getHabits(), getToday(), getUserEmail(), cookies()])

  return (
    <AppShell
      habits={habits}
      today={today}
      email={email}
      initialCollapsed={cookieStore.get("sidebar-collapsed")?.value === "1"}
    >
      {children}
    </AppShell>
  )
}
