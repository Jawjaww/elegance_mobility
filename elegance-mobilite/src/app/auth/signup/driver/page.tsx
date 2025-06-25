"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/database/client"
import { useRouter } from "next/navigation"
import ModernDriverSignup from "@/components/auth/ModernDriverSignup"
import { PageLoading } from "@/components/ui/loading"

export default function DriverSignupPage() {
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

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

  return <ModernDriverSignup />
}