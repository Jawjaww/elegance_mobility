"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/database/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AlreadyLoggedIn } from "@/components/ui/AlreadyLoggedIn"
import { useSearchParams } from "next/navigation"
import CustomerSignup from "@/components/auth/CustomerSignup"

export default function SignupPage() {
  const [checking, setChecking] = useState(true)
  const [role, setRole] = useState<string | undefined>()
  const searchParams = useSearchParams()
  const from = searchParams?.get("from")

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setRole((session.user as any).raw_app_meta_data?.role)
      }
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (role) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center py-8">
        <AlreadyLoggedIn role={role} />
      </div>
    )
  }

  // Si from=driver, rediriger vers la page d'inscription chauffeur
  if (from === 'driver') {
    window.location.href = '/auth/signup/driver'
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return <CustomerSignup />
}