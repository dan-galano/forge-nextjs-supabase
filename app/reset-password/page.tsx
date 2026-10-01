import type { Metadata } from "next"
import Link from "next/link"
import { LogoMark } from "@/components/logo"
import { ResetPasswordForm } from "./reset-password-form"

export const metadata: Metadata = { title: "Choose a new password" }

export default function ResetPasswordPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center px-6 py-16">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(50%_45%_at_50%_40%,#000,transparent)]" />
      <div className="w-full max-w-sm">
        <Link href="/" className="mx-auto mb-8 flex w-fit" aria-label="Ember home">
          <LogoMark className="size-10" />
        </Link>
        <div className="hairline rounded-2xl bg-surface/80 p-7 shadow-2xl shadow-black/10 backdrop-blur-xl">
          <h1 className="text-xl font-semibold tracking-tight">Choose a new password</h1>
          <p className="mt-1.5 mb-6 text-sm text-muted-foreground">You&rsquo;ll use it to sign in from now on.</p>
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  )
}
