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

  return <ModernDriverSignup />
}