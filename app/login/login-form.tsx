"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export function LoginForm({ linkError }: { linkError: boolean }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle")
  const [error, setError] = useState<string | null>(
    linkError ? "That sign-in link is invalid or expired. Request a new one." : null
  )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/today` },
    })
    if (error) {
      setError(error.status === 429 ? "Too many requests. Wait a minute and try again." : error.message)
      setStatus("idle")
    } else {
      setStatus("sent")
    }
  }

  return (
    <div className="hairline overflow-hidden rounded-2xl bg-surface/80 p-7 shadow-2xl shadow-black/10 backdrop-blur-xl">
      <AnimatePresence mode="wait" initial={false}>
        {status === "sent" ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="text-center"
          >
            <motion.span
              initial={{ scale: 0.5, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.05 }}
              className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-ember/15 text-ember"
            >
              <MailCheck className="size-6" />
            </motion.span>
            <h1 className="text-xl font-semibold tracking-tight">Check your inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>. Open it on
              this device to continue.
            </p>
            <Button variant="ghost" size="sm" className="mt-6" onClick={() => setStatus("idle")}>
              <ArrowLeft data-icon="inline-start" />
              Use a different email
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <h1 className="text-xl font-semibold tracking-tight">Welcome to Ember</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in or create an account with a magic link.</p>
            <div className="mt-6 space-y-2">
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
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <Button type="submit" className="mt-5 h-10 w-full" disabled={status === "sending"}>
              {status === "sending" ? <Loader2 className="animate-spin" /> : "Send magic link"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
