"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, Eye, EyeOff, Loader2, MailCheck, Wand2 } from "lucide-react"
import type { AuthError } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MIN_PASSWORD } from "@/lib/auth"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Mode = "signin" | "signup" | "magic" | "forgot"
type Sent = { title: string; body: string } | null

const spring = { type: "spring", stiffness: 300, damping: 28 } as const
const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: spring }

function friendly(error: AuthError) {
  if (error.status === 429) return "Too many attempts. Wait a minute and try again."
  if (error.code === "invalid_credentials") return "Wrong email or password."
  if (error.code === "email_not_confirmed") return "Confirm your email first. Check your inbox for the link."
  if (error.code === "user_already_exists") return "An account with this email already exists. Sign in instead."
  if (error.code === "weak_password") return "That password is too weak. Try a longer one."
  return error.message
}

export function LoginForm({ linkError }: { linkError: boolean }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState<Sent>(null)
  const [error, setError] = useState<string | null>(
    linkError ? "That link is invalid or expired. Request a new one." : null
  )

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
  }

  const callback = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (mode === "signup" && password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters.`)
      return
    }

    setPending(true)
    const { auth } = createClient()

    try {
      if (mode === "signin") {
        const { error } = await auth.signInWithPassword({ email, password })
        if (error) return setError(friendly(error))
        router.replace("/today")
        router.refresh()
        return
      }

      if (mode === "signup") {
        const { data, error } = await auth.signUp({ email, password, options: { emailRedirectTo: callback("/today") } })
        if (error) return setError(friendly(error))
        // With email confirmation off, Supabase signs the user in straight away.
        if (data.session) {
          router.replace("/today")
          router.refresh()
          return
        }
        // Supabase hides whether an email is taken; an existing user comes back with no identities.
        if (data.user && data.user.identities?.length === 0) {
          return setError("An account with this email already exists. Sign in instead.")
        }
        return setSent({ title: "Confirm your email", body: "We sent a confirmation link to" })
      }

      if (mode === "magic") {
        const { error } = await auth.signInWithOtp({ email, options: { emailRedirectTo: callback("/today") } })
        if (error) return setError(friendly(error))
        return setSent({ title: "Check your inbox", body: "We sent a sign-in link to" })
      }

      const { error } = await auth.resetPasswordForEmail(email, { redirectTo: callback("/reset-password") })
      if (error) return setError(friendly(error))
      setSent({ title: "Reset link sent", body: "If an account exists, we sent a password reset link to" })
    } finally {
      setPending(false)
    }
  }

  const titles: Record<Mode, { title: string; subtitle: string; cta: string }> = {
    signin: { title: "Welcome back", subtitle: "Sign in to keep your streaks going.", cta: "Sign in" },
    signup: { title: "Create your account", subtitle: "Start building habits that stick.", cta: "Create account" },
    magic: { title: "Sign in with email", subtitle: "We'll email you a one-tap sign-in link.", cta: "Send magic link" },
    forgot: { title: "Reset your password", subtitle: "We'll email you a link to choose a new one.", cta: "Send reset link" },
  }
  const t = titles[mode]
  const usesPassword = mode === "signin" || mode === "signup"

  return (
    <div className="hairline overflow-hidden rounded-2xl bg-surface/80 p-7 shadow-2xl shadow-black/10 backdrop-blur-xl">
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div key="sent" {...fade} className="text-center">
            <motion.span
              initial={{ scale: 0.5, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.05 }}
              className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-ember/15 text-ember"
            >
              <MailCheck className="size-6" />
            </motion.span>
            <h1 className="text-xl font-semibold tracking-tight">{sent.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {sent.body} <span className="font-medium text-foreground">{email}</span>. Open it in this browser to
              continue.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-6"
              onClick={() => {
                setSent(null)
                switchMode("signin")
              }}
            >
              <ArrowLeft data-icon="inline-start" />
              Back to sign in
            </Button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={onSubmit} {...fade}>
            {usesPassword && (
              <div role="tablist" aria-label="Sign in or create account" className="mb-6 grid grid-cols-2 rounded-xl border bg-muted/40 p-1">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => switchMode(m)}
                    className={cn(
                      "relative rounded-lg py-1.5 text-sm transition-colors",
                      mode === m ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode === m && (
                      <motion.span
                        layoutId="auth-tab"
                        className="absolute inset-0 rounded-lg bg-background shadow-sm ring-1 ring-border"
                        transition={{ type: "spring", stiffness: 500, damping: 36 }}
                      />
                    )}
                    <span className="relative">{m === "signin" ? "Sign in" : "Create account"}</span>
                  </button>
                ))}
              </div>
            )}

            <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t.subtitle}</p>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                />
              </div>

              {usesPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={mode === "signup" ? MIN_PASSWORD : undefined}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      placeholder={mode === "signup" ? `At least ${MIN_PASSWORD} characters` : "••••••••"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <Button type="submit" className="mt-5 h-10 w-full" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : t.cta}
            </Button>

            {usesPassword ? (
              <>
                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  or
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Button type="button" variant="outline" className="h-10 w-full" onClick={() => switchMode("magic")}>
                  <Wand2 data-icon="inline-start" />
                  Email me a magic link instead
                </Button>
              </>
            ) : (
              <Button type="button" variant="ghost" size="sm" className="mt-3 w-full" onClick={() => switchMode("signin")}>
                <ArrowLeft data-icon="inline-start" />
                Back to password sign in
              </Button>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
