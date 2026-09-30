import Link from "next/link"
import { ArrowRight, Command, Flame, MousePointerClick, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { HeroPreview } from "@/components/landing/hero-preview"
import { getUserId } from "@/lib/supabase/server"

const FEATURES = [
  {
    icon: MousePointerClick,
    title: "One tap a day",
    body: "Check off habits in a single click, or press 1–9 on your keyboard. No friction, no clutter.",
  },
  {
    icon: Flame,
    title: "Streaks that motivate",
    body: "Watch your streak grow. Miss a day and it resets, so there's a real reason to show up.",
  },
  {
    icon: Command,
    title: "Built for the keyboard",
    body: "⌘K opens a command palette for everything: add habits, check them off, switch themes.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Passwordless sign-in and row-level security. Your data is yours alone.",
  },
]

export default async function Home() {
  const signedIn = Boolean(await getUserId())
  const cta = signedIn ? { href: "/today", label: "Open Ember" } : { href: "/login", label: "Start your streak" }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(70%_50%_at_50%_0%,#000,transparent)]" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Ember home">
          <Logo />
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link href={cta.href}>{signedIn ? "Open app" : "Sign in"}</Link>
        </Button>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 text-center sm:pt-24">
          <Link
            href={cta.href}
            className="hairline mx-auto mb-8 inline-flex items-center gap-2 rounded-full bg-surface/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
          >
            <span className="size-1.5 rounded-full bg-ember shadow-[0_0_10px_var(--ember)]" />
            Small habits. Lasting change.
            <ArrowRight className="size-3" />
          </Link>
          <h1 className="text-balance-tight mx-auto max-w-3xl text-5xl font-semibold sm:text-7xl">
            Keep the{" "}
            <span className="bg-gradient-to-b from-[#FFB26B] via-[#FF6B35] to-[#E0342B] bg-clip-text text-transparent">
              flame
            </span>{" "}
            alive.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
            Ember is a calm, beautifully simple habit tracker. Show up each day, check it off, and watch your
            streaks burn brighter.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11 rounded-xl px-5 text-[0.95rem]">
              <Link href={cta.href}>
                {cta.label}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>

          <div className="mt-20">
            <HeroPreview />
          </div>
        </section>

        <section className="border-t bg-surface/40">
          <div className="mx-auto grid max-w-6xl gap-px overflow-hidden px-6 py-20 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="py-6 lg:py-0">
                <span className="hairline mb-4 grid size-9 place-items-center rounded-lg bg-surface text-ember">
                  <Icon className="size-4" />
                </span>
                <h3 className="font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <Logo className="text-sm text-foreground" />
          <span>Built with Next.js &amp; Supabase</span>
        </div>
      </footer>
    </div>
  )
}
