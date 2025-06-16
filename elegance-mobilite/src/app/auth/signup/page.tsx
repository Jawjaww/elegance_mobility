"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/database/client"
import { useRouter, useSearchParams } from "next/navigation"
import CustomerSignup from "@/components/auth/CustomerSignup"
import { PageLoading } from "@/components/ui/loading"

export default function SignupPage() {
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams?.get("from")

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Redirection silencieuse vers la page de déconnexion
          router.replace('/auth/already-connected?redirect=signup')
          return
        }
        setIsChecking(false)
      } catch (error) {
        console.error('Erreur vérification session:', error)
        setIsChecking(false)
      }
    }
    
    checkSession()
  }, [router])

  // Loading minimal 
  if (isChecking) {
    return <PageLoading />
  }

  // Si from=driver, rediriger vers la page d'inscription chauffeur
  if (from === 'driver') {
    router.replace('/auth/signup/driver')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Redirection...</div>
      </div>
    )
  }

  return <CustomerSignup />
}