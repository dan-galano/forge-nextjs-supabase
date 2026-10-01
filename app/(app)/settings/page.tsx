import type { Metadata } from "next"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemePicker } from "@/components/app/theme-picker"
import { PasswordForm } from "@/components/password-form"
import { getTimeZone, getUserEmail } from "@/lib/data"
import { signOut } from "../actions"

export const metadata: Metadata = { title: "Settings" }

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 py-7 sm:grid-cols-[1fr_1.4fr] sm:gap-8">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  )
}

export default async function SettingsPage() {
  const [email, tz] = await Promise.all([getUserEmail(), getTimeZone()])

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
      <div className="mt-6 divide-y border-t">
        <Section title="Appearance" description="Choose how Ember looks. System follows your OS.">
          <ThemePicker />
        </Section>
        <Section title="Account" description="The email you sign in with.">
          <div className="hairline flex items-center gap-3 rounded-xl bg-surface/60 px-4 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#FFB26B] to-[#E0342B] text-sm font-semibold text-white uppercase">
              {email?.[0] ?? "?"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{email}</p>
              <p className="text-xs text-muted-foreground">Time zone: {tz}</p>
            </div>
          </div>
          <form action={signOut} className="mt-4">
            <Button variant="outline" type="submit">
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </form>
        </Section>
        <Section
          title="Password"
          description="Set a password to sign in without waiting for an email. Magic links keep working too."
        >
          <div className="max-w-sm">
            <PasswordForm />
          </div>
        </Section>
        <Section title="Keyboard shortcuts" description="Ember is built to be driven from the keyboard.">
          <dl className="space-y-2 text-sm">
            {[
              ["Command palette", "⌘ K"],
              ["New habit", "N"],
              ["Check off habit", "1 – 9"],
              ["Go to Today / Habits / Settings", "G T · G H · G S"],
              ["Toggle sidebar", "["],
            ].map(([label, keys]) => (
              <div key={label} className="flex items-center justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>
                  <kbd className="rounded-md border bg-muted/50 px-1.5 py-0.5 font-mono text-xs">{keys}</kbd>
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </div>
  )
}
