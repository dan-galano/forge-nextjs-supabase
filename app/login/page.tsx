import type { Metadata } from "next"
import Link from "next/link"
import { LogoMark } from "@/components/logo"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams

  return (
    <main className="relative flex flex-1 items-center justify-center px-6 py-16">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(50%_45%_at_50%_40%,#000,transparent)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/4 left-1/2 -z-10 size-[28rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklch, var(--ember) 40%, transparent), transparent 70%)" }}
      />
      <div className="w-full max-w-sm">
        <Link href="/" className="mx-auto mb-8 flex w-fit" aria-label="Ember home">
          <LogoMark className="size-10" />
        </Link>
        <LoginForm linkError={error === "link"} />
      </div>
    </main>
  )
}
