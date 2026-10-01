"use client"

import { useRouter } from "next/navigation"
import { PasswordForm } from "@/components/password-form"

export function ResetPasswordForm() {
  const router = useRouter()
  return <PasswordForm submitLabel="Save and continue" onSuccess={() => router.replace("/today")} />
}
