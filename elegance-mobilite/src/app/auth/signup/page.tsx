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
          // Vérifier si l'utilisateur existe toujours dans auth.users
          const { data: { user }, error } = await supabase.auth.getUser()
          
          if (error || !user) {
            console.log('🔄 Session fantôme détectée - utilisateur supprimé, nettoyage...')
            await supabase.auth.signOut()
            setIsChecking(false)
            return
          }
          
          // L'utilisateur existe vraiment, rediriger
          router.replace('/auth/already-connected?redirect=signup')
          return
        }
        setIsChecking(false)
      } catch (error) {
        console.error('Erreur vérification session:', error)
        await supabase.auth.signOut()
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